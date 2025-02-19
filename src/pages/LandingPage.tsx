import React, { useState, useEffect } from 'react';
import { useProductStore } from '../store/productStore';
import { supabase } from '../lib/supabase';
import Footer from '../components/Footer';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

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
        onApprove: async (data: any, _actions: any) => {
          try {
            const { error } = await supabase.from('orders').insert([{
              first_name: shippingDetails.firstName,
              last_name: shippingDetails.lastName,
              email: shippingDetails.email,
              phone: shippingDetails.phone,
              country: shippingDetails.country,
              address: shippingDetails.address,
              zip_code: shippingDetails.zipCode,
              paypal_order_id: data.orderID,
              status: 'pending'
            }]);

            if (error) {
              console.error('Error inserting order:', error);
              throw error;
            }

            alert('Thank you for your purchase!');
            // Refresh the page after successful purchase
            window.location.reload();
          } catch (error) {
            console.error('Error processing order:', error);
            alert('There was an error processing your order. Please contact support.');
          }
        }
      }).render('#paypal-button-container');
    } catch (error) {
      console.error('PayPal error:', error);
      alert('There was an error processing your payment. Please try again.');
    }
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

  if (!settings) return <div>Loading...</div>;

  const finalPrice = settings.price - settings.discount;
  const isUSA = shippingDetails.country === 'usa';

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Your Store Name</h1>
          <div className="flex items-center space-x-4">
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{settings.title}</h1>
          
          {/* Image Carousel */}
          {images.length > 0 && (
            <div className="relative mb-8 group">
              <div className="relative aspect-w-16 aspect-h-9">
                <img
                  src={images[currentImageIndex]}
                  alt={`${settings.title} - Image ${currentImageIndex + 1}`}
                  className="mx-auto rounded-lg shadow-lg max-w-md w-full h-auto object-cover"
                />
                
                {/* Navigation Dots */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation Arrows - Only show if there are multiple images */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          )}

          <p className="text-xl text-gray-600 mb-8">{settings.description}</p>
          
          <div className="mt-6 mb-8">
            <span className="text-3xl font-bold text-gray-900">${finalPrice}</span>
            {settings.discount > 0 && (
              <span className="ml-2 text-lg text-gray-500 line-through">${settings.price}</span>
            )}
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
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="flex items-center mb-6 relative">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors absolute left-0"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Shipping Details
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
    </div>
  );
}