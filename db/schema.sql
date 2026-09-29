-- ==============================================================================
-- JAY REAL ESTATE — POSTGRESQL SCHEMA FOR NEON DATABASE (EXPANDED CRM & VAULT)
-- ==============================================================================

-- 1. DEVELOPERS TABLE
CREATE TABLE IF NOT EXISTS developers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  founded_year INT DEFAULT 2012,
  description TEXT,
  logo_badge VARCHAR(100),
  tier VARCHAR(50) DEFAULT 'Ultra-Luxury',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. STAFF LOGINS / AGENTS TABLE
CREATE TABLE IF NOT EXISTS staff_logins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(80) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'agent', -- 'admin' or 'agent'
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(120) NOT NULL,
  avatar_url TEXT,
  monthly_target_aed BIGINT DEFAULT 30000000,
  deals_closed_count INT DEFAULT 0,
  commission_earned_aed BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. OFF-PLAN PROJECTS TABLE
CREATE TABLE IF NOT EXISTS off_plan_projects (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(150) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  developer_id INT REFERENCES developers(id) ON DELETE SET NULL,
  location VARCHAR(120) NOT NULL,
  handover_date VARCHAR(60) NOT NULL,
  starting_price_aed BIGINT NOT NULL,
  payment_plan VARCHAR(150) NOT NULL,
  units_summary VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  gallery_urls JSONB DEFAULT '[]'::jsonb,
  description TEXT NOT NULL,
  brochure_name VARCHAR(150) DEFAULT 'Brochure.pdf',
  status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Pre-Launch', 'Sold Out'
  is_featured BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. PROPERTIES (READY HOMES) TABLE
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(150) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  community VARCHAR(120) NOT NULL,
  property_type VARCHAR(60) NOT NULL,
  status VARCHAR(60) DEFAULT 'Ready to Move', -- 'Ready to Move', 'Under Offer', 'Sold'
  price_aed BIGINT NOT NULL,
  bedrooms INT NOT NULL,
  bathrooms INT NOT NULL,
  sqft INT NOT NULL,
  badge VARCHAR(100),
  image_url TEXT NOT NULL,
  gallery_urls JSONB DEFAULT '[]'::jsonb,
  description TEXT NOT NULL,
  amenities JSONB DEFAULT '[]'::jsonb,
  furnishing VARCHAR(60) DEFAULT 'Designer Furnished',
  parking_bays INT DEFAULT 2,
  is_sold BOOLEAN DEFAULT false,
  sold_price_aed BIGINT DEFAULT NULL,
  sold_date TIMESTAMP DEFAULT NULL,
  is_featured BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. BUYER LEADS TABLE (WITH SCORING & STAGES)
CREATE TABLE IF NOT EXISTS buyer_leads (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(150),
  country VARCHAR(80) DEFAULT 'International',
  budget_range VARCHAR(80),
  interest_type VARCHAR(100) NOT NULL,
  property_id INT REFERENCES properties(id) ON DELETE SET NULL,
  project_id INT REFERENCES off_plan_projects(id) ON DELETE SET NULL,
  stage VARCHAR(50) DEFAULT 'New', -- 'New', 'Contacted', 'Viewing', 'Offer', 'Won', 'Lost'
  lead_score INT DEFAULT 50, -- 0 to 100
  lead_rating VARCHAR(20) DEFAULT 'WARM', -- 'HOT', 'WARM', 'COLD'
  is_cash_buyer BOOLEAN DEFAULT false,
  buying_timeframe VARCHAR(50) DEFAULT '1-3 months', -- 'Immediately', '1-3 months', '3-6 months', 'Exploratory'
  source_form VARCHAR(100) DEFAULT 'Website VIP Form',
  source_page VARCHAR(100) DEFAULT 'Home Page',
  assigned_agent_id INT REFERENCES staff_logins(id) ON DELETE SET NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. NOTES TABLE
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  lead_id INT REFERENCES buyer_leads(id) ON DELETE CASCADE,
  property_id INT REFERENCES properties(id) ON DELETE SET NULL,
  staff_id INT REFERENCES staff_logins(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. VIEWINGS TABLE
CREATE TABLE IF NOT EXISTS viewings (
  id SERIAL PRIMARY KEY,
  lead_id INT REFERENCES buyer_leads(id) ON DELETE CASCADE,
  property_id INT REFERENCES properties(id) ON DELETE CASCADE,
  staff_id INT REFERENCES staff_logins(id) ON DELETE SET NULL,
  viewing_date VARCHAR(60) NOT NULL,
  viewing_time VARCHAR(40) NOT NULL,
  status VARCHAR(50) DEFAULT 'Confirmed', -- 'Confirmed', 'Completed', 'Rescheduled', 'Cancelled'
  client_feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. COMPLETED SALES TABLE (2% COMMISSION)
CREATE TABLE IF NOT EXISTS completed_sales (
  id SERIAL PRIMARY KEY,
  lead_id INT REFERENCES buyer_leads(id) ON DELETE SET NULL,
  property_id INT REFERENCES properties(id) ON DELETE SET NULL,
  property_title VARCHAR(200) NOT NULL,
  community VARCHAR(120) NOT NULL,
  sale_price_aed BIGINT NOT NULL,
  buyer_name VARCHAR(150) NOT NULL,
  staff_id INT REFERENCES staff_logins(id) ON DELETE SET NULL,
  sale_date VARCHAR(60) NOT NULL,
  commission_aed BIGINT NOT NULL, -- 2% of sale price
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
