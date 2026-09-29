/**
 * JAY REAL ESTATE — ADVANCED DATABASE ADAPTER & CRM LOGIC
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const seedData = require('./seedData');

let pool = null;
let isPostgresConnected = false;

// In-memory data store
let inMemoryStore = {
  developers: JSON.parse(JSON.stringify(seedData.DEVELOPERS_DATA)),
  staff_logins: JSON.parse(JSON.stringify(seedData.STAFF_DATA)).map((s, idx) => ({ id: idx + 1, ...s })),
  off_plan_projects: JSON.parse(JSON.stringify(seedData.OFFPLAN_DATA)),
  properties: JSON.parse(JSON.stringify(seedData.PROPERTIES_DATA)),
  buyer_leads: JSON.parse(JSON.stringify(seedData.LEADS_DATA)),
  viewings: JSON.parse(JSON.stringify(seedData.VIEWINGS_DATA)),
  completed_sales: JSON.parse(JSON.stringify(seedData.SALES_DATA)),
  notes: [
    { id: 1, lead_id: 1, staff_id: 1, content: 'Client is flying in on Thursday with their family office advisor. Pre-approved for up to AED 60M.', created_at: '2026-09-29T10:30:00Z' },
    { id: 2, lead_id: 2, staff_id: 2, content: 'Requested twilight viewing to see the Burj Khalifa fountain and light show from the top terrace.', created_at: '2026-09-29T14:45:00Z' },
    { id: 3, lead_id: 3, staff_id: 1, content: 'Draft MOU submitted to Kuwait legal desk. Awaiting signoff.', created_at: '2026-09-28T11:00:00Z' }
  ]
};

async function initDatabase() {
  const dbUrl = process.env.DATABASE_URL?.trim();

  if (dbUrl && dbUrl.startsWith('postgres')) {
    try {
      console.log('⚡ Connecting to Neon PostgreSQL...');
      pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
      });

      await pool.query('SELECT NOW()');
      isPostgresConnected = true;
      console.log('✅ Connected successfully to Neon PostgreSQL database!');

      await applySchemaAndSeed();
    } catch (err) {
      console.warn('⚠️ Could not connect to Neon PostgreSQL:', err.message);
      console.log('🔄 Running in High-Speed In-Memory Database Mode.');
      isPostgresConnected = false;
    }
  } else {
    console.log('ℹ️ DATABASE_URL is not configured in .env. Running with embedded dataset.');
    isPostgresConnected = false;
  }
}

async function applySchemaAndSeed() {
  if (!pool) return;
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schemaSql);
    console.log('✅ Neon database schema verified.');

    const { rows: propCount } = await pool.query('SELECT count(*) FROM properties');
    if (parseInt(propCount[0].count, 10) === 0) {
      console.log('🌱 Seeding Neon PostgreSQL with sample CRM data...');
      await seedPostgresData();
      console.log('✨ Neon database seeded successfully!');
    }
  } catch (err) {
    console.error('❌ Error applying schema or seed:', err);
  }
}

async function seedPostgresData() {
  if (!pool) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Developers
    for (const dev of seedData.DEVELOPERS_DATA) {
      await client.query(
        `INSERT INTO developers (name, slug, founded_year, description, logo_badge, tier)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (slug) DO NOTHING`,
        [dev.name, dev.slug, dev.founded_year, dev.description, dev.logo_badge, dev.tier]
      );
    }

    // Staff Logins
    for (const staff of seedData.STAFF_DATA) {
      await client.query(
        `INSERT INTO staff_logins (username, password, full_name, role, phone, email, avatar_url, monthly_target_aed, deals_closed_count, commission_earned_aed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (username) DO NOTHING`,
        [staff.username, staff.password, staff.full_name, staff.role, staff.phone, staff.email, staff.avatar_url, staff.monthly_target_aed, staff.deals_closed_count, staff.commission_earned_aed]
      );
    }

    // Off-Plan Projects
    for (const offplan of seedData.OFFPLAN_DATA) {
      await client.query(
        `INSERT INTO off_plan_projects (slug, title, developer_id, location, handover_date, starting_price_aed, payment_plan, units_summary, image_url, gallery_urls, description, brochure_name, status, is_featured)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT (slug) DO NOTHING`,
        [
          offplan.slug, offplan.title, offplan.developer_id, offplan.location, offplan.handover_date,
          offplan.starting_price_aed, offplan.payment_plan, offplan.units_summary, offplan.image_url,
          JSON.stringify(offplan.gallery_urls), offplan.description, offplan.brochure_name, offplan.status || 'Active', offplan.is_featured
        ]
      );
    }

    // Properties
    for (const prop of seedData.PROPERTIES_DATA) {
      await client.query(
        `INSERT INTO properties (slug, title, community, property_type, status, price_aed, bedrooms, bathrooms, sqft, badge, image_url, gallery_urls, description, amenities, furnishing, parking_bays, is_sold, is_featured)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) ON CONFLICT (slug) DO NOTHING`,
        [
          prop.slug, prop.title, prop.community, prop.property_type, prop.status, prop.price_aed,
          prop.bedrooms, prop.bathrooms, prop.sqft, prop.badge, prop.image_url,
          JSON.stringify(prop.gallery_urls), prop.description, JSON.stringify(prop.amenities),
          prop.furnishing, prop.parking_bays, prop.is_sold || false, prop.is_featured
        ]
      );
    }

    // Leads
    for (const lead of seedData.LEADS_DATA) {
      await client.query(
        `INSERT INTO buyer_leads (full_name, phone, email, country, budget_range, interest_type, property_id, project_id, stage, lead_score, lead_rating, is_cash_buyer, buying_timeframe, source_form, source_page, assigned_agent_id, message, is_read, last_activity_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
        [
          lead.full_name, lead.phone, lead.email, lead.country, lead.budget_range, lead.interest_type,
          lead.property_id, lead.project_id || null, lead.stage, lead.lead_score, lead.lead_rating,
          lead.is_cash_buyer, lead.buying_timeframe, lead.source_form, lead.source_page,
          lead.assigned_agent_id, lead.message, lead.is_read, lead.last_activity_at
        ]
      );
    }

    // Viewings
    for (const viewing of seedData.VIEWINGS_DATA) {
      await client.query(
        `INSERT INTO viewings (lead_id, property_id, staff_id, viewing_date, viewing_time, status, client_feedback)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [viewing.lead_id, viewing.property_id, viewing.staff_id, viewing.viewing_date, viewing.viewing_time, viewing.status, viewing.client_feedback]
      );
    }

    // Sales
    for (const sale of seedData.SALES_DATA) {
      await client.query(
        `INSERT INTO completed_sales (property_title, community, sale_price_aed, buyer_name, staff_id, sale_date, commission_aed)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [sale.property_title, sale.community, sale.sale_price_aed, sale.buyer_name, sale.staff_id, sale.sale_date, sale.commission_aed]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ================= AUTH VERIFICATION =================
async function verifyStaffLogin(username, password) {
  if (isPostgresConnected && pool) {
    const { rows } = await pool.query(
      'SELECT id, username, full_name, role, phone, email, avatar_url, monthly_target_aed, deals_closed_count, commission_earned_aed FROM staff_logins WHERE username = $1 AND password = $2',
      [username, password]
    );
    return rows[0] || null;
  }

  const user = inMemoryStore.staff_logins.find(u => u.username === username && u.password === password);
  if (!user) return null;
  const { password: _, ...safeUser } = user;
  return safeUser;
}

// ================= LEADS & SCORING =================
async function addBuyerLead(leadData) {
  // Score lead automatically
  const { score, rating } = seedData.calculateLeadScore(leadData);
  const now = new Date().toISOString();

  if (isPostgresConnected && pool) {
    const { rows } = await pool.query(
      `INSERT INTO buyer_leads (full_name, phone, email, country, budget_range, interest_type, property_id, project_id, stage, lead_score, lead_rating, is_cash_buyer, buying_timeframe, source_form, source_page, assigned_agent_id, message, is_read, last_activity_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
      [
        leadData.full_name,
        leadData.phone,
        leadData.email || null,
        leadData.country || 'International',
        leadData.budget_range || 'AED 15M - 35M',
        leadData.interest_type || 'General Inquiry',
        leadData.property_id || null,
        leadData.project_id || null,
        'New',
        score,
        rating,
        leadData.is_cash_buyer || false,
        leadData.buying_timeframe || '1-3 months',
        leadData.source_form || 'Website VIP Form',
        leadData.source_page || 'Website',
        leadData.assigned_agent_id || 1,
        leadData.message || null,
        false, // unread for notification bell
        now
      ]
    );
    return rows[0];
  }

  const newId = inMemoryStore.buyer_leads.length + 1;
  const newLead = {
    id: newId,
    stage: 'New',
    lead_score: score,
    lead_rating: rating,
    is_cash_buyer: leadData.is_cash_buyer || false,
    buying_timeframe: leadData.buying_timeframe || '1-3 months',
    source_form: leadData.source_form || 'Website VIP Form',
    source_page: leadData.source_page || 'Website',
    assigned_agent_id: leadData.assigned_agent_id || 1,
    is_read: false,
    last_activity_at: now,
    created_at: now,
    ...leadData
  };
  inMemoryStore.buyer_leads.unshift(newLead);
  return newLead;
}

async function getAdminLeads(user = { role: 'admin' }) {
  if (isPostgresConnected && pool) {
    let query = `
      SELECT l.*, p.title as property_title, p.price_aed as property_price, o.title as project_title, s.full_name as agent_name
      FROM buyer_leads l
      LEFT JOIN properties p ON l.property_id = p.id
      LEFT JOIN off_plan_projects o ON l.project_id = o.id
      LEFT JOIN staff_logins s ON l.assigned_agent_id = s.id
    `;
    const params = [];
    if (user.role !== 'admin' && user.id) {
      params.push(user.id);
      query += ` WHERE l.assigned_agent_id = $${params.length}`;
    }
    query += ' ORDER BY l.id DESC';
    const { rows } = await pool.query(query, params);
    return rows;
  }

  let list = inMemoryStore.buyer_leads.map(l => {
    const prop = inMemoryStore.properties.find(p => p.id == l.property_id);
    const proj = inMemoryStore.off_plan_projects.find(o => o.id == l.project_id);
    const staff = inMemoryStore.staff_logins.find(s => s.id == l.assigned_agent_id);
    return {
      ...l,
      property_title: prop?.title,
      property_price: prop?.price_aed,
      project_title: proj?.title,
      agent_name: staff?.full_name
    };
  });

  if (user.role !== 'admin' && user.id) {
    list = list.filter(l => l.assigned_agent_id === user.id);
  }
  return list;
}

async function updateLeadStage(leadId, newStage) {
  const now = new Date().toISOString();
  if (isPostgresConnected && pool) {
    const { rows } = await pool.query(
      'UPDATE buyer_leads SET stage = $1, last_activity_at = $2 WHERE id = $3 RETURNING *',
      [newStage, now, leadId]
    );
    return rows[0];
  }

  const lead = inMemoryStore.buyer_leads.find(l => l.id == leadId);
  if (lead) {
    lead.stage = newStage;
    lead.last_activity_at = now;
    return lead;
  }
  return null;
}

async function assignLeadAgent(leadId, agentId) {
  const now = new Date().toISOString();
  if (isPostgresConnected && pool) {
    const { rows } = await pool.query(
      'UPDATE buyer_leads SET assigned_agent_id = $1, last_activity_at = $2 WHERE id = $3 RETURNING *',
      [agentId, now, leadId]
    );
    return rows[0];
  }
  const lead = inMemoryStore.buyer_leads.find(l => l.id == leadId);
  if (lead) {
    lead.assigned_agent_id = parseInt(agentId, 10);
    lead.last_activity_at = now;
    return lead;
  }
  return null;
}

async function markLeadAsRead(leadId) {
  if (isPostgresConnected && pool) {
    await pool.query('UPDATE buyer_leads SET is_read = true WHERE id = $1', [leadId]);
  } else {
    const lead = inMemoryStore.buyer_leads.find(l => l.id == leadId);
    if (lead) lead.is_read = true;
  }
}

async function getUnreadLeadsCount(user = { role: 'admin' }) {
  if (isPostgresConnected && pool) {
    let query = 'SELECT count(*) FROM buyer_leads WHERE is_read = false';
    const params = [];
    if (user.role !== 'admin' && user.id) {
      params.push(user.id);
      query += ` AND assigned_agent_id = $${params.length}`;
    }
    const { rows } = await pool.query(query, params);
    return parseInt(rows[0].count, 10);
  }

  let list = inMemoryStore.buyer_leads.filter(l => !l.is_read);
  if (user.role !== 'admin' && user.id) {
    list = list.filter(l => l.assigned_agent_id === user.id);
  }
  return list.length;
}

async function getStaleLeads(user = { role: 'admin' }) {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const leads = await getAdminLeads(user);
  return leads.filter(l => l.stage !== 'Won' && l.stage !== 'Lost' && new Date(l.last_activity_at) < new Date(threeDaysAgo));
}

// ================= CLOSE DEAL (WON) WITH 2% COMMISSION =================
async function closeDealWon(leadId, salePriceAED, propertyTitle, staffId, community = 'Dubai') {
  const price = parseInt(salePriceAED, 10);
  const commission = Math.round(price * 0.02); // 2% Commission
  const today = new Date().toISOString().split('T')[0];

  // Update lead stage
  await updateLeadStage(leadId, 'Won');

  // Record completed sale
  let saleRecord = null;
  if (isPostgresConnected && pool) {
    const { rows } = await pool.query(
      `INSERT INTO completed_sales (lead_id, property_title, community, sale_price_aed, buyer_name, staff_id, sale_date, commission_aed)
       VALUES ($1, $2, $3, $4, (SELECT full_name FROM buyer_leads WHERE id = $1), $5, $6, $7) RETURNING *`,
      [leadId, propertyTitle, community, price, staffId, today, commission]
    );
    saleRecord = rows[0];

    // Mark matching property as sold if exists
    await pool.query(
      'UPDATE properties SET is_sold = true, status = $1, sold_price_aed = $2, sold_date = NOW() WHERE title ILIKE $3',
      ['Sold', price, `%${propertyTitle}%`]
    );

    // Update staff deals & commission
    await pool.query(
      'UPDATE staff_logins SET deals_closed_count = deals_closed_count + 1, commission_earned_aed = commission_earned_aed + $1 WHERE id = $2',
      [commission, staffId]
    );
  } else {
    const lead = inMemoryStore.buyer_leads.find(l => l.id == leadId);
    saleRecord = {
      id: inMemoryStore.completed_sales.length + 1,
      lead_id: leadId,
      property_title: propertyTitle,
      community: community,
      sale_price_aed: price,
      buyer_name: lead?.full_name || 'Client',
      staff_id: staffId,
      sale_date: today,
      commission_aed: commission,
      created_at: new Date().toISOString()
    };
    inMemoryStore.completed_sales.unshift(saleRecord);

    // Mark property as sold in memory
    const prop = inMemoryStore.properties.find(p => p.title.toLowerCase().includes(propertyTitle.toLowerCase()) || p.id === lead?.property_id);
    if (prop) {
      prop.is_sold = true;
      prop.status = 'Sold';
      prop.sold_price_aed = price;
    }

    // Update staff metrics
    const staff = inMemoryStore.staff_logins.find(s => s.id == staffId);
    if (staff) {
      staff.deals_closed_count = (staff.deals_closed_count || 0) + 1;
      staff.commission_earned_aed = (staff.commission_earned_aed || 0) + commission;
    }
  }

  return { sale: saleRecord, commissionAED: commission };
}

// ================= NOTES CRUD =================
async function addLeadNote(leadId, staffId, content) {
  const now = new Date().toISOString();
  if (isPostgresConnected && pool) {
    const { rows } = await pool.query(
      'INSERT INTO notes (lead_id, staff_id, content) VALUES ($1, $2, $3) RETURNING *',
      [leadId, staffId, content]
    );
    await pool.query('UPDATE buyer_leads SET last_activity_at = $1 WHERE id = $2', [now, leadId]);
    return rows[0];
  }

  const newNote = {
    id: inMemoryStore.notes.length + 1,
    lead_id: parseInt(leadId, 10),
    staff_id: parseInt(staffId, 10),
    content,
    created_at: now
  };
  inMemoryStore.notes.unshift(newNote);
  const lead = inMemoryStore.buyer_leads.find(l => l.id == leadId);
  if (lead) lead.last_activity_at = now;
  return newNote;
}

async function getLeadNotes(leadId) {
  if (isPostgresConnected && pool) {
    const { rows } = await pool.query(
      `SELECT n.*, s.full_name as author_name FROM notes n LEFT JOIN staff_logins s ON n.staff_id = s.id WHERE n.lead_id = $1 ORDER BY n.id DESC`,
      [leadId]
    );
    return rows;
  }
  return inMemoryStore.notes.filter(n => n.lead_id == leadId).map(n => {
    const staff = inMemoryStore.staff_logins.find(s => s.id == n.staff_id);
    return { ...n, author_name: staff?.full_name || 'Advisor' };
  });
}

// ================= PROPERTY MANAGEMENT CRUD =================
async function getProperties(filters = {}) {
  if (isPostgresConnected && pool) {
    let query = 'SELECT * FROM properties WHERE 1=1';
    const params = [];
    if (filters.community && filters.community !== 'all') {
      params.push(filters.community);
      query += ` AND community ILIKE $${params.length}`;
    }
    if (filters.property_type && filters.property_type !== 'all') {
      params.push(filters.property_type);
      query += ` AND property_type ILIKE $${params.length}`;
    }
    if (filters.featured === 'true' || filters.featured === true) {
      query += ' AND is_featured = true';
    }
    query += ' ORDER BY is_sold ASC, price_aed DESC';
    const { rows } = await pool.query(query, params);
    return rows;
  }

  let list = inMemoryStore.properties;
  if (filters.community && filters.community !== 'all') {
    list = list.filter(p => p.community.toLowerCase().includes(filters.community.toLowerCase()));
  }
  if (filters.property_type && filters.property_type !== 'all') {
    list = list.filter(p => p.property_type.toLowerCase() === filters.property_type.toLowerCase());
  }
  if (filters.featured === 'true' || filters.featured === true) {
    list = list.filter(p => p.is_featured);
  }
  return list;
}

async function getPropertyBySlugOrId(id) {
  if (isPostgresConnected && pool) {
    const isNum = !isNaN(id);
    const query = isNum ? 'SELECT * FROM properties WHERE id = $1' : 'SELECT * FROM properties WHERE slug = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }
  return inMemoryStore.properties.find(p => p.id == id || p.slug === id) || null;
}

async function createProperty(propData) {
  const slug = propData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (isPostgresConnected && pool) {
    const { rows } = await pool.query(
      `INSERT INTO properties (slug, title, community, property_type, status, price_aed, bedrooms, bathrooms, sqft, badge, image_url, gallery_urls, description, amenities, furnishing, parking_bays, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [
        slug, propData.title, propData.community, propData.property_type, propData.status || 'Ready to Move',
        propData.price_aed, propData.bedrooms, propData.bathrooms, propData.sqft, propData.badge || 'New Listing',
        propData.image_url || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
        JSON.stringify(propData.gallery_urls || [propData.image_url]), propData.description,
        JSON.stringify(propData.amenities || ['Luxury Finishes']), propData.furnishing || 'Designer Furnished',
        propData.parking_bays || 2, propData.is_featured ?? true
      ]
    );
    return rows[0];
  }

  const newProp = {
    id: inMemoryStore.properties.length + 1,
    slug,
    is_sold: false,
    ...propData
  };
  inMemoryStore.properties.unshift(newProp);
  return newProp;
}

async function updateProperty(propId, updates) {
  if (isPostgresConnected && pool) {
    const fields = [];
    const values = [];
    Object.keys(updates).forEach((k, idx) => {
      fields.push(`${k} = $${idx + 1}`);
      values.push(k === 'gallery_urls' || k === 'amenities' ? JSON.stringify(updates[k]) : updates[k]);
    });
    values.push(propId);
    const { rows } = await pool.query(
      `UPDATE properties SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    return rows[0];
  }

  const prop = inMemoryStore.properties.find(p => p.id == propId);
  if (prop) {
    Object.assign(prop, updates);
    return prop;
  }
  return null;
}

async function deleteProperty(propId) {
  if (isPostgresConnected && pool) {
    await pool.query('DELETE FROM properties WHERE id = $1', [propId]);
    return true;
  }
  const idx = inMemoryStore.properties.findIndex(p => p.id == propId);
  if (idx !== -1) {
    inMemoryStore.properties.splice(idx, 1);
    return true;
  }
  return false;
}

// ================= OFF-PLAN PROJECT CRUD =================
async function getOffPlanProjects() {
  if (isPostgresConnected && pool) {
    const { rows } = await pool.query(
      `SELECT o.*, d.name as developer_name FROM off_plan_projects o LEFT JOIN developers d ON o.developer_id = d.id ORDER BY o.id ASC`
    );
    return rows;
  }
  return inMemoryStore.off_plan_projects.map(o => {
    const dev = inMemoryStore.developers.find(d => d.id === o.developer_id);
    return { ...o, developer_name: dev?.name || 'Aura Prestige' };
  });
}

async function getOffPlanBySlugOrId(id) {
  if (isPostgresConnected && pool) {
    const isNum = !isNaN(id);
    const query = isNum ? 'SELECT * FROM off_plan_projects WHERE id = $1' : 'SELECT * FROM off_plan_projects WHERE slug = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }
  return inMemoryStore.off_plan_projects.find(o => o.id == id || o.slug === id) || null;
}

async function createOffPlanProject(projData) {
  const slug = projData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (isPostgresConnected && pool) {
    const { rows } = await pool.query(
      `INSERT INTO off_plan_projects (slug, title, developer_id, location, handover_date, starting_price_aed, payment_plan, units_summary, image_url, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        slug, projData.title, projData.developer_id || 1, projData.location, projData.handover_date,
        projData.starting_price_aed, projData.payment_plan, projData.units_summary,
        projData.image_url || 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1200&q=80',
        projData.description, projData.status || 'Active'
      ]
    );
    return rows[0];
  }

  const newProj = {
    id: inMemoryStore.off_plan_projects.length + 1,
    slug,
    ...projData
  };
  inMemoryStore.off_plan_projects.unshift(newProj);
  return newProj;
}

async function deleteOffPlanProject(projId) {
  if (isPostgresConnected && pool) {
    await pool.query('DELETE FROM off_plan_projects WHERE id = $1', [projId]);
    return true;
  }
  const idx = inMemoryStore.off_plan_projects.findIndex(o => o.id == projId);
  if (idx !== -1) {
    inMemoryStore.off_plan_projects.splice(idx, 1);
    return true;
  }
  return false;
}

// ================= VIEWINGS & LEADERBOARD =================
async function getViewings(user = { role: 'admin' }) {
  if (isPostgresConnected && pool) {
    let query = `
      SELECT v.*, l.full_name as client_name, l.phone as client_phone, l.email as client_email,
             p.title as property_title, p.community as property_community, s.full_name as agent_name
      FROM viewings v
      LEFT JOIN buyer_leads l ON v.lead_id = l.id
      LEFT JOIN properties p ON v.property_id = p.id
      LEFT JOIN staff_logins s ON v.staff_id = s.id
    `;
    const params = [];
    if (user.role !== 'admin' && user.id) {
      params.push(user.id);
      query += ` WHERE v.staff_id = $${params.length}`;
    }
    query += ' ORDER BY v.viewing_date DESC, v.id DESC';
    const { rows } = await pool.query(query, params);
    return rows;
  }

  let list = inMemoryStore.viewings.map(v => {
    const lead = inMemoryStore.buyer_leads.find(l => l.id == v.lead_id);
    const prop = inMemoryStore.properties.find(p => p.id == v.property_id);
    const staff = inMemoryStore.staff_logins.find(s => s.id == v.staff_id);
    return {
      ...v,
      client_name: lead?.full_name || 'Client',
      client_phone: lead?.phone,
      client_email: lead?.email,
      property_title: prop?.title || 'Luxury Residence',
      property_community: prop?.community || 'Dubai',
      agent_name: staff?.full_name || 'Advisor'
    };
  });

  if (user.role !== 'admin' && user.id) {
    list = list.filter(v => v.staff_id === user.id);
  }
  return list;
}

async function addViewing(viewingData) {
  const now = new Date().toISOString();
  if (isPostgresConnected && pool) {
    const { rows } = await pool.query(
      `INSERT INTO viewings (lead_id, property_id, staff_id, viewing_date, viewing_time, status, client_feedback)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [viewingData.lead_id, viewingData.property_id, viewingData.staff_id || 1, viewingData.viewing_date, viewingData.viewing_time, 'Confirmed', viewingData.client_feedback]
    );
    await pool.query('UPDATE buyer_leads SET stage = $1, last_activity_at = $2 WHERE id = $3', ['Viewing', now, viewingData.lead_id]);
    return rows[0];
  }

  const newViewing = {
    id: inMemoryStore.viewings.length + 1,
    status: 'Confirmed',
    created_at: now,
    ...viewingData
  };
  inMemoryStore.viewings.unshift(newViewing);
  const lead = inMemoryStore.buyer_leads.find(l => l.id == viewingData.lead_id);
  if (lead) {
    lead.stage = 'Viewing';
    lead.last_activity_at = now;
  }
  return newViewing;
}

async function getAgentLeaderboard() {
  if (isPostgresConnected && pool) {
    const { rows } = await pool.query(`
      SELECT s.id, s.full_name, s.role, s.phone, s.email, s.avatar_url, s.monthly_target_aed,
             COALESCE(COUNT(cs.id), s.deals_closed_count) as closed_deals_count,
             COALESCE(SUM(cs.sale_price_aed), 0) as total_sales_volume_aed,
             COALESCE(SUM(cs.commission_aed), s.commission_earned_aed) as total_commission_aed
      FROM staff_logins s
      LEFT JOIN completed_sales cs ON s.id = cs.staff_id
      GROUP BY s.id
      ORDER BY total_sales_volume_aed DESC
    `);
    return rows;
  }

  return inMemoryStore.staff_logins.map(s => {
    const sales = inMemoryStore.completed_sales.filter(cs => cs.staff_id == s.id);
    const volume = sales.reduce((sum, cs) => sum + cs.sale_price_aed, 0);
    const comm = sales.reduce((sum, cs) => sum + cs.commission_aed, 0);
    return {
      ...s,
      closed_deals_count: sales.length || s.deals_closed_count,
      total_sales_volume_aed: volume,
      total_commission_aed: comm || s.commission_earned_aed
    };
  }).sort((a, b) => b.total_sales_volume_aed - a.total_sales_volume_aed);
}

// ================= ADMIN STATS & CHARTS =================
async function getAdminStats(user = { role: 'admin' }) {
  const leads = await getAdminLeads(user);
  const viewings = await getViewings(user);
  const leaderboard = await getAgentLeaderboard();

  // Active deal pipeline value (Leads in Viewing or Offer stages)
  const activeLeads = leads.filter(l => l.stage === 'Viewing' || l.stage === 'Offer');
  const pipelineValue = activeLeads.reduce((sum, l) => sum + (l.property_price || 20000000), 0);

  // Completed sales
  let sales = inMemoryStore.completed_sales;
  if (isPostgresConnected && pool) {
    const { rows } = await pool.query('SELECT * FROM completed_sales');
    sales = rows;
  }
  if (user.role !== 'admin' && user.id) {
    sales = sales.filter(s => s.staff_id === user.id);
  }

  const totalVolume = sales.reduce((sum, s) => sum + parseInt(s.sale_price_aed, 10), 0);
  const totalCommission = sales.reduce((sum, s) => sum + parseInt(s.commission_aed, 10), 0);

  // Leads created today
  const todayStr = new Date().toISOString().split('T')[0];
  const leadsToday = leads.filter(l => l.created_at && l.created_at.startsWith(todayStr)).length || Math.min(leads.length, 4);

  // Pipeline stage breakdown for charts
  const stageCounts = {
    New: leads.filter(l => l.stage === 'New').length,
    Contacted: leads.filter(l => l.stage === 'Contacted').length,
    Viewing: leads.filter(l => l.stage === 'Viewing').length,
    Offer: leads.filter(l => l.stage === 'Offer').length,
    Won: leads.filter(l => l.stage === 'Won').length,
    Lost: leads.filter(l => l.stage === 'Lost').length
  };

  // Lead ratings breakdown
  const ratingCounts = {
    HOT: leads.filter(l => l.lead_rating === 'HOT').length,
    WARM: leads.filter(l => l.lead_rating === 'WARM').length,
    COLD: leads.filter(l => l.lead_rating === 'COLD').length
  };

  return {
    leadsToday,
    totalLeadsCount: leads.length,
    pipelineValueAED: pipelineValue,
    viewingsThisWeek: viewings.length,
    totalSalesCount: sales.length,
    totalVolumeAED: totalVolume,
    totalCommissionAED: totalCommission,
    stageCounts,
    ratingCounts,
    leaderboard
  };
}

module.exports = {
  initDatabase,
  verifyStaffLogin,
  getProperties,
  getPropertyBySlugOrId,
  createProperty,
  updateProperty,
  deleteProperty,
  getOffPlanProjects,
  getOffPlanBySlugOrId,
  createOffPlanProject,
  deleteOffPlanProject,
  addBuyerLead,
  getAdminLeads,
  updateLeadStage,
  assignLeadAgent,
  markLeadAsRead,
  getUnreadLeadsCount,
  getStaleLeads,
  closeDealWon,
  addLeadNote,
  getLeadNotes,
  getViewings,
  addViewing,
  getAgentLeaderboard,
  getAdminStats,
  isPostgresConnected: () => isPostgresConnected
};
