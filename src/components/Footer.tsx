import { Shield, Lock, CheckCircle, CreditCard } from 'lucide-react';

export default function Footer() {
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
            <img src="https://cdn-icons-png.flaticon.com/128/349/349230.png" alt="PayPal" className="h-8" />
            <img src="https://cdn-icons-png.flaticon.com/128/349/349222.png" alt="American Express" className="h-8" />
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Your Company. All rights reserved.</p>
          <p className="mt-1">
            <a href="#" className="text-gray-600 hover:text-gray-900">Privacy Policy</a>
            {' • '}
            <a href="#" className="text-gray-600 hover:text-gray-900">Terms of Service</a>
          </p>
        </div>
      </div>
    </footer>
  );
} 