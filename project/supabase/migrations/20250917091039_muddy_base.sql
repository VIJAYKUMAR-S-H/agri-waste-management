/*
  # Initial Schema for AgriWaste Platform

  1. New Tables
    - `users` - User accounts with role-based access
    - `seller_profiles` - Extended seller information
    - `seller_listings` - Food items for sale
    - `purchase_history` - Transaction records
    - `storage_records` - Storage conditions for ML
    - `notifications` - User notifications
    - `audit_logs` - System audit trail

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
    - Secure user data access

  3. Indexes
    - Geospatial indexes for location queries
    - Text search indexes for listings
    - Performance indexes for common queries
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  phone TEXT NOT NULL CHECK (phone ~ '^\+?[1-9]\d{1,14}$'),
  role TEXT NOT NULL CHECK (role IN ('seller', 'buyer', 'admin')),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seller profiles table
CREATE TABLE IF NOT EXISTS seller_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT CHECK (length(business_name) <= 150),
  business_type TEXT NOT NULL CHECK (business_type IN ('restaurant', 'grocery', 'hotel', 'farm', 'other')),
  address TEXT NOT NULL CHECK (length(address) <= 300),
  city TEXT NOT NULL CHECK (length(city) <= 100),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0.0 AND rating <= 5.0),
  total_ratings INTEGER DEFAULT 0 CHECK (total_ratings >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Seller listings table
CREATE TABLE IF NOT EXISTS seller_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) >= 5 AND length(title) <= 120),
  description TEXT NOT NULL CHECK (length(description) >= 10 AND length(description) <= 1000),
  category TEXT NOT NULL CHECK (category IN ('vegetables', 'fruits', 'dairy', 'meat', 'grains', 'prepared', 'other')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0.0),
  mfg_date TIMESTAMPTZ NOT NULL,
  exp_date TIMESTAMPTZ NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  contact_phone TEXT NOT NULL CHECK (contact_phone ~ '^\+?[1-9]\d{1,14}$'),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'removed')),
  views INTEGER DEFAULT 0 CHECK (views >= 0),
  predicted_spoilage_date TIMESTAMPTZ,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0.0 AND ai_confidence <= 1.0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_dates CHECK (exp_date > mfg_date),
  CONSTRAINT valid_mfg_date CHECK (mfg_date <= now())
);

-- Purchase history table
CREATE TABLE IF NOT EXISTS purchase_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES seller_listings(id) ON DELETE CASCADE,
  quantity_purchased INTEGER NOT NULL CHECK (quantity_purchased > 0),
  purchase_price DECIMAL(10,2) NOT NULL CHECK (purchase_price > 0.0),
  purchase_date TIMESTAMPTZ DEFAULT now(),
  was_consumed BOOLEAN,
  waste_amount DECIMAL(8,2) CHECK (waste_amount >= 0.0),
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Storage records table for ML features
CREATE TABLE IF NOT EXISTS storage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL REFERENCES purchase_history(id) ON DELETE CASCADE,
  storage_temperature DECIMAL(5,2),
  storage_humidity DECIMAL(5,2),
  storage_type TEXT NOT NULL CHECK (storage_type IN ('refrigerated', 'frozen', 'room_temp', 'pantry')),
  actual_spoilage_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('expiry_warning', 'price_alert', 'system', 'promotion')),
  title TEXT NOT NULL CHECK (length(title) <= 200),
  message TEXT NOT NULL CHECK (length(message) <= 1000),
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (length(action) <= 100),
  resource_type TEXT NOT NULL CHECK (length(resource_type) <= 50),
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  details JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_seller_profiles_user_id ON seller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_location ON seller_profiles USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_business_type ON seller_profiles(business_type);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_city ON seller_profiles(city);

CREATE INDEX IF NOT EXISTS idx_seller_listings_seller_id ON seller_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_listings_location ON seller_listings USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_seller_listings_category ON seller_listings(category);
CREATE INDEX IF NOT EXISTS idx_seller_listings_status ON seller_listings(status);
CREATE INDEX IF NOT EXISTS idx_seller_listings_exp_date ON seller_listings(exp_date);
CREATE INDEX IF NOT EXISTS idx_seller_listings_created_at ON seller_listings(created_at);
CREATE INDEX IF NOT EXISTS idx_seller_listings_risk_level ON seller_listings(risk_level);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_seller_listings_search ON seller_listings 
USING GIN(to_tsvector('english', title || ' ' || description));

CREATE INDEX IF NOT EXISTS idx_purchase_history_buyer_id ON purchase_history(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchase_history_seller_id ON purchase_history(seller_id);
CREATE INDEX IF NOT EXISTS idx_purchase_history_listing_id ON purchase_history(listing_id);
CREATE INDEX IF NOT EXISTS idx_purchase_history_purchase_date ON purchase_history(purchase_date);

CREATE INDEX IF NOT EXISTS idx_storage_records_purchase_id ON storage_records(purchase_id);
CREATE INDEX IF NOT EXISTS idx_storage_records_storage_type ON storage_records(storage_type);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for seller_profiles table
CREATE POLICY "Anyone can read verified seller profiles" ON seller_profiles
  FOR SELECT TO authenticated
  USING (verification_status = 'verified');

CREATE POLICY "Sellers can manage own profile" ON seller_profiles
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for seller_listings table
CREATE POLICY "Anyone can read active listings" ON seller_listings
  FOR SELECT TO authenticated
  USING (status = 'active');

CREATE POLICY "Sellers can manage own listings" ON seller_listings
  FOR ALL TO authenticated
  USING (seller_id = auth.uid());

-- RLS Policies for purchase_history table
CREATE POLICY "Users can read own purchase history" ON purchase_history
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Buyers can create purchase records" ON purchase_history
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Users can update own purchase records" ON purchase_history
  FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- RLS Policies for storage_records table
CREATE POLICY "Users can read own storage records" ON storage_records
  FOR SELECT TO authenticated
  USING (
    purchase_id IN (
      SELECT id FROM purchase_history 
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can manage storage records" ON storage_records
  FOR ALL TO authenticated
  USING (
    purchase_id IN (
      SELECT id FROM purchase_history WHERE buyer_id = auth.uid()
    )
  );

-- RLS Policies for notifications table
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for audit_logs table
CREATE POLICY "Admins can read all audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seller_profiles_updated_at 
  BEFORE UPDATE ON seller_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seller_listings_updated_at 
  BEFORE UPDATE ON seller_listings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create seller profile
CREATE OR REPLACE FUNCTION create_seller_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'seller' THEN
    INSERT INTO seller_profiles (user_id, business_type, address, city, location)
    VALUES (
      NEW.id, 
      'other', 
      'Address not set', 
      'City not set', 
      ST_GeogFromText('POINT(-74.0060 40.7128)') -- Default to NYC
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create seller profile automatically
CREATE TRIGGER create_seller_profile_trigger
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_seller_profile();