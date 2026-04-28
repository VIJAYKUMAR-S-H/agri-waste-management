import axios from 'axios';
import { supabase } from './supabase';
import type { User, SellerListing, WasteMetrics, PurchaseHistory } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: 'seller' | 'buyer';
  }) {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          phone: userData.phone,
          role: userData.role,
        }
      }
    });

    if (error) throw error;

    // Store additional user data in our custom table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          role: userData.role,
          is_active: true,
          email_verified: false,
          created_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;
    }

    return data;
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Update last login
    if (data.user) {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);
    }

    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return userData;
  }
};

// Search API
export const searchAPI = {
  async searchSellers(params: {
    q?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    category?: string;
  }) {
    try {
      // For demo, we'll use Supabase with some mock data
      let query = supabase
        .from('seller_listings')
        .select(`
          *,
          seller_profiles!inner(
            business_name,
            business_type,
            rating,
            total_ratings
          )
        `)
        .eq('status', 'active');

      if (params.category) {
        query = query.eq('category', params.category);
      }

      if (params.q) {
        query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`);
      }

      const { data, error } = await query.limit(20);
      
      if (error) throw error;

      // Calculate distances if location provided
      const results = data?.map(listing => ({
        ...listing,
        distance: params.lat && params.lng 
          ? calculateDistance(
              params.lat, 
              params.lng, 
              listing.location.coordinates[1], 
              listing.location.coordinates[0]
            )
          : null
      })) || [];

      return {
        results: results.filter(r => !params.radius || !r.distance || r.distance <= params.radius),
        total: results.length,
        page: 1,
        per_page: 20
      };
    } catch (error) {
      console.error('Search error:', error);
      // Return mock data for demo
      return getMockSearchResults(params);
    }
  }
};

// Seller API
export const sellerAPI = {
  async createListing(listingData: Omit<SellerListing, 'id' | 'created_at' | 'updated_at' | 'views'>) {
    const { data, error } = await supabase
      .from('seller_listings')
      .insert({
        ...listingData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        views: 0,
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger ML prediction
    await mlAPI.predictExpiry(data.id);

    return data;
  },

  async getListings(sellerId: string) {
    const { data, error } = await supabase
      .from('seller_listings')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateListing(id: string, updates: Partial<SellerListing>) {
    const { data, error } = await supabase
      .from('seller_listings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteListing(id: string) {
    const { error } = await supabase
      .from('seller_listings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Buyer API
export const buyerAPI = {
  async searchListings(params: {
    location?: string;
    category?: string;
    maxPrice?: number;
    maxDistance?: number;
    lat?: number;
    lng?: number;
  }) {
    return searchAPI.searchSellers(params);
  },

  async purchaseItem(purchaseData: Omit<PurchaseHistory, 'id' | 'purchase_date'>) {
    const { data, error } = await supabase
      .from('purchase_history')
      .insert({
        ...purchaseData,
        purchase_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Machine Learning API
export const mlAPI = {
  async predictExpiry(listingId: string) {
    try {
      // Get listing data
      const { data: listing, error } = await supabase
        .from('seller_listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (error) throw error;

      // Simulate ML prediction (in production, this would call your ML service)
      const prediction = await simulateMLPrediction(listing);

      // Update listing with prediction
      await supabase
        .from('seller_listings')
        .update({
          predicted_spoilage_date: prediction.predicted_spoilage_date,
          risk_level: prediction.risk_level,
          ai_confidence: prediction.confidence,
        })
        .eq('id', listingId);

      return prediction;
    } catch (error) {
      console.error('ML prediction error:', error);
      return null;
    }
  },

  async getDashboardMetrics(filters: {
    timeRange?: string;
    location?: string;
  }): Promise<WasteMetrics> {
    try {
      // In production, this would aggregate real data
      // For now, we'll return enhanced mock data with some real calculations
      
      const { data: listings } = await supabase
        .from('seller_listings')
        .select('*')
        .eq('status', 'active');

      const { data: purchases } = await supabase
        .from('purchase_history')
        .select('*');

      return generateDashboardMetrics(listings || [], purchases || []);
    } catch (error) {
      console.error('Dashboard metrics error:', error);
      return getMockDashboardMetrics();
    }
  },

  async getWasteHotspots() {
    // Simulate geospatial analysis
    return [
      { city: 'Manhattan', lat: 40.7831, lng: -73.9712, waste_level: 'high' },
      { city: 'Brooklyn', lat: 40.6782, lng: -73.9442, waste_level: 'medium' },
      { city: 'Queens', lat: 40.7282, lng: -73.7949, waste_level: 'low' },
    ];
  }
};

// Utility functions
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function simulateMLPrediction(listing: any) {
  // Simulate ML model prediction based on listing data
  const mfgDate = new Date(listing.mfg_date);
  const expDate = new Date(listing.exp_date);
  const now = new Date();
  
  const totalShelfLife = expDate.getTime() - mfgDate.getTime();
  const timeElapsed = now.getTime() - mfgDate.getTime();
  const remainingLife = expDate.getTime() - now.getTime();
  
  // Simulate prediction with some randomness
  const degradationFactor = Math.random() * 0.3 + 0.7; // 0.7 to 1.0
  const predictedSpoilageTime = now.getTime() + (remainingLife * degradationFactor);
  const predictedDate = new Date(predictedSpoilageTime);
  
  const daysUntilSpoilage = (predictedSpoilageTime - now.getTime()) / (1000 * 60 * 60 * 24);
  
  let riskLevel: 'low' | 'medium' | 'high';
  if (daysUntilSpoilage <= 1) riskLevel = 'high';
  else if (daysUntilSpoilage <= 3) riskLevel = 'medium';
  else riskLevel = 'low';
  
  return {
    predicted_spoilage_date: predictedDate.toISOString(),
    confidence: Math.random() * 0.3 + 0.7, // 0.7 to 1.0
    risk_level: riskLevel,
    recommendations: [
      riskLevel === 'high' ? 'Consider immediate discount or donation' : 
      riskLevel === 'medium' ? 'Monitor closely and consider promotion' :
      'Item is stable, continue normal operations'
    ]
  };
}

function generateDashboardMetrics(listings: any[], purchases: any[]): WasteMetrics {
  const activeListings = listings.filter(l => l.status === 'active').length;
  const totalWastePrevented = purchases.reduce((sum, p) => sum + (p.waste_amount || 0), 0);
  
  const categoryStats = listings.reduce((acc, listing) => {
    acc[listing.category] = (acc[listing.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryStats)
    .map(([category, count]) => ({
      category,
      amount: count * 2.5, // Simulate kg
      percentage: Math.round((count / listings.length) * 100),
      trend: Math.random() * 20 - 10 // -10 to +10
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    total_waste_prevented: totalWastePrevented || 2847,
    active_listings: activeListings,
    average_expiry_days: 4.2,
    top_waste_categories: topCategories.length ? topCategories : getMockCategories(),
    waste_by_location: getMockLocations(),
    suggestions: getMockSuggestions(),
    expiry_predictions: listings
      .filter(l => l.predicted_spoilage_date)
      .map(l => ({
        listing_id: l.id,
        title: l.title,
        predicted_date: l.predicted_spoilage_date,
        confidence: l.ai_confidence || 0.8,
        risk_level: l.risk_level || 'medium',
        days_remaining: Math.ceil((new Date(l.predicted_spoilage_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      }))
      .slice(0, 10)
  };
}

// Mock data functions
function getMockSearchResults(params: any) {
  return {
    results: [
      {
        id: '1',
        name: 'Green Valley Restaurant',
        type: 'restaurant',
        location: {
          address: '123 Main St, Downtown',
          coordinates: [40.7589, -73.9851],
          city: 'New York'
        },
        phone: '+1-555-0123',
        listings_count: 12,
        average_rating: 4.5,
        distance: 2.3
      },
      {
        id: '2',
        name: 'Fresh Market Grocery',
        type: 'shop',
        location: {
          address: '456 Oak Ave, Midtown',
          coordinates: [40.7505, -73.9934],
          city: 'New York'
        },
        phone: '+1-555-0456',
        listings_count: 8,
        average_rating: 4.2,
        distance: 1.7
      }
    ],
    total: 2,
    page: 1,
    per_page: 20
  };
}

function getMockDashboardMetrics(): WasteMetrics {
  return {
    total_waste_prevented: 2847,
    active_listings: 156,
    average_expiry_days: 4.2,
    top_waste_categories: getMockCategories(),
    waste_by_location: getMockLocations(),
    suggestions: getMockSuggestions(),
    expiry_predictions: [
      {
        listing_id: '1',
        title: 'Fresh Vegetables Bundle',
        predicted_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        confidence: 0.87,
        risk_level: 'medium',
        days_remaining: 2
      }
    ]
  };
}

function getMockCategories() {
  return [
    { category: 'Vegetables', amount: 45.2, percentage: 32, trend: -5 },
    { category: 'Fruits', amount: 38.7, percentage: 28, trend: 3 },
    { category: 'Prepared Food', amount: 28.4, percentage: 20, trend: -2 },
    { category: 'Dairy', amount: 18.9, percentage: 13, trend: -8 },
    { category: 'Meat & Seafood', amount: 9.8, percentage: 7, trend: 1 }
  ];
}

function getMockLocations() {
  return [
    { city: 'Manhattan', waste_amount: 89.3, coordinates: [40.7831, -73.9712] as [number, number], prevention_rate: 78 },
    { city: 'Brooklyn', waste_amount: 76.8, coordinates: [40.6782, -73.9442] as [number, number], prevention_rate: 82 },
    { city: 'Queens', waste_amount: 54.2, coordinates: [40.7282, -73.7949] as [number, number], prevention_rate: 75 },
    { city: 'Bronx', waste_amount: 67.1, coordinates: [40.8448, -73.8648] as [number, number], prevention_rate: 71 }
  ];
}

function getMockSuggestions() {
  return [
    {
      type: 'warning' as const,
      title: 'High Waste Alert: Vegetables',
      description: 'Vegetable waste has increased 23% this week. Consider promoting bulk vegetable sales to restaurants.',
      priority: 1
    },
    {
      type: 'info' as const,
      title: 'Optimization Opportunity',
      description: 'Brooklyn has 67% more buyers than sellers. Consider encouraging more sellers in this area.',
      priority: 2
    },
    {
      type: 'success' as const,
      title: 'Positive Trend',
      description: 'Dairy waste decreased by 15% this month thanks to improved expiry predictions.',
      priority: 3
    }
  ];
}