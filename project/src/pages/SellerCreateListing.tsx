import React, { useState, useCallback } from 'react';
import { Upload, X, Calendar, MapPin, Phone, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { sellerAPI } from '../lib/api';
import { mlService } from '../services/mlService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface FormData {
  title: string;
  description: string;
  category: string;
  quantity: number;
  mfgDate: string;
  expDate: string;
  sellerName: string;
  phone: string;
  address: string;
  city: string;
  price: number;
  images: File[];
}

interface FormErrors {
  [key: string]: string;
}

const SellerCreateListing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    quantity: 1,
    mfgDate: '',
    expDate: '',
    sellerName: '',
    phone: '',
    address: '',
    city: '',
    price: 0,
    images: []
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Validation functions
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateDate = (date: string): boolean => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate instanceof Date && !isNaN(selectedDate.getTime());
  };

  const validateMfgDate = (mfgDate: string): boolean => {
    if (!validateDate(mfgDate)) return false;
    const mfgDateObj = new Date(mfgDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return mfgDateObj <= today;
  };

  const validateExpDate = (expDate: string, mfgDate: string): boolean => {
    if (!validateDate(expDate) || !validateDate(mfgDate)) return false;
    const expDateObj = new Date(expDate);
    const mfgDateObj = new Date(mfgDate);
    return expDateObj > mfgDateObj;
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5 || formData.title.length > 120) {
      newErrors.title = 'Title must be between 5 and 120 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    // Quantity validation
    if (!Number.isInteger(formData.quantity) || formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be a positive integer';
    }

    // Manufacturing date validation
    if (!formData.mfgDate) {
      newErrors.mfgDate = 'Manufacturing date is required';
    } else if (!validateMfgDate(formData.mfgDate)) {
      newErrors.mfgDate = 'Manufacturing date must be today or earlier';
    }

    // Expiry date validation
    if (!formData.expDate) {
      newErrors.expDate = 'Expiry date is required';
    } else if (!validateExpDate(formData.expDate, formData.mfgDate)) {
      newErrors.expDate = 'Expiry date must be after manufacturing date';
    }

    // Seller name validation
    if (!formData.sellerName.trim()) {
      newErrors.sellerName = 'Seller name is required';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    // Price validation
    if (formData.price < 0) {
      newErrors.price = 'Price must be positive';
    }

    // Images validation
    if (formData.images.length === 0) {
      newErrors.images = 'At least one image is required';
    }

    return newErrors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validImages: File[] = [];
    const previews: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        setErrors(prev => ({ ...prev, images: 'Only PNG and JPG images are allowed' }));
        continue;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, images: 'Images must be smaller than 5MB' }));
        continue;
      }

      validImages.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          previews.push(e.target.result as string);
          if (previews.length === validImages.length) {
            setImagePreviews(prev => [...prev, ...previews]);
          }
        }
      };
      reader.readAsDataURL(file);
    }

    if (validImages.length > 0) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...validImages]
      }));
      setErrors(prev => ({ ...prev, images: '' }));
    }
  }, []);

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || user.role !== 'seller') {
      toast.error('Only sellers can create listings');
      return;
    }
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Upload images with progress tracking
      setUploadProgress(10);
      const imageUrls: string[] = [];
      
      for (let i = 0; i < formData.images.length; i++) {
        const image = formData.images[i];
        // Simulate image upload - in real app, upload to S3 or similar
        const imageUrl = `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=800`;
        imageUrls.push(imageUrl);
        setUploadProgress(10 + (i + 1) * (60 / formData.images.length));
      }

      setUploadProgress(70);

      // Step 2: Create the listing in database
      const listingData = {
        seller_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        quantity: formData.quantity,
        price: formData.price,
        mfg_date: formData.mfgDate,
        exp_date: formData.expDate,
        image_urls: imageUrls,
        location: {
          type: 'Point',
          coordinates: [-74.0060, 40.7128] // In real app, geocode the address
        },
        contact_phone: formData.phone,
        status: 'active'
      };

      setUploadProgress(80);
      const result = await sellerAPI.createListing(listingData);
      
      setUploadProgress(90);

      // Step 3: Trigger AI prediction
      try {
        await mlService.predictExpiry(result);
      } catch (mlError) {
        console.warn('ML prediction failed:', mlError);
        // Don't fail the entire operation if ML fails
      }

      setUploadProgress(100);
      
      toast.success('Listing created successfully! 🎉');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        quantity: 1,
        mfgDate: '',
        expDate: '',
        sellerName: '',
        phone: '',
        address: '',
        city: '',
        price: 0,
        images: []
      });
      setImagePreviews([]);
      setUploadProgress(0);
      
      // Navigate to seller dashboard or listing view
      setTimeout(() => {
        navigate('/seller/listings');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('Failed to create listing. Please try again.');
      setErrors({ submit: 'Failed to create listing. Please try again.' });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-cream-white rounded-2xl shadow-sm border border-cream-200 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Create New Listing</h1>
            <p className="text-slate-600">List your surplus food items to connect with local buyers</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Basic Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Fresh Vegetables Bundle"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 ${
                      errors.title ? 'border-red-500' : 'border-cream-200'
                    }`}
                    maxLength={120}
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 ${
                      errors.category ? 'border-red-500' : 'border-cream-200'
                    }`}
                  >
                    <option value="">Select a category</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="dairy">Dairy</option>
                    <option value="meat">Meat & Seafood</option>
                    <option value="grains">Grains & Cereals</option>
                    <option value="prepared">Prepared Food</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the food items, their condition, and any other relevant details..."
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 ${
                    errors.description ? 'border-red-500' : 'border-cream-200'
                  }`}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>
            </div>

            {/* Quantity and Pricing */}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Quantity & Pricing</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 mb-2">
                    Quantity *
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      min="1"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 ${
                        errors.quantity ? 'border-red-500' : 'border-cream-200'
                      }`}
                    />
                  </div>
                  {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-2">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 ${
                      errors.price ? 'border-red-500' : 'border-cream-200'
                    }`}
                  />
                  {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                </div>
              </div>
            </div>

            {/* Dates */}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Important Dates</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="mfgDate" className="block text-sm font-medium text-slate-700 mb-2">
                    Manufacturing Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="date"
                      id="mfgDate"
                      name="mfgDate"
                      value={formData.mfgDate}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 ${
                        errors.mfgDate ? 'border-red-500' : 'border-cream-200'
                      }`}
                    />
                  </div>
                  {errors.mfgDate && <p className="text-red-500 text-sm mt-1">{errors.mfgDate}</p>}
                </div>

                <div>
                  <label htmlFor="expDate" className="block text-sm font-medium text-slate-700 mb-2">
                    Expiry Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="date"
                      id="expDate"
                      name="expDate"
                      value={formData.expDate}
                      onChange={handleInputChange}
                      min={formData.mfgDate || new Date().toISOString().split('T')[0]}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 ${
                        errors.expDate ? 'border-red-500' : 'border-cream-200'
                      }`}
                    />
                  </div>
                  {errors.expDate && <p className="text-red-500 text-sm mt-1">{errors.expDate}</p>}
                </div>
              </div>
            </div>

            {/* Seller Information */}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Seller Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="sellerName" className="block text-sm font-medium text-slate-700 mb-2">
                    Seller Name *
                  </label>
                  <input
                    type="text"
                    id="sellerName"
                    name="sellerName"
                    value={formData.sellerName}
                    onChange={handleInputChange}
                    placeholder="Your name or business name"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 ${
                      errors.sellerName ? 'border-red-500' : 'border-cream-200'
                    }`}
                  />
                  {errors.sellerName && <p className="text-red-500 text-sm mt-1">{errors.sellerName}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1-555-123-4567"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 ${
                        errors.phone ? 'border-red-500' : 'border-cream-200'
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-2">
                    Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Street address"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 ${
                        errors.address ? 'border-red-500' : 'border-cream-200'
                      }`}
                    />
                  </div>
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 ${
                      errors.city ? 'border-red-500' : 'border-cream-200'
                    }`}
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
              </div>
            </div>

            {/* Images */}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Images *</h2>
              
              <div className="border-2 border-dashed border-cream-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <div className="text-slate-600 mb-4">
                  <p className="text-lg font-medium">Upload food images</p>
                  <p className="text-sm">PNG or JPG files, max 5MB each</p>
                </div>
                
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="images"
                  className="inline-flex items-center px-6 py-3 border border-sage-300 text-sage-700 
                           bg-cream-white rounded-lg hover:bg-sage-50 cursor-pointer transition-colors"
                >
                  Choose Files
                </label>
              </div>
              
              {errors.images && <p className="text-red-500 text-sm mt-2">{errors.images}</p>}

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Image Previews</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-cream-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 
                                   hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            {(errors.submit || uploadProgress > 0) && (
              <div className="space-y-3">
                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {errors.submit}
                  </div>
                )}
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-700 font-medium">Creating listing...</span>
                      <span className="text-blue-600 text-sm">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-sage-600 hover:bg-sage-700 disabled:bg-sage-400 text-white 
                         py-4 rounded-lg font-semibold text-lg transition-colors duration-200"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating Listing...</span>
                  </div>
                ) : (
                  'Create Listing'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
                className="px-8 py-4 border border-slate-300 text-slate-600 hover:bg-slate-50 
                         rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SellerCreateListing;