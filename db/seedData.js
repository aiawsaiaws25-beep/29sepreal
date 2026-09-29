/**
 * JAY REAL ESTATE — ENRICHED SEED DATASET WITH SCORING & PIPELINE STAGES
 */

// Helper to calculate score dynamically
function calculateLeadScore(lead) {
  let score = 0;
  // 1. Cash buyer (+25 pts)
  if (lead.is_cash_buyer) score += 25;
  
  // 2. Buying timeframe
  if (lead.buying_timeframe === 'Immediately') score += 20;
  else if (lead.buying_timeframe === '1-3 months') score += 15;
  else if (lead.buying_timeframe === '3-6 months') score += 10;
  else score += 5;

  // 3. Budget range
  if (lead.budget_range?.includes('50M') || lead.budget_range?.includes('35M+')) score += 25;
  else if (lead.budget_range?.includes('30M') || lead.budget_range?.includes('25M') || lead.budget_range?.includes('15M - 35M')) score += 20;
  else if (lead.budget_range?.includes('10M') || lead.budget_range?.includes('5M - 15M')) score += 15;
  else score += 10;

  // 4. Valid phone number (+15 pts)
  if (lead.phone && lead.phone.length >= 8) score += 15;

  // 5. Attached specific property/project (+15 pts)
  if (lead.property_id || lead.project_id) score += 15;

  score = Math.min(100, Math.max(0, score));
  let rating = 'WARM';
  if (score >= 70) rating = 'HOT';
  else if (score < 40) rating = 'COLD';

  return { score, rating };
}

const DEVELOPERS_DATA = [
  {
    name: 'Aura Prestige Living',
    slug: 'aura-prestige',
    founded_year: 2014,
    description: 'Pioneers in coastal avant-garde architecture, specializing in private island mansions and waterfront sanctuary residences.',
    logo_badge: 'AURA PRESTIGE',
    tier: 'Ultra-Luxury Bespoke'
  },
  {
    name: 'Zenith Luxury Developments',
    slug: 'zenith-developments',
    founded_year: 2011,
    description: 'Renowned for world-class high-rise engineering, signature penthouses overlooking iconic city skylines, and private sky lounges.',
    logo_badge: 'ZENITH LUXE',
    tier: 'Skyline Landmark'
  },
  {
    name: 'Horizon Prime Estates',
    slug: 'horizon-prime',
    founded_year: 2016,
    description: 'Creators of private fairway estates, lush biophilic gated sanctuaries, and low-density luxury family communities.',
    logo_badge: 'HORIZON PRIME',
    tier: 'Fairway & Parkland'
  },
  {
    name: 'Elysian Haute Properties',
    slug: 'elysian-haute',
    founded_year: 2015,
    description: 'Boutique European-inspired developer known for hand-selected Italian travertine, bespoke concierge services, and private wellness pavilions.',
    logo_badge: 'ELYSIAN HAUTE',
    tier: 'Boutique Atelier'
  },
  {
    name: 'Vanguard Heritage Capital',
    slug: 'vanguard-heritage',
    founded_year: 2009,
    description: 'Institutional-grade master developer crafting high-yield urban canal districts and integrated waterfront promenades in central Dubai.',
    logo_badge: 'VANGUARD HERITAGE',
    tier: 'Master Urban Developer'
  }
];

const STAFF_DATA = [
  {
    username: 'admin',
    password: 'jay2026!',
    full_name: 'Jayden Vance',
    role: 'admin', // Admin sees everything
    phone: '+971 50 800 5291',
    email: 'admin@jayrealestate.ae',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    monthly_target_aed: 80000000,
    deals_closed_count: 42,
    commission_earned_aed: 1600000
  },
  {
    username: 'slaurent',
    password: 'agent123',
    full_name: 'Sophia Laurent-Sterling',
    role: 'agent',
    phone: '+971 50 800 5292',
    email: 's.laurent@jayrealestate.ae',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    monthly_target_aed: 45000000,
    deals_closed_count: 36,
    commission_earned_aed: 900000
  },
  {
    username: 'tariq',
    password: 'agent123',
    full_name: 'Tariq Mansoor Al-Hashemi',
    role: 'agent',
    phone: '+971 50 800 5293',
    email: 't.hashemi@jayrealestate.ae',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    monthly_target_aed: 40000000,
    deals_closed_count: 29,
    commission_earned_aed: 760000
  }
];

const OFFPLAN_DATA = [
  {
    id: 1,
    slug: 'the-palm-serenade-mansions',
    title: 'The Palm Serenade Island Mansions',
    developer_id: 1,
    location: 'Palm Jumeirah',
    handover_date: 'Q2 2028',
    starting_price_aed: 28000000,
    payment_plan: '70/30 Milestone Linked (20% Booking, 50% During Build, 30% On Handover)',
    units_summary: '5 & 6 Bedroom Signature Beachfront Mansions with Private Berths',
    image_url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: [
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'A limited enclave of only 16 ultra-exclusive coastal estates on Palm Jumeirah with private yacht moorings.',
    brochure_name: 'Palm_Serenade_Investor_Brochure.pdf',
    status: 'Active',
    is_featured: true
  },
  {
    id: 2,
    slug: 'solstice-horizon-tower',
    title: 'Solstice Horizon Sky Tower',
    developer_id: 2,
    location: 'Downtown Dubai',
    handover_date: 'Q4 2027',
    starting_price_aed: 4500000,
    payment_plan: '60/40 Post-Handover (10% Down, 50% During Build, 40% Over 2 Years Post-Handover)',
    units_summary: '1 to 4 Bedroom Sky Residences & Duplex Penthouses',
    image_url: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: [
      'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'An architectural 74-story sculpted glass landmark in Downtown Dubai with panoramic Burj Khalifa views.',
    brochure_name: 'Solstice_Downtown_Floorplans.pdf',
    status: 'Active',
    is_featured: true
  },
  {
    id: 3,
    slug: 'aura-marine-bay-residences',
    title: 'Aura Marine Bay Waterfront',
    developer_id: 1,
    location: 'Dubai Marina',
    handover_date: 'Q1 2028',
    starting_price_aed: 3800000,
    payment_plan: '60/40 Linked (20% Down, 40% Construction, 40% Handover)',
    units_summary: '2, 3 & 4 Bed Yacht-View Suites with Expansive Balconies',
    image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Direct marina promenade frontage with floor-to-ceiling glass wrapping around the yacht harbor.',
    brochure_name: 'Aura_Marine_Bay_Specs.pdf',
    status: 'Active',
    is_featured: true
  },
  {
    id: 4,
    slug: 'fairway-crest-terraces',
    title: 'Fairway Crest Terraces',
    developer_id: 3,
    location: 'Dubai Hills Estate',
    handover_date: 'Q3 2027',
    starting_price_aed: 3200000,
    payment_plan: '50/50 Flexible Investor Plan (10% Down, 40% Build, 50% Handover)',
    units_summary: '1, 2 & 3 Bedroom Golf Course Frontage Terraces',
    image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Low-rise biophilic elegance overlooking the greens of Dubai Hills Golf Club.',
    brochure_name: 'Fairway_Crest_Masterplan.pdf',
    status: 'Active',
    is_featured: true
  },
  {
    id: 5,
    slug: 'canal-edge-luxury-suites',
    title: 'Canal Edge Luxury Suites',
    developer_id: 5,
    location: 'Business Bay',
    handover_date: 'Q4 2027',
    starting_price_aed: 2400000,
    payment_plan: '60/40 Construction Linked (15% Down, 45% Build, 40% Handover)',
    units_summary: 'Studio, 1 & 2 Bedroom High-Yield Canal Suites',
    image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Prime Dubai Water Canal positioning with private water taxi pickup and 8.5% net ROI forecast.',
    brochure_name: 'Canal_Edge_Investment_Case.pdf',
    status: 'Active',
    is_featured: false
  },
  {
    id: 6,
    slug: 'verdant-heights-residences',
    title: 'Verdant Heights Residences',
    developer_id: 4,
    location: 'Jumeirah Village Circle (JVC)',
    handover_date: 'Q2 2027',
    starting_price_aed: 950000,
    payment_plan: '70/30 (20% Down, 50% During Build, 30% on Handover)',
    units_summary: 'Modern 1 & 2 Bed Smart Apartments & Townhouse Pods',
    image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'A boutique luxury community in JVC with rooftop running track and smart climate automation.',
    brochure_name: 'Verdant_Heights_Brochure.pdf',
    status: 'Active',
    is_featured: false
  }
];

const PROPERTIES_DATA = [
  {
    id: 1,
    slug: 'the-sky-villa-palm-horizon',
    title: 'The Sky Villa at Palm Horizon',
    community: 'Palm Jumeirah',
    property_type: 'Villa',
    status: 'Ready to Move',
    price_aed: 52000000,
    bedrooms: 5,
    bathrooms: 6,
    sqft: 9400,
    badge: 'Signature Frond',
    image_url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'An architectural triumph situated on the private fronds of Palm Jumeirah with 25m infinity pool.',
    amenities: ['Private Beach Access', 'Infinity Pool', 'Staff Quarters', 'Smart Automation', 'Private Boat Jetty'],
    furnishing: 'Fully Furnished by Italian Designers',
    parking_bays: 4,
    is_sold: false,
    is_featured: true
  },
  {
    id: 2,
    slug: 'royal-atlantis-sky-duplex',
    title: 'Royal Atlantis Signature Sky Duplex',
    community: 'Palm Jumeirah',
    property_type: 'Penthouse',
    status: 'Ready to Move',
    price_aed: 38500000,
    bedrooms: 4,
    bathrooms: 5,
    sqft: 6850,
    badge: 'Iconic Palm View',
    image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'],
    description: 'Experience ultra-luxury living in Palm Jumeirah with a duplex infinity pool and 5-star concierge services.',
    amenities: ['Private Sky Pool', 'Celebrity Chef Dining Access', 'Concierge & Valet', 'Spa Membership'],
    furnishing: 'Custom Curated Luxury',
    parking_bays: 3,
    is_sold: false,
    is_featured: true
  },
  {
    id: 3,
    slug: 'oceana-palm-waterfront-penthouse',
    title: 'Oceana Palm Waterfront Penthouse',
    community: 'Palm Jumeirah',
    property_type: 'Penthouse',
    status: 'Sold',
    price_aed: 14200000,
    bedrooms: 3,
    bathrooms: 4,
    sqft: 4200,
    badge: 'Private Marina Dock',
    image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'],
    description: 'Tranquil sea-facing residence with generous outdoor entertainment terrace.',
    amenities: ['Beach Club Access', 'Marina Views', 'Resort Pool', 'Gym & Health Club'],
    furnishing: 'Semi-Furnished',
    parking_bays: 2,
    is_sold: true,
    sold_price_aed: 14200000,
    is_featured: false
  },
  {
    id: 4,
    slug: 'burj-crown-duplex-penthouse',
    title: 'Burj Crown Duplex Sky Penthouse',
    community: 'Downtown Dubai',
    property_type: 'Penthouse',
    status: 'Ready to Move',
    price_aed: 34000000,
    bedrooms: 4,
    bathrooms: 5,
    sqft: 7200,
    badge: 'Burj Skyline Views',
    image_url: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: ['https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1200&q=80'],
    description: 'Occupying the top two penthouse floors in Downtown Dubai with front-row panoramas of Burj Khalifa.',
    amenities: ['360° Skyline Views', 'Private Elevator', 'Rooftop Jacuzzi', 'Private Cinema'],
    furnishing: 'Fully Designer Furnished',
    parking_bays: 4,
    is_sold: false,
    is_featured: true
  },
  {
    id: 5,
    slug: 'opera-grand-boulevard-suite',
    title: 'Opera Grand Executive 3-Bed Suite',
    community: 'Downtown Dubai',
    property_type: 'Apartment',
    status: 'Ready to Move',
    price_aed: 9800000,
    bedrooms: 3,
    bathrooms: 4,
    sqft: 2650,
    badge: 'Opera District',
    image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'],
    description: 'Walk directly to the world-renowned Dubai Opera. High-floor corner layout with dual balconies.',
    amenities: ['Burj Khalifa View', 'Infinity Rooftop Pool', 'Billiards Room', 'Direct Mall Connection'],
    furnishing: 'Unfurnished / New Handover',
    parking_bays: 2,
    is_sold: false,
    is_featured: false
  },
  {
    id: 6,
    slug: 'fountain-views-luxury-2-bed',
    title: 'Boulevard Heights Luxury Residence',
    community: 'Downtown Dubai',
    property_type: 'Apartment',
    status: 'Ready to Move',
    price_aed: 6400000,
    bedrooms: 2,
    bathrooms: 3,
    sqft: 1850,
    badge: 'Prime Downtown',
    image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'],
    description: 'Bright open-plan living framing the Dubai Boulevard with high-grade wooden parquet flooring.',
    amenities: ['Boulevard Views', 'Gymnasium', 'Outdoor Swimming Pool', 'Barbecue Area'],
    furnishing: 'Fully Furnished',
    parking_bays: 1,
    is_sold: false,
    is_featured: false
  },
  {
    id: 7,
    slug: 'le-reve-sky-mansion',
    title: 'Le Rêve Sky Mansion Penthouse',
    community: 'Dubai Marina',
    property_type: 'Penthouse',
    status: 'Sold',
    price_aed: 26000000,
    bedrooms: 5,
    bathrooms: 6,
    sqft: 6100,
    badge: 'Ultra High Floor',
    image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'],
    description: 'One of Dubai Marina’s most prestigious addresses with private high-speed elevator and helipad access.',
    amenities: ['Helipad Access', 'Valet Parking', 'Dedicated Chauffeur Lounge', 'Private Spa Suite'],
    furnishing: 'Furnished by Minotti',
    parking_bays: 3,
    is_sold: true,
    sold_price_aed: 26000000,
    is_featured: true
  },
  {
    id: 8,
    slug: 'marina-gate-waterfront-penthouse',
    title: 'Marina Gate Waterfront Residence',
    community: 'Dubai Marina',
    property_type: 'Apartment',
    status: 'Ready to Move',
    price_aed: 7500000,
    bedrooms: 3,
    bathrooms: 4,
    sqft: 2200,
    badge: 'Yacht Basin Front',
    image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'],
    description: 'Floor-to-ceiling glass wrapping around the shimmering Dubai Marina yacht basin.',
    amenities: ['Dual-Level Fitness Centre', 'Infinity Pool', 'Squash & Paddle Courts', 'Resident Lounge'],
    furnishing: 'Designer Furnished',
    parking_bays: 2,
    is_sold: false,
    is_featured: false
  },
  {
    id: 9,
    slug: 'cayan-tower-spiral-suite',
    title: 'Cayan Tower Sunset Marina Suite',
    community: 'Dubai Marina',
    property_type: 'Apartment',
    status: 'Ready to Move',
    price_aed: 3950000,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1450,
    badge: 'Iconic Architecture',
    image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'],
    description: 'High floor suite in the twisting Cayan Tower with sunset sea views over Ain Dubai.',
    amenities: ['Sea Views', 'Outdoor Pool', 'Sauna & Steam Room', 'Covered Parking'],
    furnishing: 'Modern Furnishings',
    parking_bays: 1,
    is_sold: false,
    is_featured: false
  },
  {
    id: 10,
    slug: 'hills-grove-grand-fairway-mansion',
    title: 'Hills Grove Grand Fairway Mansion',
    community: 'Dubai Hills Estate',
    property_type: 'Villa',
    status: 'Sold',
    price_aed: 65000000,
    bedrooms: 6,
    bathrooms: 8,
    sqft: 14200,
    badge: 'Golf Frontage Palatial',
    image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'],
    description: 'Palatial masterwork with direct front-row frontage on the 18-hole championship golf course.',
    amenities: ['Direct Fairway Frontage', 'Subterranean Car Gallery', 'Private Cinema', 'Wellness Spa'],
    furnishing: 'Custom Italian Interior Architecture',
    parking_bays: 8,
    is_sold: true,
    sold_price_aed: 65000000,
    is_featured: true
  },
  {
    id: 11,
    slug: 'club-villas-modern-golf-estate',
    title: 'Club Villas Modern Golf Estate',
    community: 'Dubai Hills Estate',
    property_type: 'Villa',
    status: 'Sold',
    price_aed: 12800000,
    bedrooms: 4,
    bathrooms: 5,
    sqft: 4600,
    badge: 'Rooftop Terrace',
    image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'],
    description: 'Contemporary 4-bedroom villa with private rooftop lounge overlooking Dubai Hills clubhouse.',
    amenities: ['Rooftop Skyline Lounge', 'Private Pool', 'Clubhouse Access', 'Family Lounge'],
    furnishing: 'Semi-Furnished',
    parking_bays: 2,
    is_sold: true,
    sold_price_aed: 12800000,
    is_featured: false
  },
  {
    id: 12,
    slug: 'park-heights-family-residence',
    title: 'Park Heights Modern Family Haven',
    community: 'Dubai Hills Estate',
    property_type: 'Apartment',
    status: 'Ready to Move',
    price_aed: 4700000,
    bedrooms: 3,
    bathrooms: 3,
    sqft: 1750,
    badge: 'Parkside Living',
    image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'],
    description: 'Park-facing 3-bedroom apartment walking distance to Dubai Hills Mall and King’s College Hospital.',
    amenities: ['Dubai Hills Park View', 'Swimming Pool', 'Fitness Gym', 'Children Play Areas'],
    furnishing: 'Contemporary Finished',
    parking_bays: 2,
    is_sold: false,
    is_featured: false
  },
  {
    id: 13,
    slug: 'canal-promenade-sky-penthouse',
    title: 'Canal Promenade Sky Penthouse',
    community: 'Business Bay',
    property_type: 'Penthouse',
    status: 'Sold',
    price_aed: 18200000,
    bedrooms: 4,
    bathrooms: 5,
    sqft: 5200,
    badge: 'Water Canal View',
    image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'],
    description: 'Duplex penthouse hanging over the Dubai Water Canal with private infinity rooftop jacuzzi.',
    amenities: ['Direct Canal View', 'Private Rooftop Jacuzzi', 'Smart Automation', 'Concierge & Valet'],
    furnishing: 'Designer Furnished',
    parking_bays: 3,
    is_sold: true,
    sold_price_aed: 18200000,
    is_featured: true
  },
  {
    id: 14,
    slug: 'marasi-marine-waterfront-suite',
    title: 'Marasi Marine Waterfront Suite',
    community: 'Business Bay',
    property_type: 'Apartment',
    status: 'Ready to Move',
    price_aed: 5600000,
    bedrooms: 2,
    bathrooms: 3,
    sqft: 1680,
    badge: 'Marina Berth Access',
    image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'],
    description: 'Rare floating villa neighborhood concept in Marasi Business Bay with yacht berths.',
    amenities: ['Canal Boardwalk', 'Infinity Pool', 'Gym & Sauna', 'Water Taxi Station'],
    furnishing: 'Fully Furnished',
    parking_bays: 2,
    is_sold: false,
    is_featured: false
  },
  {
    id: 15,
    slug: 'autumn-park-luxury-modern-villa',
    title: 'Autumn Park Luxury Modern Villa',
    community: 'Jumeirah Village Circle (JVC)',
    property_type: 'Villa',
    status: 'Ready to Move',
    price_aed: 3850000,
    bedrooms: 4,
    bathrooms: 5,
    sqft: 3950,
    badge: 'Private Pool Garden',
    image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    gallery_urls: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'],
    description: 'Freestanding contemporary villa in JVC with private sunken garden, swimming pool, and rooftop pergola.',
    amenities: ['Private Garden & Pool', 'Rooftop Pergola Lounge', 'Maids Quarters', 'Solar Ready'],
    furnishing: 'Unfurnished',
    parking_bays: 2,
    is_sold: false,
    is_featured: false
  }
];

// 40 SAMPLE BUYER LEADS (WITH SCORING, STAGES & STALE TIMESTAMPS)
const rawLeads = [
  { full_name: 'Lord Arthur Cavendish', phone: '+44 7911 123456', email: 'a.cavendish@mayfaircapital.co.uk', country: 'United Kingdom', budget_range: 'AED 35M+', interest_type: 'Ready Home', property_id: 1, stage: 'Offer', is_cash_buyer: true, buying_timeframe: 'Immediately', source_form: 'Property Viewing Form', source_page: 'Sky Villa Palm Horizon', assigned_agent_id: 1, is_read: true, last_activity_at: '2026-09-29T10:00:00Z', message: 'Seeking beachfront villa on Palm Jumeirah for family relocation.' },
  { full_name: 'Elena Rostova', phone: '+41 79 555 1290', email: 'elena.rostova@genevafamily.ch', country: 'Switzerland', budget_range: 'AED 25M - 50M', interest_type: 'Ready Home', property_id: 4, stage: 'Viewing', is_cash_buyer: true, buying_timeframe: '1-3 months', source_form: 'Direct Enquiry Form', source_page: 'Burj Crown Penthouse', assigned_agent_id: 2, is_read: false, last_activity_at: '2026-09-29T14:30:00Z', message: 'Interested in Downtown duplex penthouse with Burj Khalifa views.' },
  { full_name: 'Dr. Faisal Al-Sabah', phone: '+965 9988 7766', email: 'faisal.alsabah@kuwaitinv.kw', country: 'Kuwait', budget_range: 'AED 50M+', interest_type: 'Ready Home', property_id: 10, stage: 'Offer', is_cash_buyer: true, buying_timeframe: 'Immediately', source_form: 'VIP Register Form', source_page: 'Home Page', assigned_agent_id: 1, is_read: true, last_activity_at: '2026-09-28T09:00:00Z', message: 'Looking for a championship golf course mansion in Dubai Hills.' },
  { full_name: 'Henrik Lindqvist', phone: '+46 70 812 3456', email: 'henrik@stockholmcapex.se', country: 'Sweden', budget_range: 'AED 15M - 35M', interest_type: 'Off-Plan Project', project_id: 1, stage: 'Contacted', is_cash_buyer: false, buying_timeframe: '3-6 months', source_form: 'Off-Plan Brochure Download', source_page: 'The Palm Serenade', assigned_agent_id: 2, is_read: true, last_activity_at: '2026-09-24T12:00:00Z', message: 'Inquiring regarding Palm Serenade 70/30 payment milestones.' }, // Stale (5 days ago)
  { full_name: 'Marcus Sterling', phone: '+1 212 555 0199', email: 'msterling@manhattanequity.com', country: 'United States', budget_range: 'AED 25M - 50M', interest_type: 'Ready Home', property_id: 7, stage: 'Won', is_cash_buyer: true, buying_timeframe: 'Immediately', source_form: 'Direct Enquiry Form', source_page: 'Le Rêve Penthouse', assigned_agent_id: 3, is_read: true, last_activity_at: '2026-08-22T10:00:00Z', message: 'Purchased Le Rêve penthouse for corporate executive suite.' },
  { full_name: 'Sheikh Khalid Al-Falasi', phone: '+971 50 111 2233', email: 'khalid.falasi@dubaiholding.ae', country: 'UAE', budget_range: 'AED 50M+', interest_type: 'Ready Home', property_id: 10, stage: 'Won', is_cash_buyer: true, buying_timeframe: 'Immediately', source_form: 'VIP Register Form', source_page: 'Home Page', assigned_agent_id: 1, is_read: true, last_activity_at: '2026-09-14T15:00:00Z', message: 'Completed acquisition of Hills Grove Fairway Mansion.' },
  { full_name: 'Charlotte Dubois', phone: '+33 6 12 34 56 78', email: 'c.dubois@parisluxe.fr', country: 'France', budget_range: 'AED 15M - 35M', interest_type: 'Ready Home', property_id: 2, stage: 'Viewing', is_cash_buyer: true, buying_timeframe: '1-3 months', source_form: 'Property Viewing Form', source_page: 'Royal Atlantis Duplex', assigned_agent_id: 2, is_read: false, last_activity_at: '2026-09-29T11:00:00Z', message: 'Visiting Dubai next week to inspect Royal Atlantis duplex.' },
  { full_name: 'Alexander Von Berg', phone: '+49 171 2345678', email: 'a.berg@frankfurtassets.de', country: 'Germany', budget_range: 'AED 5M - 15M', interest_type: 'Mortgage Advisory', property_id: 5, stage: 'Contacted', is_cash_buyer: false, buying_timeframe: '3-6 months', source_form: 'Mortgage Pre-Approval Form', source_page: 'Mortgage Calculator', assigned_agent_id: 3, is_read: true, last_activity_at: '2026-09-23T08:00:00Z', message: 'Requires expat mortgage assessment for Opera Grand suite.' }, // Stale (6 days ago)
  { full_name: 'Rajesh Singhania', phone: '+91 98200 12345', email: 'rajesh@mumbaicorporate.in', country: 'India', budget_range: 'AED 15M - 35M', interest_type: 'Off-Plan Project', project_id: 2, stage: 'New', is_cash_buyer: true, buying_timeframe: '1-3 months', source_form: 'Off-Plan Brochure Download', source_page: 'Solstice Horizon', assigned_agent_id: 2, is_read: false, last_activity_at: '2026-09-29T16:00:00Z', message: 'Inquiring for 3-bedroom Solstice Downtown pre-launch allocation.' },
  { full_name: 'Guillaume Moreau', phone: '+377 98 98 00 11', email: 'g.moreau@monacoprivate.mc', country: 'Monaco', budget_range: 'AED 35M+', interest_type: 'Ready Home', property_id: 1, stage: 'Viewing', is_cash_buyer: true, buying_timeframe: 'Immediately', source_form: 'Instant Callback Widget', source_page: 'Home Page', assigned_agent_id: 1, is_read: true, last_activity_at: '2026-09-29T13:00:00Z', message: 'Requesting helicopter viewing of Palm Horizon Sky Villa.' },
  { full_name: 'Tariq Al-Mansoor', phone: '+966 50 443 2190', email: 'tariq@riyadhventures.sa', country: 'Saudi Arabia', budget_range: 'AED 25M - 50M', interest_type: 'Ready Home', property_id: 4, stage: 'New', is_cash_buyer: true, buying_timeframe: 'Immediately', source_form: 'Home Hero Search', source_page: 'Home Page', assigned_agent_id: 1, is_read: false, last_activity_at: '2026-09-29T15:20:00Z', message: 'Looking for Downtown family penthouse with immediate handover.' },
  { full_name: 'Maximilian Krause', phone: '+43 664 1234567', email: 'm.krause@viennafund.at', country: 'Austria', budget_range: 'AED 5M - 15M', interest_type: 'Off-Plan Project', project_id: 3, stage: 'Contacted', is_cash_buyer: false, buying_timeframe: '3-6 months', source_form: 'Off-Plan Brochure Download', source_page: 'Aura Marine Bay', assigned_agent_id: 2, is_read: true, last_activity_at: '2026-09-22T11:00:00Z', message: 'Evaluating Aura Marine Bay yields vs. European real estate.' }, // Stale (7 days ago)
  { full_name: 'Chloe Tan Wei Ling', phone: '+65 9123 4567', email: 'chloe.tan@singaporewealth.sg', country: 'Singapore', budget_range: 'AED 5M - 15M', interest_type: 'Ready Home', property_id: 8, stage: 'Viewing', is_cash_buyer: true, buying_timeframe: '1-3 months', source_form: 'Property Viewing Form', source_page: 'Marina Gate Penthouse', assigned_agent_id: 3, is_read: true, last_activity_at: '2026-09-29T09:30:00Z', message: 'Interested in Marina Gate waterfront unit for rental portfolio.' },
  { full_name: 'David O’Connor', phone: '+353 87 123 4567', email: 'doconnor@dublininvest.ie', country: 'Ireland', budget_range: 'AED 5M - 15M', interest_type: 'Ready Home', property_id: 6, stage: 'Contacted', is_cash_buyer: false, buying_timeframe: '3-6 months', source_form: 'Direct Enquiry Form', source_page: 'Boulevard Heights', assigned_agent_id: 3, is_read: true, last_activity_at: '2026-09-21T14:00:00Z', message: 'Seeking 2-bedroom Boulevard Heights ready apartment.' }, // Stale (8 days ago)
  { full_name: 'Sarah Van Der Bilt', phone: '+31 6 12345678', email: 'sarah@amsterdamcapital.nl', country: 'Netherlands', budget_range: 'AED 25M - 50M', interest_type: 'Ready Home', property_id: 2, stage: 'Offer', is_cash_buyer: true, buying_timeframe: 'Immediately', source_form: 'Property Viewing Form', source_page: 'Royal Atlantis Duplex', assigned_agent_id: 2, is_read: true, last_activity_at: '2026-09-28T16:00:00Z', message: 'Offer submitted on Royal Atlantis duplex.' },
  { full_name: 'Mohammed Al-Zahrani', phone: '+966 55 987 6543', email: 'zahrani@jeddahprop.sa', country: 'Saudi Arabia', budget_range: 'AED 15M - 35M', interest_type: 'Off-Plan Project', project_id: 1, stage: 'Contacted', is_cash_buyer: true, buying_timeframe: '1-3 months', source_form: 'Off-Plan Brochure Download', source_page: 'The Palm Serenade', assigned_agent_id: 1, is_read: true, last_activity_at: '2026-09-29T10:15:00Z', message: 'Interested in reserving Palm Serenade Mansion.' },
  { full_name: 'Pietro Bellini', phone: '+39 335 1234567', email: 'pietro@milanofinance.it', country: 'Italy', budget_range: 'AED 15M - 35M', interest_type: 'Ready Home', property_id: 13, stage: 'Viewing', is_cash_buyer: true, buying_timeframe: '1-3 months', source_form: 'Property Viewing Form', source_page: 'Canal Promenade Penthouse', assigned_agent_id: 3, is_read: true, last_activity_at: '2026-09-29T11:45:00Z', message: 'Requesting private tour of Canal Promenade Sky Penthouse.' },
  { full_name: 'Grace Hamilton', phone: '+44 7700 900123', email: 'grace.hamilton@chelseafamily.co.uk', country: 'United Kingdom', budget_range: 'AED 10M - 20M', interest_type: 'Ready Home', property_id: 11, stage: 'Won', is_cash_buyer: true, buying_timeframe: 'Immediately', source_form: 'VIP Register Form', source_page: 'Home Page', assigned_agent_id: 2, is_read: true, last_activity_at: '2026-07-18T10:00:00Z', message: 'Completed acquisition of Club Villas Golf Estate.' },
  { full_name: 'Omar Al-Husseini', phone: '+971 52 345 6789', email: 'omar.h@dubaitrading.ae', country: 'UAE', budget_range: 'AED 5M - 15M', interest_type: 'Valuation', property_id: null, stage: 'New', is_cash_buyer: false, buying_timeframe: '1-3 months', source_form: 'Sell Property Valuation Form', source_page: 'Sell Page', assigned_agent_id: 3, is_read: false, last_activity_at: '2026-09-29T16:10:00Z', message: 'Selling full floor apartment in Downtown Dubai.' },
  { full_name: 'Victoria Spencer', phone: '+1 310 555 0144', email: 'vspencer@beverlyhillscapital.com', country: 'United States', budget_range: 'AED 35M+', interest_type: 'Ready Home', property_id: 1, stage: 'Contacted', is_cash_buyer: true, buying_timeframe: '1-3 months', source_form: 'Instant Callback Widget', source_page: 'Properties Page', assigned_agent_id: 1, is_read: true, last_activity_at: '2026-09-29T12:00:00Z', message: 'Inquiring regarding Palm Horizon beach specs and furniture inventory.' },
  { full_name: 'Karim Benali', phone: '+212 661 123456', email: 'k.benali@casablancafund.ma', country: 'Morocco', budget_range: 'AED 5M - 15M', interest_type: 'Ready Home', property_id: 14, stage: 'Contacted', is_cash_buyer: false, buying_timeframe: '3-6 months', source_form: 'Direct Enquiry Form', source_page: 'Marasi Marine Suite', assigned_agent_id: 3, is_read: true, last_activity_at: '2026-09-25T14:00:00Z', message: 'Evaluating Marasi Marine Waterfront Suite.' }, // Stale (4 days ago)
  { full_name: 'James Thornton', phone: '+44 7890 123456', email: 'jthornton@kensingtonadvisors.co.uk', country: 'United Kingdom', budget_range: 'AED 25M - 50M', interest_type: 'Ready Home', property_id: 4, stage: 'Viewing', is_cash_buyer: true, buying_timeframe: '1-3 months', source_form: 'Property Viewing Form', source_page: 'Burj Crown Penthouse', assigned_agent_id: 2, is_read: true, last_activity_at: '2026-09-29T14:00:00Z', message: 'Viewing booked for Burj Crown Sky Penthouse on Friday.' },
  { full_name: 'Nathalie Dupont', phone: '+32 470 12 34 56', email: 'ndupont@brusselsholding.be', country: 'Belgium', budget_range: 'AED 2M - 5M', interest_type: 'Off-Plan Project', project_id: 4, stage: 'Contacted', is_cash_buyer: false, buying_timeframe: '3-6 months', source_form: 'Off-Plan Brochure Download', source_page: 'Fairway Crest Terraces', assigned_agent_id: 2, is_read: true, last_activity_at: '2026-09-20T10:00:00Z', message: 'Interested in Fairway Crest investor plan.' }, // Stale (9 days ago)
  { full_name: 'Hiroshi Tanaka', phone: '+81 90 1234 5678', email: 'tanaka@tokyowm.jp', country: 'Japan', budget_range: 'AED 35M+', interest_type: 'Ready Home', property_id: 10, stage: 'New', is_cash_buyer: true, buying_timeframe: 'Immediately', source_form: 'Contact Advisory Desk', source_page: 'Contact Page', assigned_agent_id: 1, is_read: false, last_activity_at: '2026-09-29T15:45:00Z', message: 'Inquiring about Hills Grove golf course views.' },
  { full_name: 'Fatima Al-Thani', phone: '+974 5511 2233', email: 'f.althani@dohafamily.qa', country: 'Qatar', budget_range: 'AED 50M+', interest_type: 'Ready Home', property_id: 1, stage: 'Offer', is_cash_buyer: true, buying_timeframe: 'Immediately', source_form: 'VIP Register Form', source_page: 'Home Page', assigned_agent_id: 1, is_read: true, last_activity_at: '2026-09-29T09:00:00Z', message: 'Finalizing terms for Palm Horizon Villa purchase.' },
  { full_name: 'Lucas Ferreira', phone: '+351 912 345 678', email: 'lferreira@lisbonassets.pt', country: 'Portugal', budget_range: 'AED 2M - 5M', interest_type: 'Ready Home', property_id: 9, stage: 'Contacted', is_cash_buyer: false, buying_timeframe: '3-6 months', source_form: 'Direct Enquiry Form', source_page: 'Cayan Tower Suite', assigned_agent_id: 3, is_read: true, last_activity_at: '2026-09-24T16:00:00Z', message: 'Inquiring about Cayan Tower rental history.' }, // Stale (5 days ago)
  { full_name: 'Beatrice Windsor', phone: '+44 7955 889900', email: 'beatrice@windsoradvisory.co.uk', country: 'United Kingdom', budget_range: 'AED 15M - 35M', interest_type: 'Ready Home', property_id: 11, stage: 'Viewing', is_cash_buyer: true, buying_timeframe: '1-3 months', source_form: 'Property Viewing Form', source_page: 'Club Villas Golf Estate', assigned_agent_id: 2, is_read: true, last_activity_at: '2026-09-29T10:30:00Z', message: 'Private tour of Dubai Hills Club Villa.' },
  { full_name: 'Sultan Al-Nuaimi', phone: '+971 50 777 8899', email: 'sultan.n@rakholding.ae', country: 'UAE', budget_range: 'AED 15M - 35M', interest_type: 'Ready Home', property_id: 13, stage: 'Won', is_cash_buyer: true, buying_timeframe: 'Immediately', source_form: 'VIP Register Form', source_page: 'Home Page', assigned_agent_id: 3, is_read: true, last_activity_at: '2026-09-02T12:00:00Z', message: 'Completed purchase of Canal Promenade Penthouse.' },
  { full_name: 'Oliver Wright', phone: '+61 400 123 456', email: 'owright@sydneywealth.com.au', country: 'Australia', budget_range: 'AED 2M - 5M', interest_type: 'Off-Plan Project', project_id: 5, stage: 'New', is_cash_buyer: false, buying_timeframe: '1-3 months', source_form: 'Off-Plan Brochure Download', source_page: 'Canal Edge Suites', assigned_agent_id: 3, is_read: false, last_activity_at: '2026-09-29T16:30:00Z', message: 'Seeking Canal Edge 2-bed suite with canal view.' },
  { full_name: 'Anastasia Romanov', phone: '+41 78 990 1122', email: 'anastasia@zurichdesk.ch', country: 'Switzerland', budget_range: 'AED 35M+', interest_type: 'Ready Home', property_id: 2, stage: 'Contacted', is_cash_buyer: true, buying_timeframe: '1-3 months', source_form: 'Direct Enquiry Form', source_page: 'Royal Atlantis Duplex', assigned_agent_id: 2, is_read: true, last_activity_at: '2026-09-29T13:45:00Z', message: 'Requesting architectural floor plans for Royal Atlantis.' },
  { full_name: 'Farhan Siddiqui', phone: '+971 55 444 3322', email: 'farhan@dubailogistics.ae', country: 'UAE', budget_range: 'AED 2M - 5M', interest_type: 'Ready Home', property_id: 15, stage: 'Contacted', is_cash_buyer: false, buying_timeframe: '1-3 months', source_form: 'Direct Enquiry Form', source_page: 'Autumn Park JVC Villa', assigned_agent_id: 3, is_read: true, last_activity_at: '2026-09-25T11:00:00Z', message: 'Viewing Autumn Park JVC modern villa.' }, // Stale (4 days ago)
  { full_name: 'Isabella Rossi', phone: '+39 340 9876543', email: 'i.rossi@romaprivate.it', country: 'Italy', budget_range: 'AED 5M - 15M', interest_type: 'Ready Home', property_id: 8, stage: 'New', is_cash_buyer: true, buying_timeframe: '1-3 months', source_form: 'Instant Callback Widget', source_page: 'Properties Page', assigned_agent_id: 2, is_read: false, last_activity_at: '2026-09-29T15:00:00Z', message: 'Interested in Marina Gate waterfront lifestyle.' },
  { full_name: 'Youssef El-Masri', phone: '+20 100 123 4567', email: 'ymasri@cairoholding.com', country: 'Egypt', budget_range: 'AED 15M - 35M', interest_type: 'Off-Plan Project', project_id: 2, stage: 'Contacted', is_cash_buyer: true, buying_timeframe: '1-3 months', source_form: 'Off-Plan Brochure Download', source_page: 'Solstice Horizon', assigned_agent_id: 1, is_read: true, last_activity_at: '2026-09-29T11:20:00Z', message: 'Reviewing Solstice Downtown payment plan for 2 units.' },
  { full_name: 'Sebastian Ward', phone: '+44 7400 112233', email: 'sward@oxfordcapital.co.uk', country: 'United Kingdom', budget_range: 'AED 2M - 5M', interest_type: 'Ready Home', property_id: 12, stage: 'Viewing', is_cash_buyer: false, buying_timeframe: '1-3 months', source_form: 'Property Viewing Form', source_page: 'Park Heights Dubai Hills', assigned_agent_id: 3, is_read: true, last_activity_at: '2026-09-29T10:45:00Z', message: 'Inspecting Park Heights Dubai Hills residence.' },
  { full_name: 'Mona Al-Ghamdi', phone: '+966 54 332 1100', email: 'mona.g@khobarrealestate.sa', country: 'Saudi Arabia', budget_range: 'AED 25M - 50M', interest_type: 'Ready Home', property_id: 4, stage: 'Lost', is_cash_buyer: true, buying_timeframe: '3-6 months', source_form: 'Contact Desk', source_page: 'Contact Page', assigned_agent_id: 1, is_read: true, last_activity_at: '2026-09-18T14:00:00Z', message: 'Purchased alternate property in Riyadh.' },
  { full_name: 'Christian Bauer', phone: '+49 160 9988776', email: 'cbauer@munichinv.de', country: 'Germany', budget_range: 'AED 10M - 20M', interest_type: 'Ready Home', property_id: 3, stage: 'Won', is_cash_buyer: true, buying_timeframe: 'Immediately', source_form: 'VIP Register Form', source_page: 'Home Page', assigned_agent_id: 2, is_read: true, last_activity_at: '2026-08-05T12:00:00Z', message: 'Purchased Oceana Palm Waterfront suite.' },
  { full_name: 'Lara Croft-Montgomery', phone: '+44 7888 223344', email: 'lara@montgomerytrust.co.uk', country: 'United Kingdom', budget_range: 'AED 35M+', interest_type: 'Ready Home', property_id: 1, stage: 'New', is_cash_buyer: true, buying_timeframe: 'Immediately', source_form: 'Instant Callback Widget', source_page: 'Home Page', assigned_agent_id: 1, is_read: false, last_activity_at: '2026-09-29T16:25:00Z', message: 'Seeking Palm Jumeirah private compound.' },
  { full_name: 'Hassan Al-Majid', phone: '+973 3911 2233', email: 'hassan@manamacapital.bh', country: 'Bahrain', budget_range: 'AED 5M - 15M', interest_type: 'Ready Home', property_id: 5, stage: 'Contacted', is_cash_buyer: false, buying_timeframe: '3-6 months', source_form: 'Direct Enquiry Form', source_page: 'Opera Grand Suite', assigned_agent_id: 3, is_read: true, last_activity_at: '2026-09-23T15:00:00Z', message: 'Inquiring for Opera Grand high floor unit.' }, // Stale (6 days ago)
  { full_name: 'Sophie Von Klitzing', phone: '+49 172 8899001', email: 'sophie@berlinassets.de', country: 'Germany', budget_range: 'AED 5M - 15M', interest_type: 'Mortgage Advisory', property_id: 14, stage: 'New', is_cash_buyer: false, buying_timeframe: '1-3 months', source_form: 'Mortgage Pre-Approval Form', source_page: 'Mortgage Calculator', assigned_agent_id: 3, is_read: false, last_activity_at: '2026-09-29T16:20:00Z', message: 'UAE Golden Visa and mortgage advisory request.' },
  { full_name: 'Zackary Evans', phone: '+1 415 555 0177', email: 'zevans@siliconvc.com', country: 'United States', budget_range: 'AED 15M - 35M', interest_type: 'Off-Plan Project', project_id: 1, stage: 'Contacted', is_cash_buyer: true, buying_timeframe: '1-3 months', source_form: 'Off-Plan Brochure Download', source_page: 'The Palm Serenade', assigned_agent_id: 1, is_read: true, last_activity_at: '2026-09-29T12:40:00Z', message: 'Registering interest for Palm Serenade pre-launch.' }
];

// Enrich leads with score and rating
const LEADS_DATA = rawLeads.map((lead, idx) => {
  const { score, rating } = calculateLeadScore(lead);
  return {
    id: idx + 1,
    ...lead,
    lead_score: score,
    lead_rating: rating,
    created_at: lead.last_activity_at
  };
});

const VIEWINGS_DATA = [
  { id: 1, lead_id: 1, property_id: 1, staff_id: 1, viewing_date: '2026-10-02', viewing_time: '11:00 AM', status: 'Confirmed', client_feedback: 'VIP client arriving via private chauffeur. Emphasized private beach access.' },
  { id: 2, lead_id: 2, property_id: 4, staff_id: 2, viewing_date: '2026-10-03', viewing_time: '03:30 PM', status: 'Confirmed', client_feedback: 'Twilight viewing scheduled to demonstrate Burj Khalifa light show from terrace.' },
  { id: 3, lead_id: 3, property_id: 10, staff_id: 1, viewing_date: '2026-09-28', viewing_time: '02:00 PM', status: 'Completed', client_feedback: 'Client thoroughly impressed with the golf frontage. Draft contract requested.' },
  { id: 4, lead_id: 7, property_id: 2, staff_id: 2, viewing_date: '2026-10-05', viewing_time: '10:30 AM', status: 'Confirmed', client_feedback: 'Client flying in from Paris. Requires full English and French advisory.' },
  { id: 5, lead_id: 10, property_id: 1, staff_id: 1, viewing_date: '2026-10-06', viewing_time: '04:00 PM', status: 'Confirmed', client_feedback: 'Helicopter transfer to Palm Jumeirah helipad arranged.' },
  { id: 6, lead_id: 13, property_id: 8, staff_id: 3, viewing_date: '2026-10-04', viewing_time: '01:00 PM', status: 'Confirmed', client_feedback: 'Client comparing Marina Gate with Bluewaters Island residences.' },
  { id: 7, lead_id: 17, property_id: 13, staff_id: 3, viewing_date: '2026-10-07', viewing_time: '05:00 PM', status: 'Confirmed', client_feedback: 'Interested in canal sunset vistas from the rooftop jacuzzi.' },
  { id: 8, lead_id: 22, property_id: 4, staff_id: 2, viewing_date: '2026-10-02', viewing_time: '06:00 PM', status: 'Confirmed', client_feedback: 'Evening appointment with private financial advisor present.' },
  { id: 9, lead_id: 27, property_id: 11, staff_id: 2, viewing_date: '2026-10-08', viewing_time: '11:30 AM', status: 'Confirmed', client_feedback: 'Touring Dubai Hills golf clubhouse amenities alongside the villa.' },
  { id: 10, lead_id: 34, property_id: 12, staff_id: 3, viewing_date: '2026-10-09', viewing_time: '02:30 PM', status: 'Confirmed', client_feedback: 'Focus on family park proximity and nearby international schools.' }
];

const SALES_DATA = [
  { id: 1, property_title: 'Hills Grove Grand Fairway Mansion', community: 'Dubai Hills Estate', sale_price_aed: 65000000, buyer_name: 'Sheikh Khalid Al-Falasi', staff_id: 1, sale_date: '2026-09-14', commission_aed: 1300000 },
  { id: 2, property_title: 'Le Rêve Sky Mansion Penthouse', community: 'Dubai Marina', sale_price_aed: 26000000, buyer_name: 'Marcus Sterling', staff_id: 3, sale_date: '2026-08-22', commission_aed: 520000 },
  { id: 3, property_title: 'Canal Promenade Sky Penthouse', community: 'Business Bay', sale_price_aed: 18200000, buyer_name: 'Sultan Al-Nuaimi', staff_id: 3, sale_date: '2026-09-02', commission_aed: 364000 },
  { id: 4, property_title: 'Club Villas Modern Golf Estate', community: 'Dubai Hills Estate', sale_price_aed: 12800000, buyer_name: 'Grace Hamilton', staff_id: 2, sale_date: '2026-07-18', commission_aed: 256000 },
  { id: 5, property_title: 'Oceana Palm Waterfront Penthouse', community: 'Palm Jumeirah', sale_price_aed: 14200000, buyer_name: 'Christian Bauer', staff_id: 2, sale_date: '2026-08-05', commission_aed: 284000 }
];

module.exports = {
  calculateLeadScore,
  DEVELOPERS_DATA,
  STAFF_DATA,
  OFFPLAN_DATA,
  PROPERTIES_DATA,
  LEADS_DATA,
  VIEWINGS_DATA,
  SALES_DATA
};
