import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'seller' | 'buyer' | 'admin';
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  last_login?: string;
}

export interface SellerProfile {
  id: string;
  user_id: string;
  business_name?: string;
  business_type: 'restaurant' | 'grocery' | 'hotel' | 'farm' | 'other';
  address: string;
  city: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  verification_status: 'pending' | 'verified' | 'rejected';
  rating: number;
  total_ratings: number;
  created_at: string;
}

export interface SellerListing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category: 'vegetables' | 'fruits' | 'dairy' | 'meat' | 'grains' | 'prepared' | 'other';
  quantity: number;
  price: number;
  mfg_date: string;
  exp_date: string;
  image_urls: string[];
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  contact_phone: string;
  status: 'active' | 'sold' | 'expired' | 'removed';
  views: number;
  created_at: string;
  updated_at: string;
  // ML predictions
  predicted_spoilage_date?: string;
  risk_level?: 'low' | 'medium' | 'high';
  ai_confidence?: number;
}

export interface PurchaseHistory {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  quantity_purchased: number;
  purchase_price: number;
  purchase_date: string;
  was_consumed?: boolean;
  waste_amount?: number;
  feedback_rating?: number;
}

export interface WasteMetrics {
  total_waste_prevented: number;
  active_listings: number;
  average_expiry_days: number;
  top_waste_categories: Array<{
    category: string;
    amount: number;
    percentage: number;
    trend: number;
  }>;
  waste_by_location: Array<{
    city: string;
    waste_amount: number;
    coordinates: [number, number];
    prevention_rate: number;
  }>;
  suggestions: Array<{
    type: 'warning' | 'info' | 'success';
    title: string;
    description: string;
    priority: number;
  }>;
  expiry_predictions: Array<{
    listing_id: string;
    title: string;
    predicted_date: string;
    confidence: number;
    risk_level: string;
    days_remaining: number;
  }>;
}