import React, { useState, useEffect } from 'react';
import { useProductStore } from '../store/productStore';
import { supabase } from '../lib/supabase';
import Footer from '../components/Footer';
import { ChevronLeft, ChevronRight, ArrowLeft, Loader2, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sendOrderConfirmationEmail } from '../lib/mailgun';

interface ShippingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  address: string;
  zipCode: string;
}

const COUNTRIES = [
  { code: 'usa', name: 'United States' },
  { code: 'uk', name: 'United Kingdom' },
  { code: 'ca', name: 'Canada' }
];

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
];

export default function LandingPage() {
  const { settings, fetchSettings } = useProductStore();
  const [step, setStep] = useState(1);
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    state: '',
    city: '',
    address: '',
    zipCode: ''
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  
  // Combine main image with additional images
  const images = settings ? [
    settings.image_url,
    ...(settings.additional_images || [])
  ].filter(Boolean) as string[] : [];

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePayPalTransaction = async () => {
    const finalPrice = settings ? (settings.price - settings.discount) : 0;
    
    try {
      // @ts-ignore
      if (!window.paypal) {
        throw new Error('PayPal SDK not loaded');
      }

      // @ts-ignore
      await window.paypal.Buttons({
        createOrder: (_data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: finalPrice.toString()
              }
            }]
          });
        },
        onApprove: async (data: any, actions: any) => {
          try {
            const details = await actions.order.capture();
            console.log('Payment completed:', details);

            if (details.status !== 'COMPLETED') {
              throw new Error('Payment not completed');
            }

            // Insert order into database
            const { data: orderData, error } = await supabase.from('orders').insert([{
              first_name: shippingDetails.firstName,
              last_name: shippingDetails.lastName,
              email: shippingDetails.email,
              phone: shippingDetails.phone,
              country: shippingDetails.country,
              address: shippingDetails.address,
              zip_code: shippingDetails.zipCode,
              paypal_order_id: data.orderID,
              status: 'paid'
            }]).select().single();

            if (error) {
              console.error('Error inserting order:', error);
              throw error;
            }

            // Send confirmation email
            try {
              await sendOrderConfirmationEmail({
                customerName: `${shippingDetails.firstName} ${shippingDetails.lastName}`,
                orderNumber: orderData.id,
                amount: settings ? (settings.price - settings.discount) : 0,
                email: shippingDetails.email
              });
            } catch (emailError) {
              console.error('Failed to send confirmation email:', emailError);
              // Don't throw here - we don't want to interrupt the success flow
            }

            // Show success modal
            setTimeout(async () => {
              const result = await showSuccessModal();
              if (result) {
                window.location.reload();
              }
            }, 1000);
          } catch (error) {
            console.error('Error processing order:', error);
            alert('There was an error processing your order. Please contact support.');
          }
        },
        onCancel: () => {
          console.log('Payment cancelled');
        },
        onError: (err: any) => {
          console.error('PayPal error:', err);
          alert('There was an error processing your payment. Please try again.');
        }
      }).render('#paypal-button-container');
    } catch (error) {
      console.error('PayPal error:', error);
      alert('There was an error processing your payment. Please try again.');
    }
  };

  const showSuccessModal = () => {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
      modal.style.zIndex = '100000'; // Higher z-index than PayPal
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center relative">
          <div class="mb-4 flex justify-center">
            <svg class="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h3>
          <p class="text-gray-600 mb-6">Thank you for your purchase. You will receive a confirmation email shortly.</p>
          <button class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            OK
          </button>
        </div>
      `;

      document.body.appendChild(modal);

      const button = modal.querySelector('button');
      button?.addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(true);
      });
    });
  };

  // Add back button handler
  const handleBack = () => {
    setStep(1);
  };

  useEffect(() => {
    if (step === 2) {
      handlePayPalTransaction();
    }
  }, [step]);

  const scrollToForm = () => {
    document.getElementById('shipping-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
        <p className="text-gray-500">Please wait while we prepare your experience</p>
      </div>
    );
  }

  const finalPrice = settings.price - settings.discount;
  const isUSA = shippingDetails.country === 'usa';

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const VideoModal = () => (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={() => setShowVideo(false)}
    >
      <div className="bg-white p-4 rounded-lg w-full max-w-3xl mx-4 relative" onClick={e => e.stopPropagation()}>
        <button 
          onClick={() => setShowVideo(false)}
          className="absolute -top-4 -right-4 bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="relative pt-[56.25%]">
          <iframe
            className="absolute inset-0 w-full h-full"
            src="https://www.youtube.com/embed/Zph7YXfjMhg?si=_DuTDPDblhSz8Jtc"
            title="Product Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
              Ruby Store
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <Link 
              to="/track" 
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
            >
              <Package className="w-4 h-4 mr-1" />
              Track Order
            </Link>
            <span className="text-sm text-gray-500">Limited Time Offer!</span>
            {settings.discount > 0 && (
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Save ${settings.discount}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          {/* Image Slider */}
          {images.length > 0 && (
            <div className="max-w-2xl mx-auto py-8">
              {/* Main Image Container - Updated to 336x600 */}
              <div className="relative w-[344px] h-[628px] mb-4 mx-auto">
                <img
                  src={images[currentImageIndex]}
                  alt={`${settings.title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Thumbnails Container */}
              <div className="flex justify-center gap-2 mb-4">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${
                      index === currentImageIndex ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Product thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Arrows Container */}
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={prevImage}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
                <button
                  onClick={nextImage}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <ChevronRight className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>
          )}

          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 max-w-screen-md mx-auto leading-relaxed px-4">
            {settings.description}
          </p>
          
          {/* Move video button here */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setShowVideo(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
              Watch Video
            </button>
          </div>

          <div className="mt-6 mb-8 flex flex-col items-center">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-extrabold text-green-600">${finalPrice}</span>
              {settings.discount > 0 && (
                <>
                  <span className="text-2xl text-gray-500 line-through">${settings.price}</span>
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-lg font-bold animate-pulse">
                    Save ${settings.discount}!
                  </span>
                </>
              )}
            </div>
            
            <div className="mt-2 bg-yellow-100 text-yellow-800 px-4 py-1 rounded-full text-sm font-semibold">
              Limited Time Offer! 🔥
            </div>
          </div>

          <button
            onClick={scrollToForm}
            className="bg-blue-600 text-white text-lg font-semibold px-8 py-4 rounded-lg shadow-lg hover:bg-blue-700 transform transition hover:scale-105"
          >
            Buy Now
          </button>

          {/* Promotional Text */}
          <div className="mt-8 space-y-4 text-sm text-gray-600">
            <p className="flex items-center justify-center">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded mr-2">🚚</span>
              Free Shipping Worldwide
            </p>
            <p className="flex items-center justify-center">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">⚡️</span>
              Instant Digital Delivery
            </p>
            <p className="flex items-center justify-center">
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded mr-2">🔒</span>
              Secure Payment via PayPal
            </p>
          </div>
        </div>

        {step === 1 ? (
          <form id="shipping-form" onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={shippingDetails.firstName}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={shippingDetails.lastName}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={shippingDetails.email}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={shippingDetails.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <select
                  name="country"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={shippingDetails.country}
                  onChange={handleInputChange}
                >
                  <option value="">Select a country</option>
                  {COUNTRIES.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              {isUSA ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <select
                    name="state"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={shippingDetails.state}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a state</option>
                    {US_STATES.map(state => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    name="city"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={shippingDetails.city}
                    onChange={handleInputChange}
                  />
                </div>
              )}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  name="address"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={shippingDetails.address}
                  onChange={handleInputChange}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                <input
                  type="text"
                  name="zipCode"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={shippingDetails.zipCode}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="mt-6">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Continue to Payment
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-lg relative">
            <div className="flex flex-col sm:flex-row items-center mb-6">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4 sm:mb-0"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
              <h2 className="text-2xl font-semibold w-full text-center">
                Complete Your Purchase
              </h2>
            </div>
            <div id="paypal-button-container"></div>
          </div>
        )}
      </div>

      <Footer />

      {showVideo && <VideoModal />}
    </div>
  );
}