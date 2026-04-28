import React, { useState, useCallback } from 'react';
import { Search, MapPin, Clock, Users, TrendingDown, Leaf, BarChart3, ArrowRight, Star, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { searchAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';

interface SearchResult {
  id: string;
  name: string;
  type: 'restaurant' | 'shop' | 'hotel';
  location: {
    address: string;
    coordinates: [number, number];
    city: string;
  };
  phone: string;
  listingsCount: number;
  averageRating: number;
  distance?: number;
}

const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
  const { user } = useAuth();

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }

    setIsLoading(true);
    
    try {
      let userLocation = location;
      if (!userLocation) {
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
          setLocation(userLocation);
        } catch (error) {
          console.warn('Could not get user location:', error);
          // Use default location (e.g., city center)
          userLocation = { lat: 40.7128, lng: -74.0060 }; // NYC default
        }
      }

      const searchParams = {
        q: searchQuery,
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: 10
      };

      const data = await searchAPI.searchSellers(searchParams);
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100 to-sage-50">
      {/* Hero Section */}
      <div className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-sage-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cream-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center mb-6">
              <div className="bg-sage-100 p-3 rounded-full mr-4">
                <Leaf className="h-8 w-8 text-sage-600" />
              </div>
              <span className="text-sage-600 font-semibold text-lg">AgriWaste Platform</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-slate-800 mb-6 leading-tight">
              Reduce Food Waste,
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sage-600 to-sage-800"> 
                {' '}Feed Communities
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Connect restaurants, shops, and hotels with buyers to reduce food waste 
              and support sustainable communities through AI-powered solutions.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-12">
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="text-3xl font-bold text-sage-600">2.8K+</div>
                <div className="text-sm text-slate-600">Kg Waste Prevented</div>
              </motion.div>
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <div className="text-3xl font-bold text-sage-600">156</div>
                <div className="text-sm text-slate-600">Active Listings</div>
              </motion.div>
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <div className="text-3xl font-bold text-sage-600">4.2</div>
                <div className="text-sm text-slate-600">Avg Days to Expiry</div>
              </motion.div>
            </div>
          </motion.div>

          {/* Search Form */}
          <motion.form 
            onSubmit={handleSearch} 
            className="max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="relative shadow-2xl">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search restaurants and locations..."
                className="block w-full pl-16 pr-32 py-6 text-xl border-2 border-cream-200 rounded-2xl 
                         bg-cream-white/90 backdrop-blur-sm placeholder-slate-400 focus:outline-none focus:ring-4 
                         focus:ring-sage-500/20 focus:border-sage-500 transition-all duration-300"
                required
              />
              <button
                type="submit"
                disabled={isLoading || !searchQuery.trim()}
                className="absolute inset-y-0 right-0 px-8 py-3 m-3 bg-gradient-to-r from-sage-600 to-sage-700 
                         text-white rounded-xl hover:from-sage-700 hover:to-sage-800 focus:outline-none focus:ring-4 
                         focus:ring-sage-500/20 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-300 font-semibold text-lg flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Search</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </motion.form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <motion.div 
              className="max-w-6xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-semibold text-slate-800 mb-6 text-left">
                Search Results ({searchResults.length})
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((result) => (
                  <motion.div
                    key={result.id}
                    className="bg-cream-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-cream-200 
                             hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-slate-800 group-hover:text-sage-700 transition-colors">
                        {result.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        result.type === 'restaurant' 
                          ? 'bg-orange-100 text-orange-700'
                          : result.type === 'shop'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                        <span>{result.location.address}</span>
                        {result.distance && (
                          <span className="ml-auto text-sage-600 font-medium">
                            {result.distance} km away
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-slate-400" />
                          <span>{result.listingsCount} active listings</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-amber-500 fill-current" />
                          <span className="ml-1">{result.averageRating}</span>
                        </div>
                      </div>
                    </div>

                    <button className="w-full mt-4 bg-gradient-to-r from-sage-50 to-sage-100 hover:from-sage-100 hover:to-sage-200 
                                     text-sage-700 py-3 rounded-xl transition-all duration-300 font-medium 
                                     group-hover:shadow-md flex items-center justify-center space-x-2">
                      <span>View Listings</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          {/* Quick Actions for logged in users */}
          {user && (
            <motion.div 
              className="max-w-4xl mx-auto mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="bg-cream-white/60 backdrop-blur-sm rounded-2xl p-8 border border-cream-200">
                <h3 className="text-xl font-semibold text-slate-800 mb-6 text-center">
                  Welcome back, {user.name}! 👋
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {user.role === 'seller' ? (
                    <>
                      <Link
                        to="/seller/create-listing"
                        className="bg-gradient-to-r from-sage-600 to-sage-700 hover:from-sage-700 hover:to-sage-800 
                                 text-white p-4 rounded-xl transition-all duration-300 text-center font-medium
                                 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                      >
                        <span>Create New Listing</span>
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                      <Link
                        to="/ai-dashboard"
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
                                 text-white p-4 rounded-xl transition-all duration-300 text-center font-medium
                                 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                      >
                        <BarChart3 className="h-5 w-5" />
                        <span>View AI Dashboard</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/buyer/search"
                        className="bg-gradient-to-r from-sage-600 to-sage-700 hover:from-sage-700 hover:to-sage-800 
                                 text-white p-4 rounded-xl transition-all duration-300 text-center font-medium
                                 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                      >
                        <Search className="h-5 w-5" />
                        <span>Browse Listings</span>
                      </Link>
                      <Link
                        to="/ai-dashboard"
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
                                 text-white p-4 rounded-xl transition-all duration-300 text-center font-medium
                                 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                      >
                        <BarChart3 className="h-5 w-5" />
                        <span>View Analytics</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gradient-to-b from-cream-white to-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              Smart Solutions for Food Waste
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Our AI-powered platform helps reduce waste through intelligent prediction, 
              community connections, and actionable insights.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: Clock,
                title: 'AI Expiry Prediction',
                description: 'Machine learning algorithms predict when food will spoil and send timely alerts to prevent waste',
                color: 'from-orange-500 to-red-500',
                bgColor: 'bg-orange-50'
              },
              {
                icon: MapPin,
                title: 'Location-Based Matching',
                description: 'Connect nearby sellers and buyers to minimize transport and maximize freshness',
                color: 'from-blue-500 to-indigo-500',
                bgColor: 'bg-blue-50'
              },
              {
                icon: Users,
                title: 'Community Impact',
                description: 'Enable bulk purchases and donations to reduce waste at scale and support local communities',
                color: 'from-green-500 to-emerald-500',
                bgColor: 'bg-green-50'
              }
            ].map((feature, index) => (
              <motion.div 
                key={feature.title}
                className="text-center p-8 rounded-2xl bg-cream-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className={`${feature.bgColor} w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 
                               group-hover:scale-110 transition-transform duration-300`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4 group-hover:text-sage-700 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="py-20 bg-gradient-to-r from-sage-50 to-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              Trusted by Businesses Worldwide
            </h2>
            <p className="text-lg text-slate-600">
              Join thousands of restaurants, shops, and organizations making a difference
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Secure & Reliable',
                description: 'Enterprise-grade security with 99.9% uptime guarantee'
              },
              {
                icon: Zap,
                title: 'Fast & Efficient',
                description: 'Lightning-fast matching with real-time notifications'
              },
              {
                icon: TrendingDown,
                title: 'Proven Results',
                description: 'Average 40% reduction in food waste for our partners'
              }
            ].map((item, index) => (
              <motion.div 
                key={item.title}
                className="flex items-start space-x-4 p-6 bg-cream-white/60 backdrop-blur-sm rounded-xl"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="bg-sage-100 p-3 rounded-lg flex-shrink-0">
                  <item.icon className="h-6 w-6 text-sage-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!user && (
        <div className="py-24 bg-gradient-to-br from-sage-600 to-sage-800">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Make a Difference?
              </h2>
              <p className="text-xl text-sage-100 mb-10 max-w-2xl mx-auto">
                Join our community today and start reducing food waste while supporting your local economy.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/auth/register"
                  className="bg-cream-white text-sage-700 px-8 py-4 rounded-xl font-semibold text-lg 
                           hover:bg-cream-100 transition-all duration-300 shadow-lg hover:shadow-xl
                           flex items-center justify-center space-x-2"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/services"
                  className="border-2 border-cream-white text-cream-white px-8 py-4 rounded-xl font-semibold text-lg 
                           hover:bg-cream-white hover:text-sage-700 transition-all duration-300
                           flex items-center justify-center space-x-2"
                >
                  <span>Learn More</span>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;