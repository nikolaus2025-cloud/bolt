import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useProductStore } from '../store/productStore';
import { ImageIcon, DollarSign, Tag, Type, FileText } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import Orders from '../components/Orders';

export default function AdminPage() {
  const { settings, isLoading, fetchSettings, updateSettings } = useProductStore();
  const [session, setSession] = useState<Session | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [isQuickActionLoading, setIsQuickActionLoading] = useState(false);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchSettings();
    }
  }, [session]);

  useEffect(() => {
    if (settings) {
      setAdditionalImages(settings.additional_images || []);
    }
  }, [settings]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
  };

  const handleLogout = () => {
    supabase.auth.signOut();
  };

  const handleSettingsUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const newSettings = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        price: parseFloat(formData.get('price') as string),
        discount: parseFloat(formData.get('discount') as string),
        image_url: formData.get('image_url') as string,
        additional_images: additionalImages,
      };

      await updateSettings(newSettings);
      alert('Settings updated successfully!');
      setPreviewImage(newSettings.image_url);
    } catch (error) {
      alert('Failed to update settings. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreviewImage(e.target.value);
  };

  const handleAddImage = () => {
    setAdditionalImages([...additionalImages, '']);
  };

  const handleRemoveImage = (index: number) => {
    setAdditionalImages(additionalImages.filter((_, i) => i !== index));
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...additionalImages];
    newImages[index] = value;
    setAdditionalImages(newImages);
  };

  const handleQuickDiscount = async () => {
    if (!settings || isQuickActionLoading) return;
    
    setIsQuickActionLoading(true);
    try {
      const newDiscount = settings.discount > 0 ? 0 : Math.round(settings.price * 0.1 * 100) / 100;
      await updateSettings({ ...settings, discount: newDiscount });
    } catch (error) {
      alert('Failed to update discount. Please try again.');
    } finally {
      setIsQuickActionLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <input
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
              <div>
                <input
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Product Settings</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Logout
            </button>
          </div>

          {/* Add tabs for navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('settings')}
                className={`${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Product Settings
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`${
                  activeTab === 'orders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Orders
              </button>
            </nav>
          </div>

          {activeTab === 'settings' ? (
            <>
              {settings && (
                <form onSubmit={handleSettingsUpdate} className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                        <ImageIcon className="w-5 h-5 mr-2" />
                        Product Image URL
                      </label>
                      <input
                        name="image_url"
                        type="url"
                        defaultValue={settings.image_url}
                        onChange={handleImageUrlChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="https://example.com/image.jpg"
                      />
                      {previewImage && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 mb-2">Preview:</p>
                          <img
                            src={previewImage}
                            alt="Product preview"
                            className="w-48 h-48 object-cover rounded-lg border border-gray-200"
                            onError={() => setPreviewImage('')}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Additional Images</label>
                        <button
                          type="button"
                          onClick={handleAddImage}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 focus:outline-none"
                        >
                          + Add Image
                        </button>
                      </div>
                      
                      {additionalImages.map((url, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="flex-1">
                            <input
                              type="url"
                              value={url}
                              onChange={(e) => handleImageChange(index, e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder={`Additional Image URL ${index + 1}`}
                            />
                            {url && (
                              <img
                                src={url}
                                alt={`Additional preview ${index + 1}`}
                                className="mt-2 w-24 h-24 object-cover rounded-lg border border-gray-200"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="mt-1 p-2 text-red-600 hover:text-red-700 focus:outline-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                        <Type className="w-5 h-5 mr-2" />
                        Product Title
                      </label>
                      <input
                        name="title"
                        type="text"
                        defaultValue={settings.title}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                        <FileText className="w-5 h-5 mr-2" />
                        Product Description
                      </label>
                      <textarea
                        name="description"
                        rows={4}
                        defaultValue={settings.description}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                          <DollarSign className="w-5 h-5 mr-2" />
                          Price ($)
                        </label>
                        <input
                          name="price"
                          type="number"
                          step="0.01"
                          defaultValue={settings.price}
                          required
                          min="0"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                          <Tag className="w-5 h-5 mr-2" />
                          Discount ($)
                        </label>
                        <input
                          name="discount"
                          type="number"
                          step="0.01"
                          defaultValue={settings.discount}
                          required
                          min="0"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-4">
                    <div className="text-sm text-gray-500">
                      Final Price: ${settings.price - settings.discount}
                    </div>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className={`flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isUpdating ? 'Updating...' : 'Update Settings'}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-12 border-t pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Management</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Current Product</h3>
                    {settings && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="aspect-w-16 aspect-h-9 mb-4">
                          <img
                            src={settings.image_url}
                            alt={settings.title}
                            className="object-cover rounded-lg"
                          />
                        </div>
                        <p className="font-medium">{settings.title}</p>
                        <p className="text-sm text-gray-600">{settings.description}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-lg font-bold">
                            ${(settings.price - settings.discount).toFixed(2)}
                          </span>
                          {settings.discount > 0 && (
                            <span className="text-sm text-gray-500 line-through">
                              ${settings.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setPreviewImage(settings?.image_url || '')}
                        disabled={isQuickActionLoading}
                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Preview Current Image
                      </button>
                      <button
                        onClick={handleQuickDiscount}
                        disabled={isQuickActionLoading}
                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isQuickActionLoading ? (
                          <span className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                            Updating...
                          </span>
                        ) : (
                          settings && settings.discount > 0 ? 'Remove Discount' : 'Add 10% Discount'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Orders section
            <Orders />
          )}
        </div>
      </div>
    </div>
  );
}