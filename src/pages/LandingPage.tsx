import React, { useState, useEffect, useRef, TouchEvent } from 'react';
import { useProductStore } from '../store/productStore';
import { supabase } from '../lib/supabase';
import Footer from '../components/Footer';
import { ChevronLeft, ChevronRight, ArrowLeft, Loader2, Package, Ruler, Scale, Box, Shield, X } from 'lucide-react';
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

interface PromotionalImage {
  id: number;
  image_url: string;
  alt_text: string;
  created_at: string;
}

interface Specification {
  id: number;
  title: string;
  description: string;
  icon: string;
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
  const [quantity, setQuantity] = useState(1);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [promotionalImages, setPromotionalImages] = useState<PromotionalImage[]>([]);
  const [selectedPromoImage, setSelectedPromoImage] = useState<PromotionalImage | null>(null);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [activeTab, setActiveTab] = useState('description');
  
  // Combine main image with additional images
  const images = settings ? [
    settings.image_url,
    ...(settings.additional_images || [])
  ].filter(Boolean) as string[] : [];

  useEffect(() => {
    fetchSettings();
    fetchPromotionalImages();
    fetchSpecifications();
  }, [fetchSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const calculateTotalPrice = (basePrice: number, discount: number, qty: number) => {
    return (basePrice - discount) * qty;
  };

  const handlePayPalTransaction = async () => {
    if (!settings) return;
    const totalAmount = calculateTotalPrice(settings.price, settings.discount, quantity);
    
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
                value: totalAmount.toFixed(2)
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
                amount: totalAmount,
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

  const fetchPromotionalImages = async () => {
    const { data, error } = await supabase
      .from('promotional_images')
      .select('*')
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching promotional images:', error);
      return;
    }
    
    setPromotionalImages(data || []);
  };

  const fetchSpecifications = async () => {
    const { data, error } = await supabase
      .from('specifications')
      .select('*')
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching specifications:', error);
      return;
    }
    
    setSpecifications(data || []);
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#317546]" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
        <p className="text-gray-500">Please wait while we prepare your experience</p>
      </div>
    );
  }

  const isUSA = shippingDetails.country === 'usa';

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const VideoModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden">
          <button
            onClick={() => setShowVideo(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative pt-[56.25%]">
            {settings?.video_url && (
              <iframe
                src={settings.video_url.replace('watch?v=', 'embed/')}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const QuantityModal = () => (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={() => setShowQuantityModal(false)}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-xs p-4 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => setShowQuantityModal(false)}
          className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-100"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="text-green-600 mr-2">●</span>
          In Stock
        </h3>
        
        <div className="flex items-center justify-between border rounded-lg p-2 mb-4">
          <button 
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded"
          >
            -
          </button>
          <span className="text-lg font-medium">{quantity}</span>
          <button 
            onClick={() => setQuantity(q => Math.min(10, q + 1))}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded"
          >
            +
          </button>
        </div>

        <button
          onClick={() => setShowQuantityModal(false)}
          className="w-full bg-[#ffa41c] hover:bg-[#f49b1a] text-black py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#f49b1a] focus:ring-offset-2"
        >
          Done
        </button>
      </div>
    </div>
  );

  const FullScreenImageViewer = () => {
    const touchStart = useRef<number>(0);
    const touchEnd = useRef<number>(0);

    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEnd.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
      const swipeDistance = touchStart.current - touchEnd.current;
      const minSwipeDistance = 50;

      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0) {
          nextImage();
        } else {
          prevImage();
        }
      }
    };

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header - Updated with white background */}
        <div className="relative h-12 flex items-center px-4 border-b">
          <button
            onClick={() => setShowFullScreen(false)}
            className="text-gray-800 flex items-center"
          >
            <ArrowLeft className="w-6 h-6 mr-2" />
            Back
          </button>
        </div>

        {/* Main Image */}
        <div 
          className="flex-1 flex items-center justify-center bg-white"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={images[currentImageIndex]}
            alt={`${settings.title} - Image ${currentImageIndex + 1}`}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        {/* Thumbnails Container with Arrows - Updated positioning */}
        <div className="relative flex items-center justify-center mb-4">
          {/* Left Arrow - Adjusted position */}
          <button
            onClick={prevImage}
            className="absolute left-2 p-2 hover:bg-gray-100 rounded-full bg-white shadow-md z-10"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* Thumbnails - Updated border color */}
          <div className="flex justify-center gap-2 px-8">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${
                  index === currentImageIndex 
                    ? 'ring-2 ring-[#232f3e] border border-[#232f3e]' 
                    : 'border border-gray-100'
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

          {/* Right Arrow - Adjusted position */}
          <button
            onClick={nextImage}
            className="absolute right-2 p-2 hover:bg-gray-100 rounded-full bg-white shadow-md z-10"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    );
  };

  const PromoImageViewer = () => {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="relative h-12 flex items-center px-4 border-b">
          <button
            onClick={() => setSelectedPromoImage(null)}
            className="text-gray-800 flex items-center"
          >
            <ArrowLeft className="w-6 h-6 mr-2" />
            Back
          </button>
        </div>

        {/* Image */}
        <div className="flex-1 flex items-center justify-center bg-white p-4">
          <img
            src={selectedPromoImage?.image_url}
            alt={selectedPromoImage?.alt_text}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <Link to="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
              Solo Drops
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
        {/* Add product title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          {settings.title}
        </h1>

        {/* Hero Section */}
        <div className="text-center mb-12">
          {/* Image Slider */}
          {images.length > 0 && (
            <div className="max-w-2xl mx-auto py-8">
              {/* Main Image Container - Make responsive */}
              <div className="relative w-full max-w-[414px] h-[500px] mb-4 mx-auto">
                {/* Best Choice Sticker */}
                <div className="absolute -left-2 -top-2 z-10">
                  <div className="bg-[#232f3e] text-white text-sm font-bold px-4 py-1.5 rounded-lg shadow-md transform -rotate-12 flex items-center">
                    <svg 
                      className="w-4 h-4 mr-1 text-yellow-400" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Best Choice
                  </div>
                </div>

                <img
                  src={images[currentImageIndex]}
                  alt={`${settings.title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain cursor-zoom-in"
                  onClick={() => setShowFullScreen(true)}
                />
              </div>

              {/* Thumbnails Container with Arrows - Updated positioning */}
              <div className="relative flex items-center justify-center mb-4">
                {/* Left Arrow - Adjusted position */}
                <button
                  onClick={prevImage}
                  className="absolute left-2 p-2 hover:bg-gray-100 rounded-full bg-white shadow-md z-10"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>

                {/* Thumbnails - Updated border color */}
                <div className="flex justify-center gap-2 px-8">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${
                        index === currentImageIndex 
                          ? 'ring-2 ring-[#232f3e] border border-[#232f3e]' 
                          : 'border border-gray-100'
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

                {/* Right Arrow - Adjusted position */}
                <button
                  onClick={nextImage}
                  className="absolute right-2 p-2 hover:bg-gray-100 rounded-full bg-white shadow-md z-10"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Promotional Text - Centered with consistent spacing */}
              <div className="space-y-6 text-sm text-gray-600 max-w-md mx-auto my-8">
                <div className="flex items-center justify-center gap-3">
                  <span className="bg-green-100 text-green-800 w-8 h-8 flex items-center justify-center rounded">
                    🚚
                  </span>
                  <p>Free Shipping Worldwide</p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <span className="bg-purple-100 text-purple-800 w-8 h-8 flex items-center justify-center rounded">
                    🔒
                  </span>
                  <p>Secure Payment via PayPal</p>
                </div>
              </div>

              {/* Quantity and Buy Now */}
              <div className="flex flex-col items-center mt-6 mb-8">
                <button
                  onClick={() => setShowQuantityModal(true)}
                  className="text-gray-800 mb-3 flex items-center hover:text-gray-600 border border-gray-300 rounded-md px-4 py-2 hover:border-gray-400 transition-colors"
                >
                  Quantity: {quantity}
                </button>
                
                {/* Update Buy Now button to prevent overflow */}
                <button
                  onClick={scrollToForm}
                  className="bg-[#ffd814] hover:bg-[#f7ca00] text-black text-lg sm:text-xl font-semibold px-8 sm:px-16 py-4 rounded-full shadow-md transition-colors w-full max-w-md"
                >
                  Buy Now
                </button>
              </div>
            </div>
          )}

          <div className="mb-12">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`${
                    activeTab === 'description'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab('specifications')}
                  className={`${
                    activeTab === 'specifications'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Specifications
                </button>
              </nav>
            </div>

            <div className="mt-6">
              {activeTab === 'description' ? (
                <p className="text-lg sm:text-xl md:text-[1.0rem] text-gray-600 leading-relaxed px-4 text-left">
                  {settings.description}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
                  {specifications.map((spec) => (
                    <div key={spec.id} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {spec.icon === 'ruler' && <Ruler className="w-6 h-6 text-gray-400" />}
                        {spec.icon === 'scale' && <Scale className="w-6 h-6 text-gray-400" />}
                        {spec.icon === 'box' && <Box className="w-6 h-6 text-gray-400" />}
                        {spec.icon === 'shield' && <Shield className="w-6 h-6 text-gray-400" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{spec.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">{spec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Watch Video button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setShowVideo(true)}
              className="flex items-center px-4 py-2 bg-[#cc0c39] text-white rounded-lg hover:bg-[#a30a2e] transition-colors"
              disabled={!settings?.video_url}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
              Watch Video
            </button>
          </div>

          <div className="mt-6 mb-8 flex flex-col items-center">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-extrabold text-black">
                ${calculateTotalPrice(settings.price, settings.discount, quantity).toFixed(2)}
              </span>
              {settings.discount > 0 && (
                <>
                  <span className="text-2xl text-gray-500 line-through">
                    ${(settings.price * quantity).toFixed(2)}
                  </span>
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-lg font-bold animate-pulse">
                    Save ${(settings.discount * quantity).toFixed(2)}!
                  </span>
                </>
              )}
            </div>
            
            <div className="mt-2 bg-yellow-100 text-yellow-800 px-4 py-1 rounded-full text-sm font-semibold">
              Limited Time Offer! 🔥
            </div>
          </div>
        </div>

        {step === 1 ? (
          <form id="shipping-form" onSubmit={handleSubmit} className="bg-white p-4 sm:p-8 rounded-lg shadow-lg">
            {/* Name Fields - Always 2 columns */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={shippingDetails.lastName}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={shippingDetails.email}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={shippingDetails.phone}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Location Fields */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <select
                  name="country"
                  required
                  className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={shippingDetails.country}
                  onChange={handleInputChange}
                >
                  <option value="">Select</option>
                  {COUNTRIES.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                {isUSA ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <select
                      name="state"
                      required
                      className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={shippingDetails.state}
                      onChange={handleInputChange}
                    >
                      <option value="">Select</option>
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
                      className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={shippingDetails.city}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Full width fields */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                name="address"
                required
                className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={shippingDetails.address}
                onChange={handleInputChange}
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
              <input
                type="text"
                name="zipCode"
                required
                className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={shippingDetails.zipCode}
                onChange={handleInputChange}
              />
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="w-full bg-[#ffd814] hover:bg-[#f7ca00] text-black py-3 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#f7ca00] focus:ring-offset-2"
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

        {/* Promotional Images Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Why Choose Our Product?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1024px] mx-auto px-4">
            {promotionalImages.map((image) => (
              <div 
                key={image.id} 
                onClick={() => setSelectedPromoImage(image)}
                className="aspect-square w-full rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="relative w-full h-full">
                  <img
                    src={image.image_url}
                    alt={image.alt_text}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />

      {showVideo && <VideoModal />}
      {showQuantityModal && <QuantityModal />}
      {showFullScreen && <FullScreenImageViewer />}
      {selectedPromoImage && <PromoImageViewer />}
    </div>
  );
}