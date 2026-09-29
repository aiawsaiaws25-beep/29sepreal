/**
 * JAY REAL ESTATE — EXPRESS API SERVER & ADVANCED CRM BACKEND
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db/db');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= RATE LIMITING (ANTI-SPAM) =================
const submissionTracker = new Map();

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'client';
  const now = Date.now();
  const history = submissionTracker.get(ip) || [];

  // Filter out timestamps older than 60 seconds
  const recent = history.filter(ts => now - ts < 60000);

  if (recent.length >= 5) {
    return res.status(429).json({
      success: false,
      message: 'Too many submissions sent in a short time. Please wait a minute before submitting again.'
    });
  }

  recent.push(now);
  submissionTracker.set(ip, recent);
  next();
}

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// ================= AUTHENTICATION ROUTES =================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const user = await db.verifyStaffLogin(username.trim().toLowerCase(), password.trim());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your username and password.' });
    }

    res.json({
      success: true,
      user,
      message: `Welcome back, ${user.full_name}.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= PUBLIC READ ROUTES =================
app.get('/api/properties', async (req, res) => {
  try {
    const properties = await db.getProperties(req.query);
    res.json({ success: true, count: properties.length, data: properties });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/properties/:id', async (req, res) => {
  try {
    const property = await db.getPropertyBySlugOrId(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
    res.json({ success: true, data: property });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/off-plan', async (req, res) => {
  try {
    const projects = await db.getOffPlanProjects(req.query);
    res.json({ success: true, count: projects.length, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/off-plan/:id', async (req, res) => {
  try {
    const project = await db.getOffPlanBySlugOrId(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= PUBLIC SUBMISSION ROUTES (WITH ANTI-SPAM & HONEYPOT) =================
app.post('/api/leads', rateLimiter, async (req, res) => {
  try {
    const { full_name, phone, email, country, budget_range, interest_type, property_id, project_id, message, honeypot, is_cash_buyer, buying_timeframe, source_form, source_page } = req.body;

    // Honeypot check
    if (honeypot && honeypot.trim() !== '') {
      return res.status(400).json({ success: false, message: 'Spam detected' });
    }

    if (!full_name || !phone) {
      return res.status(400).json({ success: false, message: 'Full name and phone number are required' });
    }

    const lead = await db.addBuyerLead({
      full_name,
      phone,
      email,
      country,
      budget_range,
      interest_type: interest_type || 'General VIP Inquiry',
      property_id: property_id ? parseInt(property_id, 10) : null,
      project_id: project_id ? parseInt(project_id, 10) : null,
      is_cash_buyer: is_cash_buyer === true || is_cash_buyer === 'true',
      buying_timeframe: buying_timeframe || '1-3 months',
      source_form: source_form || 'Website VIP Form',
      source_page: source_page || 'Website',
      message
    });

    res.json({
      success: true,
      message: 'Thank you. A Jay Real Estate advisor will contact you within 24 hours.',
      leadId: lead.id,
      leadScore: lead.lead_score,
      leadRating: lead.lead_rating
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/viewings', rateLimiter, async (req, res) => {
  try {
    const { full_name, phone, email, property_id, viewing_date, viewing_time, client_feedback, honeypot } = req.body;

    if (honeypot && honeypot.trim() !== '') {
      return res.status(400).json({ success: false, message: 'Spam detected' });
    }

    if (!full_name || !phone || !property_id || !viewing_date) {
      return res.status(400).json({ success: false, message: 'Missing required fields for viewing reservation' });
    }

    const lead = await db.addBuyerLead({
      full_name,
      phone,
      email,
      interest_type: 'Viewing Reservation',
      property_id: parseInt(property_id, 10),
      source_form: 'Property Viewing Form',
      source_page: 'Property Page',
      message: `Viewing requested for ${viewing_date} at ${viewing_time || '11:00 AM'}`
    });

    const viewing = await db.addViewing({
      lead_id: lead.id,
      property_id: parseInt(property_id, 10),
      viewing_date,
      viewing_time: viewing_time || '11:00 AM',
      client_feedback
    });

    res.json({
      success: true,
      message: 'Thank you. A Jay Real Estate advisor will contact you within 24 hours.',
      viewingId: viewing.id
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= ADMIN CRM ENDPOINTS =================
app.get('/api/admin/stats', async (req, res) => {
  try {
    const userRole = req.query.role || 'admin';
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;
    const stats = await db.getAdminStats({ role: userRole, id: userId });
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/leads', async (req, res) => {
  try {
    const userRole = req.query.role || 'admin';
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;
    const leads = await db.getAdminLeads({ role: userRole, id: userId });
    res.json({ success: true, count: leads.length, data: leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/admin/leads/:id/stage', async (req, res) => {
  try {
    const { stage } = req.body;
    if (!stage) return res.status(400).json({ success: false, message: 'Stage is required' });
    const lead = await db.updateLeadStage(req.params.id, stage);
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/admin/leads/:id/assign', async (req, res) => {
  try {
    const { agentId } = req.body;
    if (!agentId) return res.status(400).json({ success: false, message: 'Agent ID is required' });
    const lead = await db.assignLeadAgent(req.params.id, agentId);
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/leads/:id/deal-won', async (req, res) => {
  try {
    const { salePriceAED, propertyTitle, staffId, community } = req.body;
    if (!salePriceAED) return res.status(400).json({ success: false, message: 'Sale price is required' });
    const result = await db.closeDealWon(req.params.id, salePriceAED, propertyTitle, staffId || 1, community || 'Dubai');
    res.json({
      success: true,
      message: 'Deal closed successfully! 2% commission recorded and property marked as sold.',
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/leads/:id/notes', async (req, res) => {
  try {
    const { content, staffId } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Content is required' });
    const note = await db.addLeadNote(req.params.id, staffId || 1, content);
    res.json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/leads/:id/notes', async (req, res) => {
  try {
    const notes = await db.getLeadNotes(req.params.id);
    res.json({ success: true, data: notes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/leads/unread-count', async (req, res) => {
  try {
    const userRole = req.query.role || 'admin';
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;
    const count = await db.getUnreadLeadsCount({ role: userRole, id: userId });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/leads/stale', async (req, res) => {
  try {
    const userRole = req.query.role || 'admin';
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;
    const stale = await db.getStaleLeads({ role: userRole, id: userId });
    res.json({ success: true, count: stale.length, data: stale });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CSV Export for Excel
app.get('/api/admin/leads/export-csv', async (req, res) => {
  try {
    const userRole = req.query.role || 'admin';
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;
    const leads = await db.getAdminLeads({ role: userRole, id: userId });

    const headers = ['ID', 'Client Name', 'Phone', 'Email', 'Country', 'Stage', 'Score', 'Rating', 'Cash Buyer', 'Timeframe', 'Budget', 'Interest', 'Source Form', 'Assigned Agent', 'Date Registered'];
    const rows = leads.map(l => [
      l.id,
      `"${(l.full_name || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.country || '').replace(/"/g, '""')}"`,
      l.stage,
      l.lead_score,
      l.lead_rating,
      l.is_cash_buyer ? 'YES' : 'NO',
      l.buying_timeframe,
      `"${(l.budget_range || '').replace(/"/g, '""')}"`,
      `"${(l.interest_type || '').replace(/"/g, '""')}"`,
      `"${(l.source_form || '').replace(/"/g, '""')}"`,
      `"${(l.agent_name || 'Advisor').replace(/"/g, '""')}"`,
      l.created_at
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="Jay_Real_Estate_Leads.csv"');
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/viewings', async (req, res) => {
  try {
    const userRole = req.query.role || 'admin';
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;
    const viewings = await db.getViewings({ role: userRole, id: userId });
    res.json({ success: true, count: viewings.length, data: viewings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/leaderboard', async (req, res) => {
  try {
    const leaderboard = await db.getAgentLeaderboard();
    res.json({ success: true, data: leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Property & Project CRUD
app.post('/api/admin/properties', async (req, res) => {
  try {
    const prop = await db.createProperty(req.body);
    res.json({ success: true, data: prop });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/properties/:id', async (req, res) => {
  try {
    const updated = await db.updateProperty(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/properties/:id', async (req, res) => {
  try {
    await db.deleteProperty(req.params.id);
    res.json({ success: true, message: 'Property removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/off-plan', async (req, res) => {
  try {
    const proj = await db.createOffPlanProject(req.body);
    res.json({ success: true, data: proj });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/off-plan/:id', async (req, res) => {
  try {
    await db.deleteOffPlanProject(req.params.id);
    res.json({ success: true, message: 'Project removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auto-initialize DB middleware
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await db.initDatabase();
      dbInitialized = true;
    } catch (err) {
      console.warn('DB init warning:', err.message);
    }
  }
  next();
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server locally if run directly
if (require.main === module) {
  db.initDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`\n=============================================================`);
      console.log(`✨ JAY REAL ESTATE LUXURY PORTAL & CRM RUNNING ON PORT ${PORT}`);
      console.log(`🌐 Open: http://localhost:${PORT}`);
      console.log(`=============================================================\n`);
    });
  });
}

module.exports = app;
