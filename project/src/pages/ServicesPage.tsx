import React from 'react';
import { Store, ShoppingCart, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const ServicesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Choose Your Role
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Whether you're looking to sell surplus food or find great deals on quality items,
            AgriWaste connects you with the right community.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {/* Seller Card */}
          <div className="bg-cream-white rounded-2xl p-8 shadow-sm border border-cream-200 hover:shadow-md transition-shadow duration-200">
            <div className="text-center mb-6">
              <div className="bg-sage-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="h-10 w-10 text-sage-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Seller</h2>
              <p className="text-slate-600">
                List your surplus food items and reduce waste while earning revenue
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <div className="bg-sage-100 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Plus className="h-3 w-3 text-sage-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Create Listings</h3>
                  <p className="text-sm text-slate-600">Upload photos and details of surplus food items</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-sage-100 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Plus className="h-3 w-3 text-sage-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Set Expiry Alerts</h3>
                  <p className="text-sm text-slate-600">Get AI-powered notifications before food spoils</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-sage-100 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Plus className="h-3 w-3 text-sage-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Reach Local Buyers</h3>
                  <p className="text-sm text-slate-600">Connect with nearby customers and organizations</p>
                </div>
              </div>
            </div>

            <Link
              to="/seller/create-listing"
              className="block w-full bg-sage-600 hover:bg-sage-700 text-white text-center py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Start Selling
            </Link>
          </div>

          {/* Buyer Card */}
          <div className="bg-cream-white rounded-2xl p-8 shadow-sm border border-cream-200 hover:shadow-md transition-shadow duration-200">
            <div className="text-center mb-6">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Buyer</h2>
              <p className="text-slate-600">
                Find quality food at discounted prices while helping reduce waste
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Search className="h-3 w-3 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Browse Local Listings</h3>
                  <p className="text-sm text-slate-600">Find deals on fresh food near your location</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Search className="h-3 w-3 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Bulk Purchase Options</h3>
                  <p className="text-sm text-slate-600">Get discounts on larger quantities for organizations</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Search className="h-3 w-3 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Support Sustainability</h3>
                  <p className="text-sm text-slate-600">Make a positive environmental impact with every purchase</p>
                </div>
              </div>
            </div>

            <Link
              to="/buyer/search"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Start Shopping
            </Link>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-cream-white rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              Not sure which role fits you?
            </h3>
            <p className="text-slate-600 mb-6">
              Many users find value in both buying and selling. You can always switch between roles or do both!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/auth/register"
                className="bg-sage-600 hover:bg-sage-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Sign Up Now
              </Link>
              <Link
                to="/"
                className="border border-sage-600 text-sage-600 hover:bg-sage-50 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;