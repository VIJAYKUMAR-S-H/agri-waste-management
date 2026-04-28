import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingDown, MapPin, AlertTriangle, Leaf, RefreshCw, Calendar, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { mlAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Chart from '../components/ui/Chart';
import type { WasteMetrics } from '../lib/supabase';
import toast from 'react-hot-toast';

const AIDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<WasteMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [locationFilter, setLocationFilter] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange, locationFilter]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Use the ML service for real predictions and analytics
      const data = await mlService.generateDashboardMetrics({
        timeRange,
        location: locationFilter
      });
      setMetrics(data);
      toast.success('AI insights updated successfully');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load AI insights');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.loading('Refreshing AI predictions...', { id: 'refresh' });
    await fetchDashboardData();
    toast.dismiss('refresh');
    setIsRefreshing(false);
  };

  const handleMetricClick = (metricType: string) => {
    setSelectedMetric(selectedMetric === metricType ? null : metricType);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 to-sage-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Loading AI insights...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 to-sage-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <p className="text-slate-600 text-lg mb-4">Unable to load dashboard data</p>
          <button
            onClick={fetchDashboardData}
            className="bg-sage-600 hover:bg-sage-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-sage-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl mr-4">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                AI Dashboard
              </h1>
              <p className="text-slate-600 text-lg">
                Real-time insights and analytics powered by machine learning
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 mb-1">Welcome back,</p>
              <p className="font-semibold text-slate-800">{user?.name}</p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          className="bg-cream-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-cream-200 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Time Range</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-3 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 bg-cream-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-4 py-3 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 bg-cream-white"
              >
                <option value="all">All Locations</option>
                <option value="nyc">New York City</option>
                <option value="brooklyn">Brooklyn</option>
                <option value="queens">Queens</option>
                <option value="manhattan">Manhattan</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-gradient-to-r from-sage-600 to-sage-700 hover:from-sage-700 hover:to-sage-800 
                         text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 
                         disabled:opacity-50 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Updating AI...' : 'Refresh AI Data'}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              icon: Leaf,
              title: 'Kg Waste Prevented',
              value: metrics.total_waste_prevented.toLocaleString(),
              change: '+12%',
              changeType: 'positive',
              color: 'from-green-500 to-emerald-600',
              bgColor: 'bg-green-50',
              type: 'waste_prevented'
            },
            {
              icon: BarChart3,
              title: 'Active Listings',
              value: metrics.active_listings.toString(),
              change: '+8%',
              changeType: 'positive',
              color: 'from-blue-500 to-indigo-600',
              bgColor: 'bg-blue-50',
              type: 'active_listings'
            },
            {
              icon: Calendar,
              title: 'Avg. Days to Expiry',
              value: metrics.average_expiry_days.toString(),
              change: '-0.3',
              changeType: 'positive',
              color: 'from-orange-500 to-red-600',
              bgColor: 'bg-orange-50',
              type: 'expiry_days'
            },
            {
              icon: MapPin,
              title: 'Active Locations',
              value: metrics.waste_by_location.length.toString(),
              change: 'NYC metro',
              changeType: 'neutral',
              color: 'from-purple-500 to-pink-600',
              bgColor: 'bg-purple-50',
              type: 'locations'
            }
          ].map((kpi, index) => (
            <motion.div
              key={kpi.title}
              onClick={() => handleMetricClick(kpi.type)}
              className="bg-cream-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-cream-200 
                       hover:shadow-xl transition-all duration-300 group cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${kpi.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                    <kpi.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <span className="text-3xl font-bold text-slate-800 group-hover:text-sage-700 transition-colors">
                  {kpi.value}
                </span>
              </div>
              <h3 className="text-sm font-medium text-slate-600 mb-2">{kpi.title}</h3>
              <p className={`text-xs font-medium ${
                kpi.changeType === 'positive' ? 'text-green-600' : 
                kpi.changeType === 'negative' ? 'text-red-600' : 'text-slate-500'
              }`}>
                {kpi.change} {kpi.changeType !== 'neutral' && 'vs last period'}
              </p>
              
              {/* Expanded Details */}
              {selectedMetric === kpi.type && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-cream-200"
                >
                  <div className="text-xs text-slate-600 space-y-1">
                    {kpi.type === 'waste_prevented' && (
                      <>
                        <p>• Total items saved: 1,247</p>
                        <p>• CO₂ emissions reduced: 2.1 tons</p>
                        <p>• Money saved by buyers: $8,432</p>
                      </>
                    )}
                    {kpi.type === 'active_listings' && (
                      <>
                        <p>• New listings today: 23</p>
                        <p>• Expiring in 24h: 12</p>
                        <p>• High-risk items: 5</p>
                      </>
                    )}
                    {kpi.type === 'expiry_days' && (
                      <>
                        <p>• Vegetables: 3.2 days avg</p>
                        <p>• Dairy: 5.1 days avg</p>
                        <p>• Prepared food: 1.8 days avg</p>
                      </>
                    )}
                    {kpi.type === 'locations' && (
                      <>
                        <p>• Manhattan: 45 listings</p>
                        <p>• Brooklyn: 32 listings</p>
                        <p>• Queens: 28 listings</p>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Top Waste Categories */}
          <motion.div 
            className="bg-cream-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-cream-200"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center">
                <Target className="h-5 w-5 mr-2 text-sage-600" />
                Top Waste Categories
              </h2>
              <div className="text-xs text-slate-500">Last {timeRange}</div>
            </div>
            
            <div className="mb-6">
              <Chart
                data={metrics.top_waste_categories.map((cat, index) => ({
                  name: cat.category,
                  amount: cat.amount,
                  percentage: cat.percentage,
                  fill: `hsl(${index * 60}, 70%, 50%)`
                }))}
                type="bar"
                dataKey="amount"
                height={200}
              />
            </div>
            
            <div className="space-y-3">
              {metrics.top_waste_categories.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between p-3 bg-cream-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-red-500' :
                      index === 1 ? 'bg-orange-500' :
                      index === 2 ? 'bg-yellow-500' :
                      index === 3 ? 'bg-blue-500' : 'bg-gray-500'
                    }`} />
                    <span className="font-medium text-slate-800">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800">{category.amount} kg</div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-slate-500">{category.percentage}%</span>
                      <span className={`text-xs ${category.trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {category.trend > 0 ? '+' : ''}{category.trend}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Waste by Location */}
          <motion.div 
            className="bg-cream-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-cream-200"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-sage-600" />
                Waste by Location
              </h2>
              <div className="text-xs text-slate-500">Prevention Rate</div>
            </div>
            
            <div className="space-y-4">
              {metrics.waste_by_location.map((location, index) => (
                <div key={location.city} className="flex items-center justify-between p-4 bg-cream-50 rounded-xl hover:bg-cream-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-sage-500 to-sage-600 p-2 rounded-full">
                      <MapPin className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">{location.city}</span>
                      <div className="text-xs text-slate-500">{location.prevention_rate}% prevention rate</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800 mb-1">{location.waste_amount} kg</div>
                    <div className="w-32 bg-cream-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-sage-500 to-sage-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${location.prevention_rate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Expiry Predictions */}
        {metrics.expiry_predictions && metrics.expiry_predictions.length > 0 && (
          <motion.div 
            className="bg-cream-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-cream-200 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                AI Expiry Predictions
              </h2>
              <div className="text-xs text-slate-500">Next 10 items at risk</div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cream-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Item</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Predicted Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Days Left</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Risk Level</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.expiry_predictions.slice(0, 10).map((prediction, index) => (
                    <tr key={prediction.listing_id} className="border-b border-cream-100 hover:bg-cream-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{prediction.title}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(prediction.predicted_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${
                          prediction.days_remaining <= 1 ? 'text-red-600' :
                          prediction.days_remaining <= 3 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {prediction.days_remaining <= 0 ? 'Expired' : `${prediction.days_remaining} days`}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          prediction.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                          prediction.risk_level === 'medium' ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {prediction.risk_level}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-cream-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" 
                              style={{ width: `${prediction.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600">
                            {Math.round(prediction.confidence * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* AI Suggestions */}
        <motion.div 
          className="bg-cream-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-cream-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
              AI Recommendations
            </h2>
            <div className="text-xs text-slate-500">Powered by ML</div>
          </div>
          
          <div className="space-y-4">
            {metrics.suggestions.sort((a, b) => a.priority - b.priority).map((suggestion, index) => {
              const iconClass = suggestion.type === 'warning' ? 'text-orange-600' :
                              suggestion.type === 'success' ? 'text-green-600' : 'text-blue-600';
              const bgClass = suggestion.type === 'warning' ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200' :
                             suggestion.type === 'success' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 
                             'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200';
              
              return (
                <motion.div 
                  key={index} 
                  className={`border rounded-xl p-6 ${bgClass} hover:shadow-md transition-all duration-300`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${
                      suggestion.type === 'warning' ? 'bg-orange-100' :
                      suggestion.type === 'success' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <AlertTriangle className={`h-5 w-5 ${iconClass}`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-bold text-slate-800">{suggestion.title}</h3>
                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                          Priority {suggestion.priority}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{suggestion.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AIDashboard;