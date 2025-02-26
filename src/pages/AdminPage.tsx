import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useProductStore } from '../store/productStore';
import { ImageIcon, DollarSign, Tag, Type, FileText, Trash2, Ruler, Scale, Box, Shield } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import Orders from '../components/Orders';

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

export default function AdminPage() {
  const { settings, isLoading, fetchSettings, updateSettings } = useProductStore();
  const [session, setSession] = useState<Session | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [isQuickActionLoading, setIsQuickActionLoading] = useState(false);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('settings');
  const [promotionalImages, setPromotionalImages] = useState<PromotionalImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newAltText, setNewAltText] = useState('');
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [previewPromoImage, setPreviewPromoImage] = useState('');
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [newSpec, setNewSpec] = useState({ title: '', description: '', icon: 'ruler' });
  const [isAddingSpec, setIsAddingSpec] = useState(false);

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
      fetchPromotionalImages();
      fetchSpecifications();
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
        video_url: formData.get('video_url') as string,
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

  const handleAddPromotionalImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingImage(true);

    try {
      const { error } = await supabase
        .from('promotional_images')
        .insert([
          {
            image_url: newImageUrl,
            alt_text: newAltText
          }
        ]);

      if (error) throw error;

      setNewImageUrl('');
      setNewAltText('');
      fetchPromotionalImages();
    } catch (error) {
      console.error('Error adding promotional image:', error);
      alert('Failed to add promotional image');
    } finally {
      setIsAddingImage(false);
    }
  };

  const handleDeleteImage = async (id: number) => {
    if (!confirm('Are you sure you want to delete this promotional image?')) return;

    try {
      const { error } = await supabase
        .from('promotional_images')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchPromotionalImages();
    } catch (error) {
      console.error('Error deleting promotional image:', error);
      alert('Failed to delete promotional image');
    }
  };

  const handleAddSpecification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingSpec(true);

    try {
      const { error } = await supabase
        .from('specifications')
        .insert([newSpec]);

      if (error) throw error;

      setNewSpec({ title: '', description: '', icon: 'ruler' });
      fetchSpecifications();
    } catch (error) {
      console.error('Error adding specification:', error);
      alert('Failed to add specification');
    } finally {
      setIsAddingSpec(false);
    }
  };

  const handleDeleteSpecification = async (id: number) => {
    if (!confirm('Are you sure you want to delete this specification?')) return;

    try {
      const { error } = await supabase
        .from('specifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchSpecifications();
    } catch (error) {
      console.error('Error deleting specification:', error);
      alert('Failed to delete specification');
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

                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                        <FileText className="w-5 h-5 mr-2" />
                        YouTube Video URL
                      </label>
                      <input
                        name="video_url"
                        type="url"
                        defaultValue={settings.video_url ?? ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="https://www.youtube.com/watch?v=..."
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

              <div className="mt-12 border-t pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Promotional Images</h2>
                
                <form onSubmit={handleAddPromotionalImage} className="mb-8 bg-white p-6 rounded-lg shadow">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Image URL</label>
                      <input
                        type="url"
                        required
                        value={newImageUrl}
                        onChange={(e) => {
                          setNewImageUrl(e.target.value);
                          setPreviewPromoImage(e.target.value);
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="https://example.com/image.jpg"
                      />
                      {previewPromoImage && (
                        <div className="mt-2 aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={previewPromoImage}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={() => setPreviewPromoImage('')}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Alt Text</label>
                      <input
                        type="text"
                        required
                        value={newAltText}
                        onChange={(e) => setNewAltText(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Image description"
                      />
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Image Guidelines:</p>
                        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                          <li>Use square images (1:1 aspect ratio)</li>
                          <li>Recommended size: 600x600px or larger</li>
                          <li>Maximum file size: 5MB</li>
                          <li>Formats: JPG, PNG, or WebP</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isAddingImage}
                    className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isAddingImage ? 'Adding...' : 'Add Promotional Image'}
                  </button>
                </form>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {promotionalImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden">
                        <div className="w-full h-full relative">
                          <img
                            src={image.image_url}
                            alt={image.alt_text}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12 border-t pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Specifications</h2>
                
                <form onSubmit={handleAddSpecification} className="mb-8 bg-white p-6 rounded-lg shadow">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        required
                        value={newSpec.title}
                        onChange={(e) => setNewSpec({ ...newSpec, title: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g., Dimensions"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Icon</label>
                      <select
                        value={newSpec.icon}
                        onChange={(e) => setNewSpec({ ...newSpec, icon: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="ruler">Ruler (Dimensions)</option>
                        <option value="scale">Scale (Weight)</option>
                        <option value="box">Box (Material)</option>
                        <option value="shield">Shield (Warranty)</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                      type="text"
                      required
                      value={newSpec.description}
                      onChange={(e) => setNewSpec({ ...newSpec, description: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., 12.5 x 8.5 x 4.5 inches"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAddingSpec}
                    className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isAddingSpec ? 'Adding...' : 'Add Specification'}
                  </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {specifications.map((spec) => (
                    <div key={spec.id} className="flex items-start space-x-4 bg-white p-4 rounded-lg shadow">
                      <div className="flex-shrink-0">
                        {spec.icon === 'ruler' && <Ruler className="w-6 h-6 text-gray-400" />}
                        {spec.icon === 'scale' && <Scale className="w-6 h-6 text-gray-400" />}
                        {spec.icon === 'box' && <Box className="w-6 h-6 text-gray-400" />}
                        {spec.icon === 'shield' && <Shield className="w-6 h-6 text-gray-400" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{spec.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">{spec.description}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteSpecification(spec.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
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