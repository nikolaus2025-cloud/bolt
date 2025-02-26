import { Shield, Lock, CheckCircle, CreditCard, X } from 'lucide-react';
import { useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

const Modal = ({ isOpen, onClose, title, content }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="prose max-w-none">
            {content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-gray-600">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Footer() {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const privacyContent = `At Solo Drops, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information.

Our Commitment to Privacy
We collect only the information necessary to process your orders and provide you with the best possible service. This includes your name, email address, shipping address, and payment information.

How We Use Your Information
Your personal information is used solely for processing orders, communicating about your purchase, and improving our services. We share necessary order details with our suppliers to fulfill your order. We never sell or share your data with third parties for marketing purposes.

Data Security
We implement industry-standard security measures to protect your information. All payment transactions are encrypted and processed securely through our trusted payment partners.

Information Sharing with Suppliers
As a dropshipping business, we work with third-party suppliers to fulfill your orders. We share necessary order information (shipping address, product details) with these suppliers to ensure delivery of your purchase.

Your Rights
You have the right to access, correct, or delete your personal information at any time. Contact us if you wish to exercise these rights.

Updates to Privacy Policy
We may update this policy periodically. Check back regularly to stay informed about how we protect your information.`;

  const termsContent = `Welcome to Solo Drops. By using our service, you agree to these Terms of Service.

Business Model
Solo Drops operates as a dropshipping business. This means we partner with third-party suppliers who are responsible for product fulfillment and shipping. We act as an intermediary between you and our suppliers.

Shipping and Delivery
- Delivery times can take up to 1 months from the date of purchase
- Shipping times vary depending on supplier processing and international shipping conditions
- We are not directly responsible for shipping delays or delivery issues
- Tracking information will be provided when available from our suppliers

Order Cancellation and Refunds
- Orders cannot be canceled once placed with our suppliers
- Refund requests will be processed within 12 hours if submitted before the order is placed with our supplier
- Once an order is placed with our supplier, it cannot be canceled or refunded
- We are not responsible for lost packages or delivery issues beyond our control

Product Information
We strive to provide accurate product descriptions and pricing. However, we reserve the right to correct any errors and modify prices without prior notice. Product images are representative and may vary slightly from the actual item.

Limitation of Liability
As a dropshipping business:
- We are not the manufacturer or direct shipper of products
- We are not liable for product defects, shipping damages, or delivery delays
- Our liability is limited to the purchase price of the product
- We do not guarantee specific delivery dates

Customer Service
We will assist with order inquiries and provide available tracking information, but please understand that we have limited control over the shipping and delivery process.

Changes to Terms
We may modify these terms at any time. Continued use of our service constitutes acceptance of any changes.`;

  return (
    <footer className="bg-white border-t mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <Shield className="w-8 h-8 mx-auto text-green-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Secure Shopping</p>
              <p className="text-xs text-gray-500">256-bit SSL Encryption</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="text-center">
              <Lock className="w-8 h-8 mx-auto text-blue-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Privacy Protected</p>
              <p className="text-xs text-gray-500">100% Data Security</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="text-center">
              <CreditCard className="w-8 h-8 mx-auto text-purple-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Secure Payment</p>
              <p className="text-xs text-gray-500">PayPal Verified</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Trusted Service</p>
              <p className="text-xs text-gray-500">100% Satisfaction</p>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex justify-center space-x-6">
            <img src="https://cdn-icons-png.flaticon.com/128/349/349221.png" alt="Visa" className="h-8" />
            <img src="https://cdn-icons-png.flaticon.com/128/349/349228.png" alt="Mastercard" className="h-8" />
            <img src="https://cdn-icons-png.flaticon.com/128/349/349230.png" alt="Discover" className="h-8" />
            <img src="https://nikoog.s3.eu-north-1.amazonaws.com/paypal.png" alt="PayPal" className="h-8" />
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Solo Drops. All rights reserved.</p>
          <p className="mt-1">
            <button 
              onClick={() => setIsPrivacyOpen(true)} 
              className="text-gray-600 hover:text-gray-900"
            >
              Privacy Policy
            </button>
            {' • '}
            <button 
              onClick={() => setIsTermsOpen(true)} 
              className="text-gray-600 hover:text-gray-900"
            >
              Terms of Service
            </button>
          </p>
        </div>

        {/* Modals */}
        <Modal
          isOpen={isPrivacyOpen}
          onClose={() => setIsPrivacyOpen(false)}
          title="Privacy Policy"
          content={privacyContent}
        />
        <Modal
          isOpen={isTermsOpen}
          onClose={() => setIsTermsOpen(false)}
          title="Terms of Service"
          content={termsContent}
        />
      </div>
    </footer>
  );
} 