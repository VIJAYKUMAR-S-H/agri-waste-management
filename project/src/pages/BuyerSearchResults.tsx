import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Phone, Star } from 'lucide-react';
import { buyerAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  mfgDate: string;
  expDate: string;
  sellerName: string;
  phone: string;
  location: {
    address: string;
    city: string;
    coordinates: [number, number];
  };
  imageUrls: string[];
  distance?: number;
  rating: number;
}

const BuyerSearchResults: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    maxPrice: '',
    maxDistance: '10'
  });

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      // Get user's location
      let userLocation = null;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: false
          });
        });
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
      } catch (error) {
        console.warn('Could not get user location:', error);
      }

      // Search listings
      const searchParams = {
        location: searchLocation || undefined,
        category: filters.category || undefined,
        maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
        maxDistance: parseInt(filters.maxDistance),
        lat: userLocation?.lat,
        lng: userLocation?.lng
      };

      const data = await buyerAPI.searchListings(searchParams);
      
      // Transform API response to match our interface
      const transformedListings: Listing[] = (data.results || []).map((result: any) => ({
        id: result.id,
        title: result.name + ' - Mixed Items',
        description: 'Fresh items available for pickup',
        category: 'mixed',
        price: 15.99,
        quantity: 5,
        mfgDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        expDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        sellerName: result.name,
        phone: result.phone,
        location: {
          address: result.location.address,
          city: result.location.city,
          coordinates: result.location.coordinates
        },
        imageUrls: ['https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=800'],
        distance: result.distance,
        rating: result.average_rating
      }));

      // Add some mock listings for demo
      const mockListings: Listing[] = [
        {
          id: '1',
          title: 'Fresh Vegetable Bundle - Perfect for Soup',
          description: 'Mixed vegetables including carrots, onions, celery, and potatoes. Great for making soup or stew. All items are fresh and ready to use.',
          category: 'vegetables',
          price: 15.99,
          quantity: 5,
          mfgDate: '2025-01-15',
          expDate: '2025-01-22',
          sellerName: 'Green Valley Restaurant',
          phone: '+1-555-0123',
          location: {
            address: '123 Main St',
            city: 'New York',
            coordinates: [40.7589, -73.9851]
          },
          imageUrls: ['https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=800'],
          distance: 2.3,
          rating: 4.5
        },
        {
          id: '2',
          title: 'Assorted Bakery Items - End of Day Special',
          description: 'Fresh baked goods including croissants, muffins, and bread rolls. Baked this morning, perfect for tomorrow\'s breakfast.',
          category: 'prepared',
          price: 8.50,
          quantity: 12,
          mfgDate: '2025-01-16',
          expDate: '2025-01-18',
          sellerName: 'Corner Bakery',
          phone: '+1-555-0456',
          location: {
            address: '456 Oak Ave',
            city: 'New York',
            coordinates: [40.7505, -73.9934]
          },
          imageUrls: ['https://images.pexels.com/photos/205961/pexels-photo-205961.jpeg?auto=compress&cs=tinysrgb&w=800'],
          distance: 1.7,
          rating: 4.8
        },
        {
          id: '3',
          title: 'Organic Fruit Mix - Slightly Overripe',
          description: 'Mix of organic apples, pears, and bananas. Perfect for smoothies, baking, or immediate consumption. Slight browning but still delicious.',
          category: 'fruits',
          price: 12.00,
          quantity: 8,
          mfgDate: '2025-01-12',
          expDate: '2025-01-19',
          sellerName: 'Fresh Market Grocery',
          phone: '+1-555-0789',
          location: {
            address: '789 Pine St',
            city: 'New York',
            coordinates: [40.7614, -73.9776]
          },
          imageUrls: ['https://images.pexels.com/photos/1128678/pexels-photo-1128678.jpeg?auto=compress&cs=tinysrgb&w=800'],
          distance: 3.1,
          rating: 4.2
        }
      ];
      
      setListings([...transformedListings, ...mockListings]);
      
      if (transformedListings.length === 0 && mockListings.length > 0) {
        toast.info('Showing demo listings - connect your location for real results');
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load listings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLocation.trim()) {
      toast.error('Please enter a location to search');
      return;
    }
    fetchListings();
  };

  const handleContactSeller = async (listing: Listing) => {
    if (!user) {
      toast.error('Please login to contact sellers');
      return;
    }

    // In a real app, this would open a contact modal or send a message
    toast.success(`Contact info: ${listing.phone}`);
  };

  const handleCallSeller = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const getDaysUntilExpiry = (expDate: string): number => {
    const today = new Date();
    const expiry = new Date(expDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyColor = (days: number): string => {
    if (days <= 1) return 'text-red-600 bg-red-50';
    if (days <= 3) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Finding nearby listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Browse Local Food Listings</h1>
          <p className="text-slate-600">Find quality food at discounted prices in your area</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-cream-white rounded-xl p-6 shadow-sm border border-cream-200 mb-8">
          <form onSubmit={handleLocationSearch} className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="Enter location (city, zip code, or address)"
                  className="w-full pl-10 pr-4 py-3 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
                />
              </div>
              <button
                type="submit"
                className="bg-sage-600 hover:bg-sage-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full px-3 py-2 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
              >
                <option value="">All Categories</option>
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
                <option value="dairy">Dairy</option>
                <option value="meat">Meat & Seafood</option>
                <option value="grains">Grains & Cereals</option>
                <option value="prepared">Prepared Food</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Price ($)</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                placeholder="Any price"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Distance (km)</label>
              <select
                value={filters.maxDistance}
                onChange={(e) => setFilters({...filters, maxDistance: e.target.value})}
                className="w-full px-3 py-2 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500"
              >
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="25">25 km</option>
                <option value="50">50 km</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid lg:grid-cols-2 gap-8">
          {listings.map((listing) => {
            const daysUntilExpiry = getDaysUntilExpiry(listing.expDate);
            const urgencyClass = getUrgencyColor(daysUntilExpiry);

            return (
              <div
                key={listing.id}
                className="bg-cream-white rounded-xl shadow-sm border border-cream-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="aspect-video bg-slate-100">
                  <img
                    src={listing.imageUrls[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-1">
                        {listing.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <span className="capitalize">{listing.category}</span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Star className="h-4 w-4 text-amber-400 mr-1 fill-current" />
                          {listing.rating}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-sage-600">
                        ${listing.price}
                      </div>
                      <div className="text-sm text-slate-600">
                        {listing.quantity} items
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {listing.description}
                  </p>

                  {/* Expiry Warning */}
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 ${urgencyClass}`}>
                    <Calendar className="h-3 w-3 mr-1" />
                    {daysUntilExpiry === 1 ? 'Expires tomorrow' : 
                     daysUntilExpiry === 0 ? 'Expires today' :
                     `Expires in ${daysUntilExpiry} days`}
                  </div>

                  {/* Seller Info */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Seller:</span>
                      <span className="font-medium text-slate-800">{listing.sellerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Distance:</span>
                      <span className="text-slate-800">{listing.distance} km away</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Location:</span>
                      <span className="text-slate-800">{listing.location.city}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <button className="flex-1 bg-sage-600 hover:bg-sage-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                      onClick={() => handleContactSeller(listing)}
                      Contact Seller
                    </button>
                    <button 
                      onClick={() => handleCallSeller(listing.phone)}
                      className="flex items-center justify-center w-12 h-10 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {listings.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-cream-white rounded-xl p-8 max-w-md mx-auto">
              <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">No listings found</h3>
              <p className="text-slate-600 mb-4">
                Try adjusting your search location or filters to find more results.
              </p>
              <button 
                onClick={fetchListings}
                disabled={isLoading}
                className="bg-sage-600 hover:bg-sage-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Searching...</span>
                  </div>
                ) : (
                  'Refresh Results'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerSearchResults;