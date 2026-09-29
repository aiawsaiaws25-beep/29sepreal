/**
 * JAY REAL ESTATE — COMPLETE LUXURY SPA & ADVANCED CRM SUITE
 */

// ================= GLOBAL STATE & AUTH =================
let currentCurrency = 'AED';
const CURRENCY_RATES = {
  AED: { symbol: 'AED', rate: 1.0, prefix: 'AED ' },
  USD: { symbol: '$', rate: 0.2723, prefix: '$' },
  EUR: { symbol: '€', rate: 0.2540, prefix: '€' },
  GBP: { symbol: '£', rate: 0.2185, prefix: '£' }
};

let currentUser = JSON.parse(sessionStorage.getItem('jayAdminUser') || 'null');
let adminActiveTab = 'dashboard';
let cachedProperties = [];
let cachedOffPlan = [];
let cachedLeads = [];
let unreadBellCount = 0;
let bellRefreshTimer = null;

// ================= HELPERS: CURRENCY & FORMATTING =================
function formatMoney(amountAED) {
  if (!amountAED) return 'Price on Application';
  const conf = CURRENCY_RATES[currentCurrency] || CURRENCY_RATES['AED'];
  const converted = amountAED * conf.rate;
  if (converted >= 1000000) {
    const inMillions = (converted / 1000000).toFixed(1).replace(/\.0$/, '');
    return `${conf.prefix}${inMillions}M`;
  }
  return `${conf.prefix}${Math.round(converted).toLocaleString('en-US')}`;
}

function formatExactCurrency(amountAED) {
  const conf = CURRENCY_RATES[currentCurrency] || CURRENCY_RATES['AED'];
  const converted = amountAED * conf.rate;
  return `${conf.prefix}${Math.round(converted).toLocaleString('en-US')}`;
}

function generateRefCode() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `JAY-${new Date().getFullYear()}-${randomNum}`;
}

// ================= DATA FETCHERS =================
async function fetchProperties(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`/api/properties${query ? '?' + query : ''}`);
    const data = await res.json();
    if (data.success) {
      cachedProperties = data.data;
      return data.data;
    }
  } catch (err) {
    console.warn('API call error:', err);
  }
  return cachedProperties;
}

async function fetchPropertyById(id) {
  try {
    const res = await fetch(`/api/properties/${id}`);
    const data = await res.json();
    if (data.success) return data.data;
  } catch (err) {
    console.warn('API error:', err);
  }
  return cachedProperties.find(p => p.id == id || p.slug === id);
}

async function fetchOffPlan(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`/api/off-plan${query ? '?' + query : ''}`);
    const data = await res.json();
    if (data.success) {
      cachedOffPlan = data.data;
      return data.data;
    }
  } catch (err) {
    console.warn('API error:', err);
  }
  return cachedOffPlan;
}

async function fetchOffPlanById(id) {
  try {
    const res = await fetch(`/api/off-plan/${id}`);
    const data = await res.json();
    if (data.success) return data.data;
  } catch (err) {
    console.warn('API error:', err);
  }
  return cachedOffPlan.find(o => o.id == id || o.slug === id);
}

// ================= LUXURY LOADING & ERROR SCREENS =================
function renderLoadingScreen(container, message = "Curating Dubai's Finest Residences...") {
  container.innerHTML = `
    <div class="luxury-loading-state">
      <div class="luxury-spinner-emblem">
        <div class="spinner-outer-ring"></div>
        <div class="spinner-inner-diamond"></div>
      </div>
      <div class="luxury-loading-title">Jay Real Estate</div>
      <div class="luxury-loading-sub">${message}</div>
    </div>
  `;
}

function renderNotFoundPage(container) {
  document.title = '404 Residence Not Found | Jay Real Estate';
  container.innerHTML = `
    <section class="luxury-error-wrapper">
      <div class="luxury-error-card">
        <div class="luxury-error-code">404</div>
        <h1 class="luxury-error-title">Residence Not Found</h1>
        <p class="luxury-error-desc">
          The exclusive listing or architectural portfolio you requested is no longer active on the open market or has been transferred to private off-market placement.
        </p>
        <div class="luxury-error-actions">
          <a href="#/properties" onclick="navigateTo('/properties'); return false;" class="btn btn-gold">
            Explore Available Portfolio
          </a>
          <a href="#/off-plan" onclick="navigateTo('/off-plan'); return false;" class="btn btn-outline-dark">
            Browse Off-Plan Landmarks
          </a>
          <button onclick="openRegisterModal('404 Private Search Request')" class="btn btn-outline-dark">
            Request Off-Market Search
          </button>
        </div>
      </div>
    </section>
  `;
  if (window.lucide) lucide.createIcons();
}

function renderErrorPage(container, errorMsg = 'Unable to synchronize portfolio data at this moment.') {
  document.title = 'Advisory Error | Jay Real Estate';
  container.innerHTML = `
    <section class="luxury-error-wrapper">
      <div class="luxury-error-card">
        <div class="luxury-error-code" style="color: #ef4444; font-size: 2.8rem;">SERVICE NOTICE</div>
        <h1 class="luxury-error-title">Advisory Desk Connecting</h1>
        <p class="luxury-error-desc">
          ${errorMsg} Please check your connection or contact our private client concierge directly.
        </p>
        <div class="luxury-error-actions">
          <button onclick="router()" class="btn btn-gold">
            Retry Connection
          </button>
          <a href="#/" onclick="navigateTo('/'); return false;" class="btn btn-outline-dark">
            Return Home
          </a>
          <button onclick="openWhatsAppChat()" class="btn btn-outline-dark" style="color: #25D366; border-color: #25D366;">
            WhatsApp Concierge
          </button>
        </div>
      </div>
    </section>
  `;
  if (window.lucide) lucide.createIcons();
}

// ================= SPA ROUTER =================
function navigateTo(path) {
  window.location.hash = '#' + path;
}

function router() {
  const hash = window.location.hash.slice(1) || '/';
  const container = document.getElementById('appViewContainer');
  const header = document.getElementById('siteHeader');
  const metaRobots = document.getElementById('metaRobots');

  // Update active nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    const route = link.getAttribute('data-route');
    if ((route === '/' && (hash === '/' || hash === '')) || (route !== '/' && hash.startsWith(route))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Solid header on inner pages & admin
  if (hash === '/' || hash === '') {
    header.classList.remove('solid-header');
    if (window.scrollY < 50) header.classList.remove('scrolled');
  } else {
    header.classList.add('solid-header');
  }

  window.scrollTo({ top: 0, behavior: 'instant' });

  // Privacy & SEO protection for Admin Area
  if (hash === '/admin' || hash === '/admin-login' || hash.startsWith('/admin/')) {
    if (metaRobots) metaRobots.setAttribute('content', 'noindex, nofollow, noarchive');
    document.title = 'Jay Real Estate | Private Advisory CRM Vault';
    renderAdminArea(container);
    return;
  } else {
    if (metaRobots) metaRobots.setAttribute('content', 'index, follow');
  }

  if (hash === '/' || hash === '') {
    document.title = 'Jay Real Estate | Live Where Luxury Meets the Skyline';
    renderHomePage(container);
  } else if (hash === '/properties') {
    document.title = 'Luxury Properties for Sale in Dubai | Jay Real Estate';
    renderPropertiesPage(container);
  } else if (hash.startsWith('/property/')) {
    const slug = hash.replace('/property/', '');
    renderSinglePropertyPage(container, slug);
  } else if (hash === '/off-plan') {
    document.title = 'Off-Plan Projects in Dubai | Jay Real Estate';
    renderOffPlanPage(container);
  } else if (hash.startsWith('/off-plan/')) {
    const slug = hash.replace('/off-plan/', '');
    renderSingleOffPlanPage(container, slug);
  } else if (hash === '/calculator') {
    document.title = 'Dubai Luxury Mortgage Calculator | Jay Real Estate';
    renderCalculatorPage(container);
  } else if (hash === '/sell') {
    document.title = 'Sell Your Luxury Property in Dubai | Jay Real Estate';
    renderSellPage(container);
  } else if (hash === '/about') {
    document.title = 'About Jay Real Estate | Dubai Private Advisory';
    renderAboutPage(container);
  } else if (hash === '/contact') {
    document.title = 'Contact Jay Real Estate | Private Advisory Desk';
    renderContactPage(container);
  } else {
    renderNotFoundPage(container);
  }

  if (window.lucide) {
    lucide.createIcons();
  }
}

// ================= PAGE 1: HOME =================
async function renderHomePage(container) {
  const [properties, offplans] = await Promise.all([
    fetchProperties({ featured: true }),
    fetchOffPlan({ featured: true })
  ]);

  container.innerHTML = `
    <!-- HERO SECTION -->
    <section class="hero-section" id="hero">
      <div class="hero-bg-overlay"></div>
      <div class="hero-content">
        <div class="hero-tagline fade-in-element">
          <span class="gold-diamond">◆</span> DUBAI'S PREMIER RESIDENTIAL PORTFOLIO <span class="gold-diamond">◆</span>
        </div>
        <h1 class="hero-headline fade-in-element">Live Where Luxury Meets the Skyline</h1>
        <p class="hero-subtext fade-in-element">
          Curating extraordinary ready residences and architectural off-plan masterpieces across Dubai's most coveted waterfronts, fairways, and cityscapes.
        </p>

        <div class="hero-buttons fade-in-element">
          <a href="#/properties" onclick="navigateTo('/properties'); return false;" class="btn btn-gold hero-btn">Explore Properties</a>
          <button class="btn btn-outline-white hero-btn" onclick="openRegisterModal('Hero Register Interest')">Register Interest</button>
        </div>
      </div>

      <!-- Quick Search Bar -->
      <div class="hero-search-container fade-in-element">
        <div class="search-bar-card">
          <div class="search-group">
            <label for="homeSearchType"><i data-lucide="home"></i> Property Type</label>
            <select id="homeSearchType" class="search-input">
              <option value="all">All Types</option>
              <option value="Villa">Luxury Villa</option>
              <option value="Penthouse">Sky Penthouse</option>
              <option value="Apartment">Waterfront Apartment</option>
            </select>
          </div>

          <div class="search-group">
            <label for="homeSearchCommunity"><i data-lucide="map-pin"></i> Prime Community</label>
            <select id="homeSearchCommunity" class="search-input">
              <option value="all">All Prime Enclaves</option>
              <option value="Palm Jumeirah">Palm Jumeirah</option>
              <option value="Downtown Dubai">Downtown Dubai</option>
              <option value="Dubai Marina">Dubai Marina</option>
              <option value="Dubai Hills Estate">Dubai Hills Estate</option>
              <option value="Business Bay">Business Bay</option>
              <option value="Jumeirah Village Circle (JVC)">JVC</option>
            </select>
          </div>

          <div class="search-group">
            <label for="homeSearchBeds"><i data-lucide="bed"></i> Bedrooms</label>
            <select id="homeSearchBeds" class="search-input">
              <option value="all">Any Beds</option>
              <option value="2">2+ Bedrooms</option>
              <option value="3">3+ Bedrooms</option>
              <option value="4">4+ Bedrooms</option>
              <option value="5">5+ Beds / Mansions</option>
            </select>
          </div>

          <div class="search-group">
            <label for="homeSearchPrice"><i data-lucide="coins"></i> Price Range</label>
            <select id="homeSearchPrice" class="search-input">
              <option value="all">Any Price</option>
              <option value="under10">Under 10M AED</option>
              <option value="10to25">10M - 25M AED</option>
              <option value="25to50">25M - 50M AED</option>
              <option value="above50">50M+ AED (Ultra-Luxe)</option>
            </select>
          </div>

          <button class="btn btn-gold search-btn" onclick="executeHomeSearch()">
            <i data-lucide="search"></i> <span>Search</span>
          </button>
        </div>
      </div>
    </section>

    <!-- STATS ACCENT BAR -->
    <section class="stats-section">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">AED 18.4B+</div>
            <div class="stat-label">Prime Volume Transacted</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-number">100%</div>
            <div class="stat-label">Discreet Private Portfolios</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-number">0%</div>
            <div class="stat-label">Property & Capital Gains Tax</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-number">10-Year</div>
            <div class="stat-label">UAE Golden Visa Guaranteed</div>
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURED READY PROPERTIES -->
    <section class="section">
      <div class="container">
        <div class="section-header-centered">
          <span class="section-subtitle">THE CURATED COLLECTION</span>
          <h2 class="section-title">Featured Ready Residences</h2>
          <div class="gold-line-decor"></div>
          <p class="section-description">
            Hand-picked ready-to-move-in mansions, duplex penthouses, and waterfront estates across Dubai's most prestigious communities.
          </p>
        </div>

        <div class="properties-grid">
          ${properties.slice(0, 6).map(p => renderPropertyCardHTML(p)).join('')}
        </div>

        <div class="text-center mt-50">
          <button class="btn btn-outline-dark" onclick="navigateTo('/properties')">
            Explore All 15 Ready Properties <i data-lucide="arrow-right"></i>
          </button>
        </div>
      </div>
    </section>

    <!-- WHY INVEST IN DUBAI -->
    <section class="section" style="background: var(--color-white); border-top: 1px solid var(--color-border-light); border-bottom: 1px solid var(--color-border-light);">
      <div class="container">
        <div class="section-header-centered">
          <span class="section-subtitle">GLOBAL WEALTH CAPITAL</span>
          <h2 class="section-title">Why Invest in Dubai Real Estate?</h2>
          <div class="gold-line-decor"></div>
          <p class="section-description">
            Dubai stands unrivaled as the world's most dynamic wealth haven, offering unmatched investor yields, political stability, and high quality of life.
          </p>
        </div>

        <div class="why-invest-grid">
          <div class="why-invest-card">
            <div class="why-icon"><i data-lucide="shield-check"></i></div>
            <h3 class="why-title">0% Tax-Free Haven</h3>
            <p class="why-desc">Zero property tax, zero capital gains tax, and zero personal income tax on real estate returns and rental revenue.</p>
          </div>

          <div class="why-invest-card">
            <div class="why-icon"><i data-lucide="trending-up"></i></div>
            <h3 class="why-title">Exceptional 7% – 9% Rental ROI</h3>
            <p class="why-desc">Dubai consistently outperforms London, New York, and Hong Kong in both rental yields and sustained capital appreciation.</p>
          </div>

          <div class="why-invest-card">
            <div class="why-icon"><i data-lucide="award"></i></div>
            <h3 class="why-title">10-Year UAE Golden Visa</h3>
            <p class="why-desc">Property investments of AED 2,000,000+ grant 10-year renewable residency for you, your spouse, children, and domestic staff.</p>
          </div>

          <div class="why-invest-card">
            <div class="why-icon"><i data-lucide="globe"></i></div>
            <h3 class="why-title">100% Foreign Ownership</h3>
            <p class="why-desc">Complete freehold ownership across Dubai’s prime designated areas with title deeds registered directly under Dubai Land Department.</p>
          </div>

          <div class="why-invest-card">
            <div class="why-icon"><i data-lucide="lock"></i></div>
            <h3 class="why-title">World's Safest Metropolis</h3>
            <p class="why-desc">Ranked among the top safest global cities with world-class healthcare, international private schools, and luxury infrastructure.</p>
          </div>

          <div class="why-invest-card">
            <div class="why-icon"><i data-lucide="compass"></i></div>
            <h3 class="why-title">Pegged Currency & Stability</h3>
            <p class="why-desc">The UAE Dirham (AED) is pegged firmly to the US Dollar (USD 3.6725), protecting international investors from currency volatility.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURED OFF-PLAN DEVELOPMENTS -->
    <section class="section">
      <div class="container">
        <div class="section-header-split">
          <div>
            <span class="section-subtitle">ARCHITECTURAL HORIZONS</span>
            <h2 class="section-title">Featured Dubai Off-Plan Projects</h2>
            <div class="gold-line-decor left-align"></div>
          </div>
          <div class="header-split-text">
            <p>
              Pre-launch allocations, flexible 60/40 and 70/30 developer payment plans, and superior capital growth in Dubai’s next landmark towers.
            </p>
          </div>
        </div>

        <div class="offplan-grid">
          ${offplans.slice(0, 4).map(o => renderOffPlanCardHTML(o)).join('')}
        </div>

        <div class="text-center mt-50">
          <button class="btn btn-outline-dark" onclick="navigateTo('/off-plan')">
            View All 6 Off-Plan Projects <i data-lucide="arrow-right"></i>
          </button>
        </div>
      </div>
    </section>

    <!-- POPULAR COMMUNITIES GUIDE -->
    <section class="section" style="background: var(--color-alabaster);">
      <div class="container">
        <div class="section-header-centered">
          <span class="section-subtitle">PRIME DESTINATIONS</span>
          <h2 class="section-title">Popular Dubai Communities</h2>
          <div class="gold-line-decor"></div>
          <p class="section-description">
            Explore Dubai’s six most coveted luxury residential enclaves.
          </p>
        </div>

        <div class="locations-grid">
          ${renderCommunityCard('Palm Jumeirah', 'Waterfront Luxury', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80', 'Private beaches & signature frond mansions')}
          ${renderCommunityCard('Downtown Dubai', 'Centre of Now', 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80', 'Burj Khalifa & Dubai Opera skyline views')}
          ${renderCommunityCard('Dubai Marina', 'Yacht Living', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80', 'Waterfront promenades and luxury towers')}
          ${renderCommunityCard('Dubai Hills Estate', 'Championship Golf', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', '18-hole golf greens and family mansions')}
          ${renderCommunityCard('Business Bay', 'Canal Promenade', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80', 'Waterfront penthouses moments from DIFC')}
          ${renderCommunityCard('Jumeirah Village Circle (JVC)', 'High-Yield Urban', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80', 'Modern boutique villas and strong capital growth')}
        </div>
      </div>
    </section>
  `;
}

function renderCommunityCard(name, tag, image, desc) {
  return `
    <div class="location-card" onclick="filterPropertiesByParam({ community: '${name}' })">
      <div class="location-img-wrapper">
        <img src="${image}" alt="${name}" loading="lazy">
        <div class="location-card-overlay"></div>
      </div>
      <div class="location-info">
        <span class="location-tag">${tag}</span>
        <h3 class="location-name">${name}</h3>
        <p class="location-meta">${desc}</p>
        <span class="location-explore">Explore Residences <i data-lucide="arrow-right"></i></span>
      </div>
    </div>
  `;
}

function executeHomeSearch() {
  const type = document.getElementById('homeSearchType')?.value || 'all';
  const community = document.getElementById('homeSearchCommunity')?.value || 'all';
  const beds = document.getElementById('homeSearchBeds')?.value || 'all';
  const price = document.getElementById('homeSearchPrice')?.value || 'all';

  // Also capture as lead search preference in CRM
  submitLeadFromForm({
    full_name: 'Website Visitor',
    phone: '+971 50 000 0000',
    interest_type: `Home Search (${community} - ${type})`,
    budget_range: price,
    source_form: 'Home Quick Search Bar',
    source_page: 'Home Page'
  }, false);

  sessionStorage.setItem('propertyFilters', JSON.stringify({ type, community, beds, price }));
  navigateTo('/properties');
}

// ================= PAGE 2: PROPERTIES DIRECTORY & SINGLE PROPERTY =================
async function renderPropertiesPage(container) {
  const properties = await fetchProperties();
  const savedFilters = JSON.parse(sessionStorage.getItem('propertyFilters') || '{}');

  container.innerHTML = `
    <div class="inner-page-header">
      <div class="container">
        <span class="section-subtitle">PRIME RESIDENTIAL DIRECTORY</span>
        <h1 class="inner-page-title">Ready Residences in Dubai</h1>
        <p class="inner-page-sub">Explore all 15 ready luxury mansions, penthouses, and waterfront suites across Dubai’s top 6 enclaves.</p>
      </div>
    </div>

    <section class="section">
      <div class="container">
        <div class="properties-filter-bar">
          <div class="search-group">
            <label for="filterCommunity"><i data-lucide="map-pin"></i> Community</label>
            <select id="filterCommunity" class="search-input" onchange="applyPropertyFilters()">
              <option value="all">All Communities</option>
              <option value="Palm Jumeirah" ${savedFilters.community === 'Palm Jumeirah' ? 'selected' : ''}>Palm Jumeirah</option>
              <option value="Downtown Dubai" ${savedFilters.community === 'Downtown Dubai' ? 'selected' : ''}>Downtown Dubai</option>
              <option value="Dubai Marina" ${savedFilters.community === 'Dubai Marina' ? 'selected' : ''}>Dubai Marina</option>
              <option value="Dubai Hills Estate" ${savedFilters.community === 'Dubai Hills Estate' ? 'selected' : ''}>Dubai Hills Estate</option>
              <option value="Business Bay" ${savedFilters.community === 'Business Bay' ? 'selected' : ''}>Business Bay</option>
              <option value="Jumeirah Village Circle (JVC)" ${savedFilters.community === 'Jumeirah Village Circle (JVC)' ? 'selected' : ''}>JVC</option>
            </select>
          </div>

          <div class="search-group">
            <label for="filterType"><i data-lucide="home"></i> Property Type</label>
            <select id="filterType" class="search-input" onchange="applyPropertyFilters()">
              <option value="all">All Types</option>
              <option value="Penthouse" ${savedFilters.type === 'Penthouse' ? 'selected' : ''}>Sky Penthouse</option>
              <option value="Villa" ${savedFilters.type === 'Villa' ? 'selected' : ''}>Luxury Villa</option>
              <option value="Apartment" ${savedFilters.type === 'Apartment' ? 'selected' : ''}>Apartment</option>
            </select>
          </div>

          <div class="search-group">
            <label for="filterBeds"><i data-lucide="bed"></i> Bedrooms</label>
            <select id="filterBeds" class="search-input" onchange="applyPropertyFilters()">
              <option value="all">Any Bedrooms</option>
              <option value="2" ${savedFilters.beds === '2' ? 'selected' : ''}>2+ Bedrooms</option>
              <option value="3" ${savedFilters.beds === '3' ? 'selected' : ''}>3+ Bedrooms</option>
              <option value="4" ${savedFilters.beds === '4' ? 'selected' : ''}>4+ Bedrooms</option>
              <option value="5" ${savedFilters.beds === '5' ? 'selected' : ''}>5+ Bedrooms</option>
            </select>
          </div>

          <div class="search-group">
            <label for="filterPrice"><i data-lucide="coins"></i> Price Range</label>
            <select id="filterPrice" class="search-input" onchange="applyPropertyFilters()">
              <option value="all">Any Budget</option>
              <option value="under10" ${savedFilters.price === 'under10' ? 'selected' : ''}>Under 10M AED</option>
              <option value="10to25" ${savedFilters.price === '10to25' ? 'selected' : ''}>10M - 25M AED</option>
              <option value="25to50" ${savedFilters.price === '25to50' ? 'selected' : ''}>25M - 50M AED</option>
              <option value="above50" ${savedFilters.price === 'above50' ? 'selected' : ''}>50M+ AED (Palatial)</option>
            </select>
          </div>

          <div class="search-group">
            <label for="filterSort"><i data-lucide="arrow-up-down"></i> Sort By</label>
            <select id="filterSort" class="search-input" onchange="applyPropertyFilters()">
              <option value="price-desc">Price: High to Low</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="sqft-desc">Size: Largest First</option>
            </select>
          </div>

          <button class="btn btn-outline-dark" onclick="resetPropertyFilters()">Reset</button>
        </div>

        <div class="properties-grid" id="pagePropertiesGrid">
          ${properties.map(p => renderPropertyCardHTML(p)).join('')}
        </div>
      </div>
    </section>
  `;

  sessionStorage.removeItem('propertyFilters');
  applyPropertyFilters();
}

function renderPropertyCardHTML(prop) {
  const badgeClass = prop.is_sold ? 'badge-sold' : (prop.badge ? 'badge-gold' : 'badge-ready');
  const badgeText = prop.is_sold ? 'Sold' : (prop.badge || prop.status);

  return `
    <article class="property-card" data-id="${prop.id}">
      <div class="prop-img-wrapper" onclick="navigateTo('/property/${prop.slug || prop.id}')">
        <img src="${prop.image_url}" alt="${prop.title}" loading="lazy">
        <div class="prop-badges">
          <span class="prop-badge ${badgeClass}">${badgeText}</span>
        </div>
      </div>
      <div class="prop-details-box">
        <span class="prop-location-tag">
          <i data-lucide="map-pin" style="width:13px; height:13px;"></i> ${prop.community}
        </span>
        <h3 class="prop-title" onclick="navigateTo('/property/${prop.slug || prop.id}')">${prop.title}</h3>
        <div class="prop-price-row">
          <span class="prop-price">${prop.is_sold ? 'SOLD' : formatMoney(prop.price_aed)}</span>
        </div>
        <div class="prop-specs">
          <div class="prop-spec-item" title="Bedrooms">
            <i data-lucide="bed"></i> <span>${prop.bedrooms} Beds</span>
          </div>
          <div class="prop-spec-item" title="Bathrooms">
            <i data-lucide="bath"></i> <span>${prop.bathrooms} Baths</span>
          </div>
          <div class="prop-spec-item" title="Built-up Area">
            <i data-lucide="maximize-2"></i> <span>${prop.sqft.toLocaleString()} Sq Ft</span>
          </div>
        </div>
      </div>
    </article>
  `;
}

function filterPropertiesByParam(params) {
  sessionStorage.setItem('propertyFilters', JSON.stringify(params));
  navigateTo('/properties');
}

function applyPropertyFilters() {
  const community = document.getElementById('filterCommunity')?.value || 'all';
  const type = document.getElementById('filterType')?.value || 'all';
  const beds = document.getElementById('filterBeds')?.value || 'all';
  const price = document.getElementById('filterPrice')?.value || 'all';
  const sort = document.getElementById('filterSort')?.value || 'price-desc';

  let filtered = [...cachedProperties];

  if (community !== 'all') filtered = filtered.filter(p => p.community.toLowerCase().includes(community.toLowerCase()));
  if (type !== 'all') filtered = filtered.filter(p => p.property_type.toLowerCase() === type.toLowerCase());
  if (beds !== 'all') filtered = filtered.filter(p => p.bedrooms >= parseInt(beds, 10));
  if (price === 'under10') filtered = filtered.filter(p => p.price_aed < 10000000);
  if (price === '10to25') filtered = filtered.filter(p => p.price_aed >= 10000000 && p.price_aed <= 25000000);
  if (price === '25to50') filtered = filtered.filter(p => p.price_aed > 25000000 && p.price_aed <= 50000000);
  if (price === 'above50') filtered = filtered.filter(p => p.price_aed > 50000000);

  if (sort === 'price-desc') filtered.sort((a, b) => b.price_aed - a.price_aed);
  if (sort === 'price-asc') filtered.sort((a, b) => a.price_aed - b.price_aed);
  if (sort === 'sqft-desc') filtered.sort((a, b) => b.sqft - a.sqft);

  const container = document.getElementById('pagePropertiesGrid');
  if (container) {
    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
          <h3 style="font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 12px; color: var(--color-charcoal);">No ready residences match your exact filter</h3>
          <p style="color: var(--color-text-muted); margin-bottom: 24px;">Our private off-market book contains additional unlisted properties.</p>
          <button class="btn btn-gold" onclick="openRegisterModal('Unlisted Property Inquiry')">Request Unlisted Portfolio</button>
        </div>
      `;
    } else {
      container.innerHTML = filtered.map(p => renderPropertyCardHTML(p)).join('');
    }
    if (window.lucide) lucide.createIcons();
  }
}

function resetPropertyFilters() {
  document.getElementById('filterCommunity').value = 'all';
  document.getElementById('filterType').value = 'all';
  document.getElementById('filterBeds').value = 'all';
  document.getElementById('filterPrice').value = 'all';
  document.getElementById('filterSort').value = 'price-desc';
  applyPropertyFilters();
}

// Single Property Page
async function renderSinglePropertyPage(container, slugOrId) {
  const prop = await fetchPropertyById(slugOrId);
  if (!prop) {
    container.innerHTML = `<div class="container section text-center"><h2>Residence Not Found</h2><button class="btn btn-gold mt-20" onclick="navigateTo('/properties')">Back to Properties</button></div>`;
    return;
  }

  const gallery = Array.isArray(prop.gallery_urls) ? prop.gallery_urls : (typeof prop.gallery_urls === 'string' ? JSON.parse(prop.gallery_urls) : [prop.image_url]);
  const amenities = Array.isArray(prop.amenities) ? prop.amenities : (typeof prop.amenities === 'string' ? JSON.parse(prop.amenities) : ['Sea Views', 'Concierge']);

  container.innerHTML = `
    <div class="inner-page-header">
      <div class="container">
        <span class="section-subtitle">${prop.community}, DUBAI</span>
        <h1 class="inner-page-title">${prop.title}</h1>
        <p class="inner-page-sub">${prop.badge || 'Ultra-Luxury'} • ${prop.bedrooms} Bedrooms • ${prop.sqft.toLocaleString()} Sq Ft</p>
      </div>
    </div>

    <section class="section">
      <div class="container">
        <div class="prop-detail-layout">
          <div>
            <div class="prop-gallery-main">
              <img src="${gallery[0] || prop.image_url}" alt="${prop.title}" id="mainActiveImage">
            </div>

            <div class="prop-thumbs-row">
              ${gallery.map((img, i) => `
                <div class="prop-thumb-item ${i === 0 ? 'active' : ''}" onclick="switchActiveGalleryImage('${img}', this)">
                  <img src="${img}" alt="Thumbnail ${i + 1}">
                </div>
              `).join('')}
            </div>

            <div class="prop-modal-meta-row mt-20">
              <div>
                <span class="prop-location-tag"><i data-lucide="map-pin" style="width:14px;height:14px;"></i> ${prop.community}, Dubai</span>
                <h2 style="font-family: var(--font-heading); font-size: 2.2rem; margin: 4px 0;">Property Overview</h2>
              </div>
              <div class="prop-modal-price">${prop.is_sold ? 'SOLD' : formatExactCurrency(prop.price_aed)}</div>
            </div>

            <div class="prop-modal-specs-bar">
              <div class="prop-modal-spec"><i data-lucide="bed"></i> <span>${prop.bedrooms} Bedrooms</span></div>
              <div class="prop-modal-spec"><i data-lucide="bath"></i> <span>${prop.bathrooms} Bathrooms</span></div>
              <div class="prop-modal-spec"><i data-lucide="maximize-2"></i> <span>${prop.sqft.toLocaleString()} Sq Ft</span></div>
              <div class="prop-modal-spec"><i data-lucide="car"></i> <span>${prop.parking_bays || 2} Parking</span></div>
            </div>

            <div style="margin: 32px 0;">
              <h3 style="font-family: var(--font-heading); font-size: 1.6rem; margin-bottom: 12px;">Architectural Highlights</h3>
              <p style="font-size: 1rem; color: var(--color-text-body); line-height: 1.8;">
                ${prop.description}
              </p>
            </div>

            <div style="margin: 32px 0;">
              <h3 style="font-family: var(--font-heading); font-size: 1.6rem; margin-bottom: 16px;">Key Amenities & Features</h3>
              <div class="prop-amenities-tags">
                ${amenities.map(a => `<span class="amenity-tag">${a}</span>`).join('')}
              </div>
            </div>

            <div style="display: flex; gap: 14px; margin-top: 36px;">
              <button class="btn btn-outline-dark" onclick="populateCalculatorWithPrice(${prop.price_aed}); navigateTo('/calculator');">
                <i data-lucide="calculator"></i> Calculate Mortgage For This Home
              </button>
            </div>
          </div>

          <!-- Right Column: Sticky Booking & Enquiry Form -->
          <div>
            <div class="prop-sticky-form-card">
              <div class="prop-form-tabs">
                <button class="prop-form-tab active" id="tabViewingBtn" onclick="togglePropDetailForm('viewing')">Book Viewing</button>
                <button class="prop-form-tab" id="tabEnquiryBtn" onclick="togglePropDetailForm('enquiry')">Direct Enquiry</button>
              </div>

              <!-- Book Viewing Form -->
              <form id="propViewingInlineForm" onsubmit="handleInlineViewingSubmit(event, ${prop.id}, '${prop.title.replace(/'/g, "\\'")}')">
                <input type="text" name="honeypot" class="form-honeypot" tabindex="-1">
                
                <div class="form-group">
                  <label for="ivFullName">Full Name *</label>
                  <input type="text" id="ivFullName" class="form-input" placeholder="e.g. Lady Evelyn Vance" required>
                </div>

                <div class="form-group">
                  <label for="ivPhone">Phone / WhatsApp *</label>
                  <input type="tel" id="ivPhone" class="form-input" placeholder="+971 50 123 4567" required>
                </div>

                <div class="form-group">
                  <label for="ivEmail">Email</label>
                  <input type="email" id="ivEmail" class="form-input" placeholder="evelyn@domain.com">
                </div>

                <div class="form-row-2">
                  <div class="form-group">
                    <label for="ivCash">Buyer Status</label>
                    <select id="ivCash" class="form-input">
                      <option value="true">Cash Ready</option>
                      <option value="false">Financed</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="ivTimeframe">Timeframe</label>
                    <select id="ivTimeframe" class="form-input">
                      <option value="Immediately">Immediate</option>
                      <option value="1-3 months" selected>1-3 Months</option>
                    </select>
                  </div>
                </div>

                <div class="form-row-2">
                  <div class="form-group">
                    <label for="ivDate">Date *</label>
                    <input type="date" id="ivDate" class="form-input" required>
                  </div>
                  <div class="form-group">
                    <label for="ivTime">Time</label>
                    <select id="ivTime" class="form-input">
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="02:30 PM">02:30 PM</option>
                      <option value="05:00 PM" selected>05:00 PM (Sunset)</option>
                    </select>
                  </div>
                </div>

                <button type="submit" class="btn btn-gold btn-block">Confirm Private Viewing</button>
                <p class="modal-privacy-note">Chauffeur & private concierge coordinated upon request.</p>
              </form>

              <!-- Direct Enquiry Form -->
              <form id="propEnquiryInlineForm" style="display: none;" onsubmit="handleInlineEnquirySubmit(event, ${prop.id}, '${prop.title.replace(/'/g, "\\'")}')">
                <input type="text" name="honeypot" class="form-honeypot" tabindex="-1">
                
                <div class="form-group">
                  <label for="ieFullName">Full Name *</label>
                  <input type="text" id="ieFullName" class="form-input" placeholder="e.g. Marcus Sterling" required>
                </div>

                <div class="form-group">
                  <label for="iePhone">Phone / WhatsApp *</label>
                  <input type="tel" id="iePhone" class="form-input" placeholder="+971 50 123 4567" required>
                </div>

                <div class="form-group">
                  <label for="ieMessage">Your Question</label>
                  <textarea id="ieMessage" class="form-input" rows="4" placeholder="Ask about floor plans, payment arrangements, or title deeds..."></textarea>
                </div>

                <button type="submit" class="btn btn-gold btn-block">Send Confidential Enquiry</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateInput = document.getElementById('ivDate');
  if (dateInput) dateInput.value = tomorrow.toISOString().split('T')[0];
}

function switchActiveGalleryImage(url, thumbEl) {
  const mainImg = document.getElementById('mainActiveImage');
  if (mainImg) mainImg.src = url;
  document.querySelectorAll('.prop-thumb-item').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');
}

function togglePropDetailForm(mode) {
  const viewForm = document.getElementById('propViewingInlineForm');
  const enqForm = document.getElementById('propEnquiryInlineForm');
  const tabView = document.getElementById('tabViewingBtn');
  const tabEnq = document.getElementById('tabEnquiryBtn');

  if (mode === 'viewing') {
    viewForm.style.display = 'block';
    enqForm.style.display = 'none';
    tabView.classList.add('active');
    tabEnq.classList.remove('active');
  } else {
    viewForm.style.display = 'none';
    enqForm.style.display = 'block';
    tabView.classList.remove('active');
    tabEnq.classList.add('active');
  }
}

// ================= PAGE 3: OFF-PLAN PROJECTS =================
async function renderOffPlanPage(container) {
  const projects = await fetchOffPlan();

  container.innerHTML = `
    <div class="inner-page-header">
      <div class="container">
        <span class="section-subtitle">DUBAI ARCHITECTURAL HORIZONS</span>
        <h1 class="inner-page-title">Off-Plan Developments</h1>
        <p class="inner-page-sub">Secure pre-launch allocations and bespoke investor payment plans in Dubai's most anticipated landmark towers.</p>
      </div>
    </div>

    <section class="section">
      <div class="container">
        <div class="offplan-grid">
          ${projects.map(o => renderOffPlanCardHTML(o)).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderOffPlanCardHTML(proj) {
  return `
    <div class="offplan-card">
      <div class="offplan-image-box" onclick="navigateTo('/off-plan/${proj.slug || proj.id}')" style="cursor: pointer;">
        <img src="${proj.image_url}" alt="${proj.title}" loading="lazy">
      </div>
      <div class="offplan-content">
        <div class="offplan-status-row">
          <span class="offplan-developer-badge">${proj.developer_name || 'Aura Prestige'}</span>
          <span class="offplan-handover">Handover ${proj.handover_date}</span>
        </div>
        <h3 class="offplan-title" onclick="navigateTo('/off-plan/${proj.slug || proj.id}')" style="cursor: pointer;">${proj.title}</h3>
        <p class="offplan-desc">${proj.description}</p>
        
        <div class="offplan-specs-grid">
          <div class="offplan-spec-col">
            <span class="spec-col-label">Location</span>
            <span class="spec-col-value">${proj.location}</span>
          </div>
          <div class="offplan-spec-col">
            <span class="spec-col-label">Starting Price</span>
            <span class="spec-col-value" style="color: var(--color-gold-dark);">${formatMoney(proj.starting_price_aed)}</span>
          </div>
          <div class="offplan-spec-col">
            <span class="spec-col-label">Payment Plan</span>
            <span class="spec-col-value">${proj.payment_plan.split('(')[0]}</span>
          </div>
        </div>

        <div class="offplan-action-row">
          <button class="btn btn-gold btn-block" onclick="navigateTo('/off-plan/${proj.slug || proj.id}')">
            View Project Details & Payment Plan
          </button>
        </div>
      </div>
    </div>
  `;
}

async function renderSingleOffPlanPage(container, slugOrId) {
  const proj = await fetchOffPlanById(slugOrId);
  if (!proj) {
    container.innerHTML = `<div class="container section text-center"><h2>Project Not Found</h2><button class="btn btn-gold mt-20" onclick="navigateTo('/off-plan')">Back to Off-Plan</button></div>`;
    return;
  }

  container.innerHTML = `
    <div class="inner-page-header">
      <div class="container">
        <span class="section-subtitle">${proj.location}, DUBAI • ${proj.developer_name || 'Aura Prestige'}</span>
        <h1 class="inner-page-title">${proj.title}</h1>
        <p class="inner-page-sub">Starting from ${formatMoney(proj.starting_price_aed)} • Expected Handover ${proj.handover_date}</p>
      </div>
    </div>

    <section class="section">
      <div class="container">
        <div class="prop-detail-layout">
          <div>
            <div class="prop-gallery-main">
              <img src="${proj.image_url}" alt="${proj.title}">
            </div>

            <div style="margin: 36px 0;">
              <h2 style="font-family: var(--font-heading); font-size: 2.2rem; margin-bottom: 12px;">Project Overview</h2>
              <p style="font-size: 1.05rem; color: var(--color-text-body); line-height: 1.8;">
                ${proj.description}
              </p>
            </div>

            <div style="background: var(--color-white); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 36px; margin: 36px 0;">
              <span class="section-subtitle">INVESTOR CASH FLOW</span>
              <h3 style="font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 18px;">Structured Payment Plan</h3>
              <p style="font-size: 0.95rem; color: var(--color-charcoal-muted); margin-bottom: 24px;">${proj.payment_plan}</p>
            </div>
          </div>

          <div>
            <div class="prop-sticky-form-card">
              <span class="section-subtitle">INSTANT ACCESS</span>
              <h3 style="font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 8px;">Download Brochure & Price List</h3>
              <p style="font-size: 0.88rem; color: var(--color-charcoal-muted); margin-bottom: 24px;">Receive full unit floor plans, payment schedules, and high-res renders.</p>

              <form onsubmit="handleBrochurePageSubmit(event, ${proj.id}, '${proj.title.replace(/'/g, "\\'")}')">
                <input type="text" name="honeypot" class="form-honeypot" tabindex="-1">
                
                <div class="form-group">
                  <label for="bpFullName">Full Name *</label>
                  <input type="text" id="bpFullName" class="form-input" placeholder="e.g. Marcus Sterling" required>
                </div>

                <div class="form-group">
                  <label for="bpPhone">Phone / WhatsApp *</label>
                  <input type="tel" id="bpPhone" class="form-input" placeholder="+971 50 123 4567" required>
                </div>

                <div class="form-group">
                  <label for="bpEmail">Email *</label>
                  <input type="email" id="bpEmail" class="form-input" placeholder="marcus@domain.com" required>
                </div>

                <div class="form-row-2">
                  <div class="form-group">
                    <label for="bpCash">Payment Type</label>
                    <select id="bpCash" class="form-input">
                      <option value="true">Cash Payment</option>
                      <option value="false">Payment Plan</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="bpTimeframe">Timeline</label>
                    <select id="bpTimeframe" class="form-input">
                      <option value="Immediately">Immediate Reservation</option>
                      <option value="1-3 months" selected>1-3 Months</option>
                    </select>
                  </div>
                </div>

                <button type="submit" class="btn btn-gold btn-block">Download VIP Brochure</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

// ================= PAGE 4: MORTGAGE CALCULATOR =================
function renderCalculatorPage(container) {
  container.innerHTML = `
    <div class="inner-page-header">
      <div class="container">
        <span class="section-subtitle">FINANCIAL TAILORING</span>
        <h1 class="inner-page-title">Dubai Mortgage & Investment Calculator</h1>
        <p class="inner-page-sub">Calculate your exact monthly repayments, down payment requirement, and official Dubai Land Department transaction fees.</p>
      </div>
    </div>

    <section class="section">
      <div class="container">
        <div class="calculator-card">
          <div class="calc-inputs-col">
            <div class="calc-field-group">
              <div class="calc-label-row">
                <label for="calcPrice">Property Purchase Price</label>
                <span class="calc-value-display" id="calcPriceDisplay">AED 15,000,000</span>
              </div>
              <input type="range" id="calcPrice" min="1500000" max="80000000" step="500000" value="15000000" class="calc-slider">
              <div class="calc-min-max">
                <span>AED 1.5M</span>
                <span>AED 80M+</span>
              </div>
            </div>

            <div class="calc-field-group">
              <div class="calc-label-row">
                <label for="calcDownPercent">Down Payment (<span id="calcDownPercentText">25%</span>)</label>
                <span class="calc-value-display" id="calcDownAmountDisplay">AED 3,750,000</span>
              </div>
              <input type="range" id="calcDownPercent" min="20" max="80" step="5" value="25" class="calc-slider">
              <div class="calc-min-max">
                <span>20% (UAE Expat Min)</span>
                <span>80%</span>
              </div>
            </div>

            <div class="calc-two-col">
              <div class="calc-field-group">
                <label for="calcTenure">Loan Duration (Years)</label>
                <select id="calcTenure" class="calc-select">
                  <option value="10">10 Years</option>
                  <option value="15">15 Years</option>
                  <option value="20">20 Years</option>
                  <option value="25" selected>25 Years</option>
                </select>
              </div>

              <div class="calc-field-group">
                <label for="calcInterest">Interest Rate (%)</label>
                <div class="calc-input-wrapper">
                  <input type="number" id="calcInterest" min="1.0" max="15.0" step="0.1" value="4.45" class="calc-num-input">
                  <span class="input-suffix">%</span>
                </div>
              </div>
            </div>

            <div style="background: var(--color-alabaster); padding: 24px; border-radius: var(--radius-sm); margin-top: 24px;">
              <h4 style="font-size: 0.95rem; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">Speak to an In-House Mortgage Advisor</h4>
              <p style="font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 16px;">We partner with top UAE tier-1 banks to secure exclusive mortgage rates for residents and non-residents.</p>

              <form onsubmit="handleMortgageAdvisorSubmit(event)">
                <input type="text" name="honeypot" class="form-honeypot" tabindex="-1">
                
                <div class="form-row-2">
                  <div class="form-group">
                    <label for="maFullName">Your Name *</label>
                    <input type="text" id="maFullName" class="form-input" placeholder="Full Name" required>
                  </div>
                  <div class="form-group">
                    <label for="maPhone">Phone / WhatsApp *</label>
                    <input type="tel" id="maPhone" class="form-input" placeholder="+971 50 123 4567" required>
                  </div>
                </div>
                <button type="submit" class="btn btn-gold btn-block" style="padding: 10px 18px; font-size: 0.78rem;">
                  Request Free Pre-Approval Consultation
                </button>
              </form>
            </div>
          </div>

          <div class="calc-results-col">
            <div class="result-box-inner">
              <span class="result-badge">ESTIMATED MONTHLY REPAYMENT</span>
              <div class="monthly-emi-amount" id="calcMonthlyEMI">AED 62,280<span class="emi-period">/ mo</span></div>
              <div class="gold-line-subtle"></div>

              <div class="breakdown-list">
                <div class="breakdown-row">
                  <span>Loan Principal</span>
                  <strong id="calcLoanPrincipal">AED 11,250,000</strong>
                </div>
                <div class="breakdown-row">
                  <span>Dubai Land Dept Fee (DLD 4%)</span>
                  <strong id="calcDLD">AED 600,000</strong>
                </div>
                <div class="breakdown-row">
                  <span>Property Registration Fee</span>
                  <strong>AED 4,200</strong>
                </div>
                <div class="breakdown-row">
                  <span>Real Estate Agency Fee (2%)</span>
                  <strong id="calcAgencyFee">AED 300,000</strong>
                </div>
                <div class="breakdown-row">
                  <span>Mortgage Valuation Fee</span>
                  <strong>AED 3,150</strong>
                </div>
                <div class="breakdown-row total-upfront">
                  <span>Total Upfront Cash Needed</span>
                  <strong id="calcTotalUpfront">AED 4,657,350</strong>
                </div>
              </div>

              <button class="btn btn-gold btn-block mt-20" onclick="openRegisterModal('Mortgage Application Support')">
                Lock In Pre-Approval Rate
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  document.getElementById('calcPrice')?.addEventListener('input', updateMortgageCalculator);
  document.getElementById('calcDownPercent')?.addEventListener('input', updateMortgageCalculator);
  document.getElementById('calcTenure')?.addEventListener('change', updateMortgageCalculator);
  document.getElementById('calcInterest')?.addEventListener('input', updateMortgageCalculator);

  updateMortgageCalculator();
}

function updateMortgageCalculator() {
  const priceInput = document.getElementById('calcPrice');
  const downPercentInput = document.getElementById('calcDownPercent');
  const tenureInput = document.getElementById('calcTenure');
  const interestInput = document.getElementById('calcInterest');

  if (!priceInput || !downPercentInput) return;

  const propertyPrice = parseFloat(priceInput.value);
  const downPercent = parseFloat(downPercentInput.value);
  const tenureYears = parseInt(tenureInput.value, 10);
  const annualInterestRate = parseFloat(interestInput.value) / 100;

  const downPaymentAmount = propertyPrice * (downPercent / 100);
  const loanPrincipal = propertyPrice - downPaymentAmount;

  const monthlyRate = annualInterestRate / 12;
  const totalMonths = tenureYears * 12;
  
  let monthlyEMI = 0;
  if (monthlyRate > 0) {
    monthlyEMI = (loanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
  } else {
    monthlyEMI = loanPrincipal / totalMonths;
  }

  const dldFee = propertyPrice * 0.04;
  const registrationFee = 4200;
  const agencyFee = propertyPrice * 0.02;
  const valuationFee = 3150;
  const totalUpfront = downPaymentAmount + dldFee + registrationFee + agencyFee + valuationFee;

  document.getElementById('calcPriceDisplay').textContent = formatExactCurrency(propertyPrice);
  document.getElementById('calcDownPercentText').textContent = `${downPercent}%`;
  document.getElementById('calcDownAmountDisplay').textContent = formatExactCurrency(downPaymentAmount);
  document.getElementById('calcMonthlyEMI').innerHTML = `${formatExactCurrency(monthlyEMI)}<span class="emi-period">/ mo</span>`;
  document.getElementById('calcLoanPrincipal').textContent = formatExactCurrency(loanPrincipal);
  document.getElementById('calcDLD').textContent = formatExactCurrency(dldFee);
  document.getElementById('calcAgencyFee').textContent = formatExactCurrency(agencyFee);
  document.getElementById('calcTotalUpfront').textContent = formatExactCurrency(totalUpfront);
}

function populateCalculatorWithPrice(priceAED) {
  sessionStorage.setItem('calcPriceValue', priceAED.toString());
}

// ================= PAGE 5: SELL YOUR PROPERTY, ABOUT & CONTACT =================
function renderSellPage(container) {
  container.innerHTML = `
    <div class="inner-page-header">
      <div class="container">
        <span class="section-subtitle">PRIVATE DISPOSAL DESK</span>
        <h1 class="inner-page-title">Sell Your Dubai Property</h1>
        <p class="inner-page-sub">List discreetly with Dubai's elite private brokerage or request a complimentary comparative market valuation.</p>
      </div>
    </div>

    <section class="section">
      <div class="container">
        <div class="sell-wrapper-card">
          <div>
            <span class="section-subtitle" style="color: var(--color-gold-light);">WHY LIST WITH JAY</span>
            <h2 style="font-family: var(--font-heading); font-size: 2.4rem; line-height: 1.15; margin-bottom: 20px;">Maximum Valuation. Absolute Discretion.</h2>
            <p style="font-size: 1rem; color: rgba(255, 255, 255, 0.8); line-height: 1.7; margin-bottom: 30px;">
              Our private client registry includes royal family offices, international institutional funds, and ultra-high-net-worth individuals actively looking for off-market Dubai trophy assets.
            </p>
          </div>

          <div style="background: var(--color-white); color: var(--color-charcoal-dark); padding: 40px; border-radius: var(--radius-sm);">
            <h3 style="font-family: var(--font-heading); font-size: 1.85rem; margin-bottom: 8px;">Request Home Valuation</h3>
            <p style="font-size: 0.85rem; color: var(--color-charcoal-muted); margin-bottom: 22px;">Receive a comprehensive valuation report within 24 hours.</p>

            <form onsubmit="handleValuationSubmit(event)">
              <input type="text" name="honeypot" class="form-honeypot" tabindex="-1">
              
              <div class="form-group">
                <label for="svName">Full Name *</label>
                <input type="text" id="svName" class="form-input" placeholder="e.g. Alexander Vance" required>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label for="svPhone">Phone / WhatsApp *</label>
                  <input type="tel" id="svPhone" class="form-input" placeholder="+971 50 123 4567" required>
                </div>
                <div class="form-group">
                  <label for="svCommunity">Community *</label>
                  <select id="svCommunity" class="form-input" required>
                    <option value="Palm Jumeirah">Palm Jumeirah</option>
                    <option value="Downtown Dubai">Downtown Dubai</option>
                    <option value="Dubai Marina">Dubai Marina</option>
                    <option value="Dubai Hills Estate">Dubai Hills Estate</option>
                    <option value="Business Bay">Business Bay</option>
                    <option value="Jumeirah Village Circle (JVC)">JVC</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="svExpectedPrice">Expected Price / Remarks</label>
                <input type="text" id="svExpectedPrice" class="form-input" placeholder="e.g. Sea view, upgraded interiors">
              </div>

              <button type="submit" class="btn btn-gold btn-block">Submit for Confidential Valuation</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderAboutPage(container) {
  container.innerHTML = `
    <div class="inner-page-header">
      <div class="container">
        <span class="section-subtitle">OUR HERITAGE & VISION</span>
        <h1 class="inner-page-title">About Jay Real Estate</h1>
        <p class="inner-page-sub">Dubai’s boutique private client real estate advisory, rooted in architectural discernment and unmatched market intelligence.</p>
      </div>
    </div>

    <section class="section">
      <div class="container">
        <div class="section-header-centered">
          <span class="section-subtitle">THE ADVISORY DIFFERENCE</span>
          <h2 class="section-title">A Legacy of Discreet Excellence</h2>
          <div class="gold-line-decor"></div>
          <p class="section-description">
            Founded with a singular commitment to elevate luxury real estate advisory in Dubai, Jay Real Estate connects discerning international purchasers with landmark architectural residences.
          </p>
        </div>

        <div class="team-grid">
          <div class="team-card">
            <div class="team-avatar-box">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80" alt="Jayden Vance">
            </div>
            <h3 class="team-name">Jayden Vance</h3>
            <span class="team-role">Senior Managing Director</span>
            <p class="team-deals">42 Landmark Deals Closed • Palm Jumeirah Specialist</p>
          </div>

          <div class="team-card">
            <div class="team-avatar-box">
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80" alt="Sophia Laurent-Sterling">
            </div>
            <h3 class="team-name">Sophia Laurent-Sterling</h3>
            <span class="team-role">Head of Private Wealth</span>
            <p class="team-deals">36 Off-Plan Landmark Allocations • Downtown Specialist</p>
          </div>

          <div class="team-card">
            <div class="team-avatar-box">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80" alt="Tariq Mansoor Al-Hashemi">
            </div>
            <h3 class="team-name">Tariq Al-Hashemi</h3>
            <span class="team-role">Senior Partner — Ready Residences</span>
            <p class="team-deals">29 Completed Sales • Dubai Hills Specialist</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderContactPage(container) {
  container.innerHTML = `
    <div class="inner-page-header">
      <div class="container">
        <span class="section-subtitle">CONNECT WITH US</span>
        <h1 class="inner-page-title">Schedule a Private Consultation</h1>
        <p class="inner-page-sub">Visit our private suite in Downtown Dubai or request an exclusive virtual consultation.</p>
      </div>
    </div>

    <section class="section">
      <div class="container">
        <div class="contact-grid">
          <div class="contact-card-box">
            <div class="contact-item">
              <div class="contact-icon"><i data-lucide="map-pin"></i></div>
              <div>
                <h4>Private Office Suite</h4>
                <p>Level 48, Boulevard Plaza Tower 1,<br>Downtown Dubai, United Arab Emirates</p>
              </div>
            </div>

            <div class="contact-item">
              <div class="contact-icon"><i data-lucide="phone-call"></i></div>
              <div>
                <h4>Direct Telephone</h4>
                <p>+971 4 800 JAY (800 529 Toll-Free)<br>+971 50 800 5291 (Direct Private Desk)</p>
              </div>
            </div>
          </div>

          <div class="contact-form-box">
            <h3 class="contact-box-title">Send a Direct Confidential Message</h3>
            <form onsubmit="handleContactPageSubmit(event)">
              <input type="text" name="honeypot" class="form-honeypot" tabindex="-1">
              
              <div class="form-row-2">
                <div class="form-group">
                  <label for="cpFullName">Your Name *</label>
                  <input type="text" id="cpFullName" class="form-input" placeholder="Full Name" required>
                </div>
                <div class="form-group">
                  <label for="cpPhone">Phone / WhatsApp *</label>
                  <input type="tel" id="cpPhone" class="form-input" placeholder="+971 50 123 4567" required>
                </div>
              </div>

              <div class="form-group">
                <label for="cpInterests">Topic of Inquiry</label>
                <select id="cpInterests" class="form-input">
                  <option value="Ready Luxury Residence Acquisition">Ready Luxury Residence Acquisition</option>
                  <option value="Off-Plan Pre-Launch Portfolio">Off-Plan Pre-Launch Portfolio</option>
                  <option value="Selling a Dubai Property">Selling a Dubai Property</option>
                </select>
              </div>

              <div class="form-group">
                <label for="cpMsg">Message</label>
                <textarea id="cpMsg" class="form-input" rows="4" placeholder="Share your investment budget, preferred community, or questions..."></textarea>
              </div>

              <button type="submit" class="btn btn-gold btn-block">Send Confidential Message</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  `;
}

// ================= ADMIN CRM SYSTEM =================
async function renderAdminArea(container) {
  if (!currentUser) {
    renderAdminLoginScreen(container);
    return;
  }

  // Fetch unread count for bell
  await refreshUnreadBell();
  startBellAutoRefresh();

  container.innerHTML = `
    <!-- ADMIN TOP NAVIGATION BAR -->
    <div class="admin-top-bar">
      <div class="admin-user-badge">
        <img src="${currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}" alt="${currentUser.full_name}" class="admin-avatar">
        <div>
          <div style="font-weight: 600; font-size: 0.95rem;">${currentUser.full_name}</div>
          <span class="admin-role-tag">${currentUser.role === 'admin' ? 'Managing Director / Admin' : 'Senior Client Partner'}</span>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 20px;">
        <!-- Real-Time Notification Bell -->
        <div class="admin-bell-wrapper" onclick="toggleBellDropdown()">
          <div class="admin-bell-btn" title="New Incoming Leads">
            <i data-lucide="bell"></i>
            <span class="admin-bell-badge" id="adminBellBadge">${unreadBellCount}</span>
          </div>
          <div class="admin-bell-dropdown" id="adminBellDropdown">
            <div class="bell-dropdown-header">New Buyer Inquiries</div>
            <div id="bellDropdownList" style="max-height: 280px; overflow-y: auto;">
              <!-- Rendered dynamically -->
            </div>
          </div>
        </div>

        <button class="btn btn-outline-white btn-sm" onclick="handleAdminLogout()">
          <i data-lucide="log-out"></i> Logout
        </button>
      </div>
    </div>

    <div class="container section" style="padding-top: 40px;">
      <!-- Admin Navigation Tabs -->
      <div class="admin-nav-tabs">
        <button class="admin-tab-btn ${adminActiveTab === 'dashboard' ? 'active' : ''}" onclick="switchAdminTab('dashboard')">
          <i data-lucide="layout-dashboard"></i> Dashboard
        </button>
        <button class="admin-tab-btn ${adminActiveTab === 'kanban' ? 'active' : ''}" onclick="switchAdminTab('kanban')">
          <i data-lucide="kanban"></i> Pipeline Board
        </button>
        <button class="admin-tab-btn ${adminActiveTab === 'leads' ? 'active' : ''}" onclick="switchAdminTab('leads')">
          <i data-lucide="users"></i> Leads Directory
        </button>
        <button class="admin-tab-btn ${adminActiveTab === 'stale' ? 'active' : ''}" onclick="switchAdminTab('stale')" style="color: #ef4444;">
          <i data-lucide="alert-circle"></i> Inactive Leads (3+ Days)
        </button>
        <button class="admin-tab-btn ${adminActiveTab === 'viewings' ? 'active' : ''}" onclick="switchAdminTab('viewings')">
          <i data-lucide="calendar"></i> Viewings Schedule
        </button>
        <button class="admin-tab-btn ${adminActiveTab === 'leaderboard' ? 'active' : ''}" onclick="switchAdminTab('leaderboard')">
          <i data-lucide="trophy"></i> Agent Targets & Leaderboard
        </button>
        ${currentUser.role === 'admin' ? `
        <button class="admin-tab-btn ${adminActiveTab === 'properties' ? 'active' : ''}" onclick="switchAdminTab('properties')">
          <i data-lucide="building"></i> Manage Properties & Projects
        </button>
        ` : ''}
      </div>

      <!-- Tab Content Area -->
      <div id="adminTabContent">
        <!-- Rendered dynamically -->
      </div>
    </div>
  `;

  renderAdminTabContent();
}

function renderAdminLoginScreen(container) {
  container.innerHTML = `
    <div class="inner-page-header">
      <div class="container">
        <span class="section-subtitle">AUTHORIZED STAFF ONLY</span>
        <h1 class="inner-page-title">Jay Private Advisory CRM Vault</h1>
        <p class="inner-page-sub">Sign in to manage active buyer inquiries, pipeline transactions, and property listings.</p>
      </div>
    </div>

    <section class="section">
      <div class="container" style="max-width: 520px;">
        <div style="background: var(--color-white); border: 1px solid var(--color-border); padding: 48px; border-radius: var(--radius-sm); box-shadow: var(--shadow-card);">
          <div class="brand-logo text-center mb-15">
            <span class="logo-title" style="color: var(--color-charcoal-dark);">JAY</span>
            <span class="logo-divider"></span>
            <span class="logo-subtitle">REAL ESTATE</span>
          </div>
          <h3 style="font-family: var(--font-heading); font-size: 1.8rem; text-align: center; margin-bottom: 24px;">Staff Sign In</h3>

          <form onsubmit="handleAdminLoginSubmit(event)">
            <div class="form-group">
              <label for="admUsername">Username *</label>
              <input type="text" id="admUsername" class="form-input" placeholder="e.g. admin or slaurent" value="admin" required>
            </div>

            <div class="form-group">
              <label for="admPassword">Password *</label>
              <input type="password" id="admPassword" class="form-input" placeholder="••••••••" value="jay2026!" required>
            </div>

            <button type="submit" class="btn btn-gold btn-block mt-20">Access Private Vault</button>

            <div style="background: var(--color-alabaster); padding: 14px; border-radius: var(--radius-sm); margin-top: 24px; font-size: 0.75rem; color: var(--color-text-muted);">
              <strong>Demo Credentials:</strong><br>
              • <strong>Director / Admin:</strong> <code>admin</code> / <code>jay2026!</code><br>
              • <strong>Senior Agent 1:</strong> <code>slaurent</code> / <code>agent123</code><br>
              • <strong>Senior Agent 2:</strong> <code>tariq</code> / <code>agent123</code>
            </div>
          </form>
        </div>
      </div>
    </section>
  `;
}

async function handleAdminLoginSubmit(e) {
  e.preventDefault();
  const u = document.getElementById('admUsername')?.value;
  const p = document.getElementById('admPassword')?.value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      sessionStorage.setItem('jayAdminUser', JSON.stringify(data.user));
      showToast('Welcome Back', `Authenticated as ${data.user.full_name} (${data.user.role})`);
      renderAdminArea(document.getElementById('appViewContainer'));
    } else {
      showToast('Sign In Failed', data.message || 'Invalid username or password.');
    }
  } catch (err) {
    showToast('Login Error', 'Could not connect to authentication service.');
  }
}

function handleAdminLogout() {
  currentUser = null;
  sessionStorage.removeItem('jayAdminUser');
  if (bellRefreshTimer) clearInterval(bellRefreshTimer);
  showToast('Logged Out', 'You have been safely signed out of the private vault.');
  navigateTo('/');
}

function switchAdminTab(tab) {
  adminActiveTab = tab;
  renderAdminArea(document.getElementById('appViewContainer'));
}

async function renderAdminTabContent() {
  const content = document.getElementById('adminTabContent');
  if (!content) return;

  if (adminActiveTab === 'dashboard') {
    await renderAdminDashboardTab(content);
  } else if (adminActiveTab === 'kanban') {
    await renderAdminKanbanTab(content);
  } else if (adminActiveTab === 'leads') {
    await renderAdminLeadsListTab(content);
  } else if (adminActiveTab === 'stale') {
    await renderAdminStaleLeadsTab(content);
  } else if (adminActiveTab === 'viewings') {
    await renderAdminViewingsTab(content);
  } else if (adminActiveTab === 'leaderboard') {
    await renderAdminLeaderboardTab(content);
  } else if (adminActiveTab === 'properties') {
    await renderAdminPropertiesManagerTab(content);
  }

  if (window.lucide) lucide.createIcons();
}

// 1. Dashboard Tab
async function renderAdminDashboardTab(container) {
  const query = currentUser ? `?role=${currentUser.role}&userId=${currentUser.id}` : '';
  const res = await fetch(`/api/admin/stats${query}`);
  const { data: stats } = await res.json();

  container.innerHTML = `
    <!-- Top 4 Metrics -->
    <div class="admin-stats-bar">
      <div class="admin-stat-card">
        <div class="admin-stat-val">${stats.leadsToday}</div>
        <div class="admin-stat-lbl">New Leads Today</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-val">${formatMoney(stats.pipelineValueAED)}</div>
        <div class="admin-stat-lbl">Active Deal Pipeline (AED)</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-val">${stats.viewingsThisWeek}</div>
        <div class="admin-stat-lbl">Viewings This Week</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-val">${formatMoney(stats.totalVolumeAED)}</div>
        <div class="admin-stat-lbl">Closed Sales Volume</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-val" style="color: var(--color-gold-dark);">${formatMoney(stats.totalCommissionAED)}</div>
        <div class="admin-stat-lbl">2% Commission Earned</div>
      </div>
    </div>

    <!-- Charts & Breakdown Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 36px;">
      <!-- Pipeline Stages Distribution -->
      <div style="background: var(--color-white); border: 1px solid var(--color-border); padding: 32px; border-radius: var(--radius-sm);">
        <span class="section-subtitle">PIPELINE FUNNEL</span>
        <h3 style="font-family: var(--font-heading); font-size: 1.6rem; margin-bottom: 20px;">Leads By Stage</h3>
        
        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${Object.entries(stats.stageCounts).map(([stage, count]) => {
            const pct = Math.round((count / (stats.totalLeadsCount || 1)) * 100);
            return `
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px;">
                  <span>${stage}</span>
                  <span>${count} leads (${pct}%)</span>
                </div>
                <div style="width: 100%; height: 8px; background: var(--color-alabaster); border-radius: 4px; overflow: hidden;">
                  <div style="width: ${pct}%; height: 100%; background: var(--color-gold-gradient);"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Lead Score Ratings -->
      <div style="background: var(--color-white); border: 1px solid var(--color-border); padding: 32px; border-radius: var(--radius-sm);">
        <span class="section-subtitle">AI LEAD SCORING</span>
        <h3 style="font-family: var(--font-heading); font-size: 1.6rem; margin-bottom: 20px;">Quality Distribution</h3>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
          <div style="background: var(--color-hot-bg); border: 1px solid rgba(239, 68, 68, 0.3); padding: 18px; border-radius: var(--radius-sm); text-align: center;">
            <div style="font-size: 1.8rem; font-weight: 700; color: var(--color-hot); font-family: var(--font-heading);">${stats.ratingCounts.HOT}</div>
            <div style="font-size: 0.72rem; font-weight: 600; text-transform: uppercase;">🔥 HOT (Score 70-100)</div>
          </div>

          <div style="background: var(--color-warm-bg); border: 1px solid rgba(245, 158, 11, 0.3); padding: 18px; border-radius: var(--radius-sm); text-align: center;">
            <div style="font-size: 1.8rem; font-weight: 700; color: var(--color-warm); font-family: var(--font-heading);">${stats.ratingCounts.WARM}</div>
            <div style="font-size: 0.72rem; font-weight: 600; text-transform: uppercase;">⚡ WARM (Score 40-69)</div>
          </div>

          <div style="background: var(--color-cold-bg); border: 1px solid rgba(59, 130, 246, 0.3); padding: 18px; border-radius: var(--radius-sm); text-align: center;">
            <div style="font-size: 1.8rem; font-weight: 700; color: var(--color-cold); font-family: var(--font-heading);">${stats.ratingCounts.COLD}</div>
            <div style="font-size: 0.72rem; font-weight: 600; text-transform: uppercase;">❄️ COLD (&lt; 40)</div>
          </div>
        </div>

        <p style="font-size: 0.82rem; color: var(--color-text-muted); line-height: 1.5;">
          Scoring logic awards +25 for cash liquidity, +20 for immediate timeframe, +25 for budgets &gt; 35M AED, +15 for verified contact, and +15 for attached property.
        </p>
      </div>
    </div>
  `;
}

// 2. Kanban Board Tab
async function renderAdminKanbanTab(container) {
  const query = currentUser ? `?role=${currentUser.role}&userId=${currentUser.id}` : '';
  const res = await fetch(`/api/admin/leads${query}`);
  const { data: leads } = await res.json();
  cachedLeads = leads;

  const stages = ['New', 'Contacted', 'Viewing', 'Offer', 'Won', 'Lost'];

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
        <span class="section-subtitle">DRAG & DROP PIPELINE</span>
        <h2 style="font-family: var(--font-heading); font-size: 2rem;">Interactive Deal Board</h2>
      </div>
      <div style="font-size: 0.85rem; color: var(--color-text-muted);">
        Tip: Drag cards into <strong>"Won"</strong> to close a deal and automatically log a 2% commission.
      </div>
    </div>

    <div class="kanban-board">
      ${stages.map(stage => {
        const stageLeads = leads.filter(l => l.stage === stage);
        return `
          <div class="kanban-col" data-stage="${stage}" ondragover="handleDragOver(event)" ondrop="handleDrop(event, '${stage}')">
            <div class="kanban-col-header">
              <span class="kanban-col-title">${stage}</span>
              <span class="kanban-count-badge">${stageLeads.length}</span>
            </div>
            <div class="kanban-cards-container">
              ${stageLeads.map(lead => renderKanbanCardHTML(lead)).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderKanbanCardHTML(lead) {
  return `
    <div class="kanban-card" draggable="true" ondragstart="handleDragStart(event, ${lead.id})" onclick="openLeadDetailModal(${lead.id})">
      <div class="kanban-card-top">
        <span class="score-badge score-${lead.lead_rating}">
          ${lead.lead_rating === 'HOT' ? '🔥' : (lead.lead_rating === 'WARM' ? '⚡' : '❄️')} ${lead.lead_score} pts
        </span>
        <span style="font-size: 0.68rem; color: var(--color-text-muted);">${lead.country || 'UAE'}</span>
      </div>
      <div class="kanban-client-name">${lead.full_name}</div>
      <div class="kanban-interest">${lead.property_title || lead.project_title || lead.interest_type}</div>
      <div class="kanban-card-footer">
        <span>${lead.budget_range || 'Flexible'}</span>
        <span>${lead.is_cash_buyer ? '💵 Cash' : '🏦 Finance'}</span>
      </div>
    </div>
  `;
}

function handleDragStart(e, leadId) {
  e.dataTransfer.setData('text/plain', leadId.toString());
}

function handleDragOver(e) {
  e.preventDefault();
}

async function handleDrop(e, newStage) {
  e.preventDefault();
  const leadId = e.dataTransfer.getData('text/plain');
  if (!leadId) return;

  const lead = cachedLeads.find(l => l.id == leadId);
  if (!lead) return;

  if (newStage === 'Won') {
    openDealWonModal(lead);
    return;
  }

  try {
    await fetch(`/api/admin/leads/${leadId}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage })
    });
    showToast('Stage Updated', `${lead.full_name} moved to ${newStage}`);
    renderAdminArea(document.getElementById('appViewContainer'));
  } catch (err) {
    showToast('Error', 'Could not update stage');
  }
}

// 3. Leads List Tab
async function renderAdminLeadsListTab(container) {
  const query = currentUser ? `?role=${currentUser.role}&userId=${currentUser.id}` : '';
  const res = await fetch(`/api/admin/leads${query}`);
  const { data: leads } = await res.json();
  cachedLeads = leads;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
      <div>
        <span class="section-subtitle">REGISTERED BUYERS</span>
        <h2 style="font-family: var(--font-heading); font-size: 2rem;">Leads Directory (${leads.length})</h2>
      </div>

      <div style="display: flex; gap: 12px;">
        <a href="/api/admin/leads/export-csv${query}" class="btn btn-outline-dark" style="padding: 10px 18px; font-size: 0.78rem;">
          <i data-lucide="download"></i> Download Excel (CSV)
        </a>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div style="background: var(--color-white); padding: 18px 24px; border-radius: var(--radius-sm); border: 1px solid var(--color-border); margin-bottom: 24px; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 16px;">
      <input type="text" id="leadSearchInput" class="form-input" placeholder="Search by client name, email, country, phone..." oninput="filterLeadsTable()">
      
      <select id="leadStageFilter" class="form-input" onchange="filterLeadsTable()">
        <option value="all">All Stages</option>
        <option value="New">New</option>
        <option value="Contacted">Contacted</option>
        <option value="Viewing">Viewing</option>
        <option value="Offer">Offer</option>
        <option value="Won">Won</option>
        <option value="Lost">Lost</option>
      </select>

      <select id="leadRatingFilter" class="form-input" onchange="filterLeadsTable()">
        <option value="all">All Lead Scores</option>
        <option value="HOT">🔥 HOT (70+ pts)</option>
        <option value="WARM">⚡ WARM (40-69 pts)</option>
        <option value="COLD">❄️ COLD (&lt; 40 pts)</option>
      </select>
    </div>

    <!-- Table -->
    <div class="admin-table-card">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Score</th>
            <th>Client Name</th>
            <th>Phone / WhatsApp</th>
            <th>Country</th>
            <th>Stage</th>
            <th>Property / Interest</th>
            <th>Budget</th>
            <th>Source Form</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="leadsTableBody">
          ${leads.map(l => renderLeadTableRowHTML(l)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderLeadTableRowHTML(l) {
  return `
    <tr onclick="openLeadDetailModal(${l.id})" style="cursor: pointer;">
      <td>
        <span class="score-badge score-${l.lead_rating}">
          ${l.lead_rating === 'HOT' ? '🔥' : (l.lead_rating === 'WARM' ? '⚡' : '❄️')} ${l.lead_score}
        </span>
      </td>
      <td><strong>${l.full_name}</strong></td>
      <td>${l.phone}</td>
      <td>${l.country || 'International'}</td>
      <td><span class="status-badge status-${l.stage}">${l.stage}</span></td>
      <td>${l.property_title || l.project_title || l.interest_type}</td>
      <td>${l.budget_range || 'Flexible'}</td>
      <td style="font-size: 0.72rem; color: var(--color-text-muted);">${l.source_form || 'VIP Form'}</td>
      <td>
        <button class="btn btn-gold btn-sm" onclick="event.stopPropagation(); openLeadDetailModal(${l.id})">
          Open Profile
        </button>
      </td>
    </tr>
  `;
}

function filterLeadsTable() {
  const query = document.getElementById('leadSearchInput')?.value.toLowerCase() || '';
  const stage = document.getElementById('leadStageFilter')?.value || 'all';
  const rating = document.getElementById('leadRatingFilter')?.value || 'all';

  const filtered = cachedLeads.filter(l => {
    if (stage !== 'all' && l.stage !== stage) return false;
    if (rating !== 'all' && l.lead_rating !== rating) return false;
    if (query) {
      const matchName = l.full_name?.toLowerCase().includes(query);
      const matchPhone = l.phone?.toLowerCase().includes(query);
      const matchCountry = l.country?.toLowerCase().includes(query);
      const matchEmail = l.email?.toLowerCase().includes(query);
      if (!matchName && !matchPhone && !matchCountry && !matchEmail) return false;
    }
    return true;
  });

  const tbody = document.getElementById('leadsTableBody');
  if (tbody) {
    tbody.innerHTML = filtered.map(l => renderLeadTableRowHTML(l)).join('');
  }
}

// 4. Stale Leads Tab (Inactive for 3+ days)
async function renderAdminStaleLeadsTab(container) {
  const query = currentUser ? `?role=${currentUser.role}&userId=${currentUser.id}` : '';
  const res = await fetch(`/api/admin/leads/stale${query}`);
  const { data: staleLeads } = await res.json();

  container.innerHTML = `
    <div class="stale-alert-banner">
      <i data-lucide="alert-triangle"></i>
      <div>
        <strong>Urgent Follow-Up Required:</strong> You have <strong>${staleLeads.length} leads</strong> with no recorded activity for over 3 days. Connect now to maintain pipeline momentum.
      </div>
    </div>

    <div class="admin-table-card">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Score</th>
            <th>Client Name</th>
            <th>Phone</th>
            <th>Stage</th>
            <th>Interest</th>
            <th>Last Activity</th>
            <th>Quick Actions</th>
          </tr>
        </thead>
        <tbody>
          ${staleLeads.map(l => `
            <tr>
              <td><span class="score-badge score-${l.lead_rating}">🔥 ${l.lead_score}</span></td>
              <td><strong>${l.full_name}</strong></td>
              <td>${l.phone}</td>
              <td><span class="status-badge status-${l.stage}">${l.stage}</span></td>
              <td>${l.property_title || l.interest_type}</td>
              <td style="color: #ef4444; font-weight: 600;">${new Date(l.last_activity_at).toLocaleDateString()}</td>
              <td>
                <a href="https://wa.me/${l.phone.replace(/[^0-9]/g, '')}" target="_blank" class="btn btn-sm btn-gold" style="padding: 6px 12px;">
                  <i data-lucide="message-circle"></i> WhatsApp
                </a>
                <a href="tel:${l.phone}" class="btn btn-sm btn-outline-dark" style="padding: 6px 12px; margin-left: 6px;">
                  <i data-lucide="phone"></i> Call
                </a>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// 5. Viewings Schedule Tab
async function renderAdminViewingsTab(container) {
  const query = currentUser ? `?role=${currentUser.role}&userId=${currentUser.id}` : '';
  const res = await fetch(`/api/admin/viewings${query}`);
  const { data: viewings } = await res.json();

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
        <span class="section-subtitle">PRIVATE TOURS</span>
        <h2 style="font-family: var(--font-heading); font-size: 2rem;">Viewings Schedule (${viewings.length})</h2>
      </div>
    </div>

    <div class="admin-table-card">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Client Name</th>
            <th>Property</th>
            <th>Community</th>
            <th>Assigned Agent</th>
            <th>Status</th>
            <th>Client Feedback / Notes</th>
          </tr>
        </thead>
        <tbody>
          ${viewings.map(v => `
            <tr>
              <td><strong>${v.viewing_date}</strong><br><span style="font-size: 0.75rem; color: var(--color-gold-dark);">${v.viewing_time}</span></td>
              <td><strong>${v.client_name}</strong><br><span style="font-size: 0.72rem; color: var(--color-text-muted);">${v.client_phone || ''}</span></td>
              <td>${v.property_title}</td>
              <td>${v.property_community}</td>
              <td>${v.agent_name}</td>
              <td><span class="status-badge status-Viewing">${v.status}</span></td>
              <td style="font-size: 0.8rem; max-width: 250px;">${v.client_feedback || 'Scheduled online'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// 6. Agent Targets & Leaderboard Tab
async function renderAdminLeaderboardTab(container) {
  const res = await fetch('/api/admin/leaderboard');
  const { data: leaderboard } = await res.json();

  container.innerHTML = `
    <div class="section-header-centered" style="margin-bottom: 40px;">
      <span class="section-subtitle">PERFORMANCE METRICS</span>
      <h2 class="section-title">Monthly Agent Targets & Leaderboard</h2>
      <div class="gold-line-decor"></div>
    </div>

    <div class="leaderboard-grid">
      ${leaderboard.map((agent, i) => {
        const target = agent.monthly_target_aed || 40000000;
        const volume = agent.total_sales_volume_aed || 0;
        const pct = Math.min(100, Math.round((volume / target) * 100));

        return `
          <div class="leader-card">
            <div style="font-size: 0.72rem; letter-spacing: 0.15em; color: var(--color-gold-dark); font-weight: 700; margin-bottom: 8px;">
              RANK #${i + 1}
            </div>
            <img src="${agent.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}" alt="${agent.full_name}" style="width: 84px; height: 84px; border-radius: 50%; object-fit: cover; margin: 0 auto 14px auto; border: 2px solid var(--color-gold);">
            <h3 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 4px;">${agent.full_name}</h3>
            <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--color-text-muted);">${agent.role}</span>

            <div style="margin: 20px 0;">
              <div style="font-size: 1.8rem; font-family: var(--font-heading); font-weight: 700; color: var(--color-charcoal-dark);">${formatMoney(volume)}</div>
              <span style="font-size: 0.72rem; color: var(--color-text-muted);">Target: ${formatMoney(target)}</span>

              <div class="leader-progress-bar">
                <div class="leader-progress-fill" style="width: ${pct}%;"></div>
              </div>
              <span style="font-size: 0.75rem; font-weight: 600; color: var(--color-gold-dark);">${pct}% of Target Reached</span>
            </div>

            <div style="background: var(--color-alabaster); padding: 12px; border-radius: var(--radius-sm); font-size: 0.8rem; display: flex; justify-content: space-between;">
              <span>Deals: <strong>${agent.closed_deals_count}</strong></span>
              <span>2% Comm: <strong>${formatMoney(agent.total_commission_aed || 0)}</strong></span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// 7. Manage Properties & Projects Tab (CRUD)
async function renderAdminPropertiesManagerTab(container) {
  const [properties, projects] = await Promise.all([fetchProperties(), fetchOffPlan()]);

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
        <span class="section-subtitle">PORTFOLIO CONTROL</span>
        <h2 style="font-family: var(--font-heading); font-size: 2rem;">Manage Ready Properties & Off-Plan</h2>
      </div>
      <button class="btn btn-gold" onclick="openAddPropertyModal()">
        <i data-lucide="plus"></i> Add New Ready Property
      </button>
    </div>

    <!-- Properties Management Table -->
    <div class="admin-table-card mb-15">
      <h3 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 14px;">Ready Residences (${properties.length})</h3>
      <table class="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Title</th>
            <th>Community</th>
            <th>Type</th>
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${properties.map(p => `
            <tr>
              <td><img src="${p.image_url}" alt="${p.title}" style="width: 48px; height: 36px; object-fit: cover; border-radius: 2px;"></td>
              <td><strong>${p.title}</strong></td>
              <td>${p.community}</td>
              <td>${p.property_type}</td>
              <td><strong>${formatMoney(p.price_aed)}</strong></td>
              <td><span class="status-badge ${p.is_sold ? 'status-Won' : 'status-New'}">${p.status}</span></td>
              <td>
                <button class="btn btn-sm btn-outline-dark" onclick="openEditPropertyModal(${p.id})">Edit</button>
                <button class="btn btn-sm btn-outline-dark" style="color:#ef4444;" onclick="handleDeleteProperty(${p.id})">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ================= LEAD PROFILE DETAIL DRAWER / MODAL =================
async function openLeadDetailModal(leadId) {
  const lead = cachedLeads.find(l => l.id == leadId) || (await fetch(`/api/admin/leads`).then(r => r.json())).data.find(l => l.id == leadId);
  if (!lead) return;

  // Mark lead as read
  await fetch(`/api/admin/leads/${leadId}/notes`); // triggers read in db

  const notesRes = await fetch(`/api/admin/leads/${leadId}/notes`);
  const { data: notes } = await notesRes.json();

  const body = document.getElementById('leadDetailModalBody');
  const modal = document.getElementById('leadDetailModal');

  body.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
      <div>
        <span class="score-badge score-${lead.lead_rating}" style="font-size: 0.78rem; padding: 4px 12px; margin-bottom: 8px;">
          ${lead.lead_rating === 'HOT' ? '🔥 HOT' : (lead.lead_rating === 'WARM' ? '⚡ WARM' : '❄️ COLD')} • Lead Score: ${lead.lead_score}/100
        </span>
        <h2 style="font-family: var(--font-heading); font-size: 2.2rem; margin: 4px 0;">${lead.full_name}</h2>
        <span style="font-size: 0.8rem; color: var(--color-text-muted);">Source Form: <strong>${lead.source_form || 'VIP Form'}</strong> (${lead.source_page || 'Website'})</span>
      </div>
      <div style="text-align: right;">
        <span class="status-badge status-${lead.stage}" style="font-size: 0.82rem; padding: 6px 14px;">${lead.stage}</span>
      </div>
    </div>

    <!-- Quick Call & WhatsApp Action Buttons -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 28px;">
      <a href="https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(lead.full_name)},%20this%20is%20Jay%20Real%20Estate%20advisory%20desk." target="_blank" class="btn btn-gold" style="background: #25D366; color: #fff;">
        <i data-lucide="message-circle"></i> Chat on WhatsApp
      </a>
      <a href="tel:${lead.phone}" class="btn btn-outline-dark">
        <i data-lucide="phone"></i> Direct Call (${lead.phone})
      </a>
    </div>

    <!-- Lead Info Grid -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; background: var(--color-alabaster); padding: 20px; border-radius: var(--radius-sm); margin-bottom: 28px;">
      <div>
        <span style="font-size: 0.68rem; text-transform: uppercase; color: var(--color-text-muted); display: block;">Budget</span>
        <strong>${lead.budget_range || 'Flexible'}</strong>
      </div>
      <div>
        <span style="font-size: 0.68rem; text-transform: uppercase; color: var(--color-text-muted); display: block;">Buyer Liquidity</span>
        <strong>${lead.is_cash_buyer ? 'Cash Ready' : 'Financed / Mortgage'}</strong>
      </div>
      <div>
        <span style="font-size: 0.68rem; text-transform: uppercase; color: var(--color-text-muted); display: block;">Timeframe</span>
        <strong>${lead.buying_timeframe || '1-3 Months'}</strong>
      </div>
    </div>

    <!-- Change Stage & Assign Agent Controls -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px;">
      <div class="form-group">
        <label>Update Pipeline Stage</label>
        <select class="form-input" onchange="handleLeadStageChange(${lead.id}, this.value)">
          <option value="New" ${lead.stage === 'New' ? 'selected' : ''}>New</option>
          <option value="Contacted" ${lead.stage === 'Contacted' ? 'selected' : ''}>Contacted</option>
          <option value="Viewing" ${lead.stage === 'Viewing' ? 'selected' : ''}>Viewing</option>
          <option value="Offer" ${lead.stage === 'Offer' ? 'selected' : ''}>Offer</option>
          <option value="Won" ${lead.stage === 'Won' ? 'selected' : ''}>Won (Deal Closed)</option>
          <option value="Lost" ${lead.stage === 'Lost' ? 'selected' : ''}>Lost</option>
        </select>
      </div>

      <div class="form-group">
        <label>Assign Senior Agent</label>
        <select class="form-input" onchange="handleLeadAssignAgent(${lead.id}, this.value)">
          <option value="1" ${lead.assigned_agent_id == 1 ? 'selected' : ''}>Jayden Vance (Director)</option>
          <option value="2" ${lead.assigned_agent_id == 2 ? 'selected' : ''}>Sophia Laurent-Sterling</option>
          <option value="3" ${lead.assigned_agent_id == 3 ? 'selected' : ''}>Tariq Al-Hashemi</option>
        </select>
      </div>
    </div>

    <!-- Notes & Timeline -->
    <div style="margin-top: 24px;">
      <h3 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 12px;">Activity Notes & Intelligence</h3>
      
      <form onsubmit="handleLeadNoteSubmit(event, ${lead.id})">
        <div class="form-group">
          <textarea id="leadNewNote" class="form-input" rows="2" placeholder="Add confidential notes on client preferences, offer terms, or viewing feedback..." required></textarea>
        </div>
        <button type="submit" class="btn btn-gold btn-sm">Add Note</button>
      </form>

      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 20px;">
        ${notes.map(n => `
          <div style="background: var(--color-alabaster); padding: 14px; border-radius: var(--radius-sm); border-left: 3px solid var(--color-gold);">
            <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-bottom: 4px;">
              <strong>${n.author_name || 'Advisor'}</strong> • ${new Date(n.created_at).toLocaleString()}
            </div>
            <p style="font-size: 0.88rem; color: var(--color-charcoal-dark); margin: 0;">${n.content}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  modal.classList.add('active');
  if (window.lucide) lucide.createIcons();
}

function closeLeadDetailModal() {
  document.getElementById('leadDetailModal')?.classList.remove('active');
}

async function handleLeadStageChange(leadId, stage) {
  if (stage === 'Won') {
    closeLeadDetailModal();
    const lead = cachedLeads.find(l => l.id == leadId);
    openDealWonModal(lead);
    return;
  }
  await fetch(`/api/admin/leads/${leadId}/stage`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage })
  });
  showToast('Stage Updated', `Lead stage changed to ${stage}`);
  renderAdminArea(document.getElementById('appViewContainer'));
}

async function handleLeadAssignAgent(leadId, agentId) {
  await fetch(`/api/admin/leads/${leadId}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId })
  });
  showToast('Agent Assigned', 'Lead assigned successfully');
}

async function handleLeadNoteSubmit(e, leadId) {
  e.preventDefault();
  const content = document.getElementById('leadNewNote')?.value;
  await fetch(`/api/admin/leads/${leadId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, staffId: currentUser?.id || 1 })
  });
  showToast('Note Added', 'Client profile updated.');
  openLeadDetailModal(leadId);
}

// ================= DEAL WON / CLOSED SALE MODAL =================
function openDealWonModal(lead) {
  const modal = document.getElementById('dealWonModal');
  document.getElementById('dwLeadId').value = lead.id;
  document.getElementById('dwStaffId').value = lead.assigned_agent_id || 1;
  document.getElementById('dwPropTitle').value = lead.property_title || 'Luxury Palm Horizon Villa';
  document.getElementById('dealWonLeadName').textContent = `Buyer: ${lead.full_name} (${lead.phone})`;
  document.getElementById('dwSalePrice').value = '25000000';
  calculateDealCommission();

  modal.classList.add('active');
  if (window.lucide) lucide.createIcons();
}

function closeDealWonModal() {
  document.getElementById('dealWonModal')?.classList.remove('active');
}

function calculateDealCommission() {
  const price = parseFloat(document.getElementById('dwSalePrice')?.value) || 0;
  const comm = Math.round(price * 0.02); // 2% Commission
  document.getElementById('dwCommissionDisplay').textContent = `AED ${comm.toLocaleString()}`;
}

async function handleDealWonSubmit(e) {
  e.preventDefault();
  const leadId = document.getElementById('dwLeadId').value;
  const staffId = document.getElementById('dwStaffId').value;
  const propTitle = document.getElementById('dwPropTitle').value;
  const salePrice = document.getElementById('dwSalePrice').value;

  try {
    const res = await fetch(`/api/admin/leads/${leadId}/deal-won`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salePriceAED: salePrice,
        propertyTitle: propTitle,
        staffId
      })
    });
    const data = await res.json();
    closeDealWonModal();
    showToast('Deal Closed! 🎉', `Sale recorded: AED ${parseInt(salePrice).toLocaleString()}. 2% Commission (AED ${data.data.commissionAED.toLocaleString()}) credited to agent.`);
    renderAdminArea(document.getElementById('appViewContainer'));
  } catch (err) {
    showToast('Error', 'Could not record deal.');
  }
}

// ================= PROPERTY MANAGEMENT CRUD =================
function openAddPropertyModal() {
  const modal = document.getElementById('propertyManageModal');
  document.getElementById('propertyManageForm').reset();
  document.getElementById('pmPropId').value = '';
  document.getElementById('propManageModalTitle').textContent = 'Add Luxury Ready Property';
  modal.classList.add('active');
}

async function openEditPropertyModal(propId) {
  const prop = await fetchPropertyById(propId);
  if (!prop) return;

  const modal = document.getElementById('propertyManageModal');
  document.getElementById('pmPropId').value = prop.id;
  document.getElementById('pmTitle').value = prop.title;
  document.getElementById('pmCommunity').value = prop.community;
  document.getElementById('pmType').value = prop.property_type;
  document.getElementById('pmPrice').value = prop.price_aed;
  document.getElementById('pmBadge').value = prop.badge || '';
  document.getElementById('pmBeds').value = prop.bedrooms;
  document.getElementById('pmBaths').value = prop.bathrooms;
  document.getElementById('pmSqft').value = prop.sqft;
  document.getElementById('pmStatus').value = prop.status;
  document.getElementById('pmImageUrl').value = prop.image_url;
  document.getElementById('pmDesc').value = prop.description;
  document.getElementById('propManageModalTitle').textContent = 'Edit Luxury Residence';

  modal.classList.add('active');
}

function closePropertyManageModal() {
  document.getElementById('propertyManageModal')?.classList.remove('active');
}

async function handlePropertySave(e) {
  e.preventDefault();
  const id = document.getElementById('pmPropId').value;
  const propData = {
    title: document.getElementById('pmTitle').value,
    community: document.getElementById('pmCommunity').value,
    property_type: document.getElementById('pmType').value,
    price_aed: parseInt(document.getElementById('pmPrice').value, 10),
    badge: document.getElementById('pmBadge').value,
    bedrooms: parseInt(document.getElementById('pmBeds').value, 10),
    bathrooms: parseInt(document.getElementById('pmBaths').value, 10),
    sqft: parseInt(document.getElementById('pmSqft').value, 10),
    status: document.getElementById('pmStatus').value,
    image_url: document.getElementById('pmImageUrl').value || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
    description: document.getElementById('pmDesc').value
  };

  const url = id ? `/api/admin/properties/${id}` : `/api/admin/properties`;
  const method = id ? 'PUT' : 'POST';

  await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(propData)
  });

  closePropertyManageModal();
  showToast('Property Saved', 'Listing updated in portfolio.');
  renderAdminArea(document.getElementById('appViewContainer'));
}

async function handleDeleteProperty(id) {
  if (!confirm('Are you sure you want to remove this property?')) return;
  await fetch(`/api/admin/properties/${id}`, { method: 'DELETE' });
  showToast('Removed', 'Property removed from directory.');
  renderAdminArea(document.getElementById('appViewContainer'));
}

// ================= REAL-TIME NOTIFICATION BELL REFRESH =================
async function refreshUnreadBell() {
  try {
    const query = currentUser ? `?role=${currentUser.role}&userId=${currentUser.id}` : '';
    const res = await fetch(`/api/admin/leads/unread-count${query}`);
    const data = await res.json();
    unreadBellCount = data.count || 0;
    const badge = document.getElementById('adminBellBadge');
    if (badge) badge.textContent = unreadBellCount;
  } catch (err) {
    console.warn('Bell refresh error:', err);
  }
}

function startBellAutoRefresh() {
  if (bellRefreshTimer) clearInterval(bellRefreshTimer);
  // Auto-refresh every 60 seconds
  bellRefreshTimer = setInterval(refreshUnreadBell, 60000);
}

async function toggleBellDropdown() {
  const dd = document.getElementById('adminBellDropdown');
  if (!dd) return;
  dd.classList.toggle('active');

  if (dd.classList.contains('active')) {
    const list = document.getElementById('bellDropdownList');
    const query = currentUser ? `?role=${currentUser.role}&userId=${currentUser.id}` : '';
    const res = await fetch(`/api/admin/leads${query}`);
    const { data: leads } = await res.json();
    const unread = leads.filter(l => !l.is_read).slice(0, 5);

    if (unread.length === 0) {
      list.innerHTML = `<div style="padding: 16px; font-size: 0.8rem; color: var(--color-text-muted); text-align: center;">All caught up! No unread inquiries.</div>`;
    } else {
      list.innerHTML = unread.map(l => `
        <div class="bell-item" onclick="openLeadDetailModal(${l.id})">
          <div style="font-weight: 600; color: var(--color-charcoal-dark);">${l.full_name}</div>
          <div style="font-size: 0.72rem; color: var(--color-gold-dark);">${l.interest_type} • ${l.lead_rating}</div>
        </div>
      `).join('');
    }
  }
}

// ================= FORM SUBMISSION CORE (SAVING ALL FORMS AS LEADS) =================
async function submitLeadFromForm(leadData, showConfirmationModal = true) {
  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    });
    const data = await res.json();

    if (res.status === 429) {
      showToast('Rate Limit', data.message || 'Please wait before submitting again.');
      return false;
    }

    if (showConfirmationModal) {
      showThankYouModal(
        'Thank You',
        'Thank you. A Jay Real Estate advisor will contact you within 24 hours.'
      );
    }
    return true;
  } catch (err) {
    if (showConfirmationModal) {
      showThankYouModal(
        'Thank You',
        'Thank you. A Jay Real Estate advisor will contact you within 24 hours.'
      );
    }
    return true;
  }
}

// Form Handlers
async function handleRegisterSubmit(e) {
  e.preventDefault();
  const honeypot = e.target.querySelector('input[name="honeypot"]')?.value;
  if (honeypot) return;

  const fullName = document.getElementById('regFullName')?.value;
  const phone = document.getElementById('regPhone')?.value;
  const email = document.getElementById('regEmail')?.value;
  const country = document.getElementById('regCountry')?.value;
  const budget = document.getElementById('regBudget')?.value;
  const cash = document.getElementById('regCashBuyer')?.value === 'true';
  const timeframe = document.getElementById('regTimeframe')?.value;
  const message = document.getElementById('regMessage')?.value;

  closeRegisterModal();

  await submitLeadFromForm({
    full_name: fullName,
    phone,
    email,
    country,
    budget_range: budget,
    is_cash_buyer: cash,
    buying_timeframe: timeframe,
    interest_type: 'VIP Register Interest',
    source_form: 'Register Interest VIP Modal',
    source_page: window.location.hash || 'Home Page',
    message
  });
  e.target.reset();
}

async function handleCallbackSubmit(e) {
  e.preventDefault();
  const honeypot = e.target.querySelector('input[name="honeypot"]')?.value;
  if (honeypot) return;

  const fullName = document.getElementById('cbFullName')?.value;
  const phone = document.getElementById('cbPhone')?.value;
  const cash = document.getElementById('cbCashBuyer')?.value === 'true';
  const timeframe = document.getElementById('cbTimeframe')?.value;
  const topic = document.getElementById('cbInterest')?.value;

  closeCallbackModal();

  await submitLeadFromForm({
    full_name: fullName,
    phone,
    is_cash_buyer: cash,
    buying_timeframe: timeframe,
    interest_type: topic,
    source_form: 'Instant Callback Widget',
    source_page: window.location.hash || 'Home Page',
    message: `Immediate VIP Callback requested for topic: ${topic}`
  });
  e.target.reset();
}

async function handleInlineViewingSubmit(e, propId, propTitle) {
  e.preventDefault();
  const honeypot = e.target.querySelector('input[name="honeypot"]')?.value;
  if (honeypot) return;

  const fullName = document.getElementById('ivFullName')?.value;
  const phone = document.getElementById('ivPhone')?.value;
  const email = document.getElementById('ivEmail')?.value;
  const cash = document.getElementById('ivCash')?.value === 'true';
  const timeframe = document.getElementById('ivTimeframe')?.value;
  const date = document.getElementById('ivDate')?.value;
  const time = document.getElementById('ivTime')?.value;

  try {
    await fetch('/api/viewings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName,
        phone,
        email,
        property_id: propId,
        viewing_date: date,
        viewing_time: time,
        client_feedback: `Viewing requested for ${propTitle} on ${date} at ${time}`
      })
    });
  } catch (err) {
    console.warn('Viewing error:', err);
  }

  showThankYouModal('Thank You', 'Thank you. A Jay Real Estate advisor will contact you within 24 hours.');
  e.target.reset();
}

async function handleInlineEnquirySubmit(e, propId, propTitle) {
  e.preventDefault();
  const honeypot = e.target.querySelector('input[name="honeypot"]')?.value;
  if (honeypot) return;

  const fullName = document.getElementById('ieFullName')?.value;
  const phone = document.getElementById('iePhone')?.value;
  const message = document.getElementById('ieMessage')?.value;

  await submitLeadFromForm({
    full_name: fullName,
    phone,
    property_id: propId,
    interest_type: `Property Enquiry (${propTitle})`,
    source_form: 'Direct Property Enquiry Form',
    source_page: `Property: ${propTitle}`,
    message
  });
  e.target.reset();
}

async function handleBrochurePageSubmit(e, projId, projTitle) {
  e.preventDefault();
  const honeypot = e.target.querySelector('input[name="honeypot"]')?.value;
  if (honeypot) return;

  const fullName = document.getElementById('bpFullName')?.value;
  const phone = document.getElementById('bpPhone')?.value;
  const email = document.getElementById('bpEmail')?.value;
  const cash = document.getElementById('bpCash')?.value === 'true';
  const timeframe = document.getElementById('bpTimeframe')?.value;

  await submitLeadFromForm({
    full_name: fullName,
    phone,
    email,
    project_id: projId,
    is_cash_buyer: cash,
    buying_timeframe: timeframe,
    interest_type: `Brochure Download (${projTitle})`,
    source_form: 'Off-Plan Brochure Form',
    source_page: `Project: ${projTitle}`,
    message: `Downloaded brochure for ${projTitle}`
  });
  e.target.reset();
}

async function handleValuationSubmit(e) {
  e.preventDefault();
  const honeypot = e.target.querySelector('input[name="honeypot"]')?.value;
  if (honeypot) return;

  const name = document.getElementById('svName')?.value;
  const phone = document.getElementById('svPhone')?.value;
  const community = document.getElementById('svCommunity')?.value;
  const remarks = document.getElementById('svExpectedPrice')?.value;

  await submitLeadFromForm({
    full_name: name,
    phone,
    interest_type: `Property Valuation (${community})`,
    source_form: 'Sell Property Valuation Form',
    source_page: 'Sell Page',
    message: `Valuation request in ${community}. Remarks: ${remarks}`
  });
  e.target.reset();
}

async function handleMortgageAdvisorSubmit(e) {
  e.preventDefault();
  const honeypot = e.target.querySelector('input[name="honeypot"]')?.value;
  if (honeypot) return;

  const name = document.getElementById('maFullName')?.value;
  const phone = document.getElementById('maPhone')?.value;

  await submitLeadFromForm({
    full_name: name,
    phone,
    interest_type: 'Mortgage Pre-Approval Consultation',
    source_form: 'Mortgage Calculator Form',
    source_page: 'Calculator Page',
    message: 'Client requested mortgage consultation and pre-approval rates.'
  });
  e.target.reset();
}

async function handleContactPageSubmit(e) {
  e.preventDefault();
  const honeypot = e.target.querySelector('input[name="honeypot"]')?.value;
  if (honeypot) return;

  const name = document.getElementById('cpFullName')?.value;
  const phone = document.getElementById('cpPhone')?.value;
  const topic = document.getElementById('cpInterests')?.value;
  const msg = document.getElementById('cpMsg')?.value;

  await submitLeadFromForm({
    full_name: name,
    phone,
    interest_type: topic,
    source_form: 'Contact Desk Form',
    source_page: 'Contact Page',
    message: msg
  });
  e.target.reset();
}

// ================= MODAL HELPERS =================
function openRegisterModal(contextTitle) {
  const modal = document.getElementById('registerInterestModal');
  const contextEl = document.getElementById('registerModalContext');
  if (contextEl && contextTitle) contextEl.textContent = `Inquiring about: ${contextTitle}`;
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function closeRegisterModal() {
  const modal = document.getElementById('registerInterestModal');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
}

function openCallbackModal() {
  const modal = document.getElementById('callbackModal');
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function closeCallbackModal() {
  const modal = document.getElementById('callbackModal');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
}

function showThankYouModal(title, message) {
  const modal = document.getElementById('thankYouModal');
  const titleEl = document.getElementById('thankYouTitle');
  const msgEl = document.getElementById('thankYouMessage');
  const refEl = document.getElementById('thankYouRefCode');

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message || 'Thank you. A Jay Real Estate advisor will contact you within 24 hours.';
  if (refEl) refEl.textContent = generateRefCode();

  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function closeThankYouModal() {
  const modal = document.getElementById('thankYouModal');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
}

function openWhatsAppChat() {
  showToast(
    'Connecting to WhatsApp Concierge',
    'Opening direct private chat with Jay Real Estate VIP desk (+971 50 800 5291)...'
  );
  window.open('https://api.whatsapp.com/send?phone=971508005291&text=Hello%20Jay%20Real%20Estate,%20I%20am%20interested%20in%20luxury%20properties%20in%20Dubai.', '_blank');
}

function showToast(title, message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-item';
  toast.innerHTML = `
    <i data-lucide="check-circle-2"></i>
    <div>
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
  `;

  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

function closeMobileDrawer() {
  const drawer = document.getElementById('mobileDrawer');
  if (drawer) drawer.classList.remove('active');
}

// ================= APP INITIALIZATION =================
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([fetchProperties(), fetchOffPlan()]);

  window.addEventListener('hashchange', router);
  router();

  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    if (window.location.hash !== '#/' && window.location.hash !== '') {
      header.classList.add('solid-header');
    } else {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  });

  document.getElementById('currencySelector')?.addEventListener('change', (e) => {
    currentCurrency = e.target.value;
    router();
  });

  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');

  if (hamburgerBtn && mobileDrawer) {
    hamburgerBtn.addEventListener('click', () => mobileDrawer.classList.add('active'));
  }
  if (closeDrawerBtn && mobileDrawer) {
    closeDrawerBtn.addEventListener('click', () => mobileDrawer.classList.remove('active'));
  }

  if (window.lucide) {
    lucide.createIcons();
  }
});
