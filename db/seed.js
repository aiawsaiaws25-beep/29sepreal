/**
 * JAY REAL ESTATE — DATABASE SEED RUNNER
 * Run: npm run seed
 */

require('dotenv').config();
const db = require('./db');

async function run() {
  console.log('🚀 Running Jay Real Estate database initialization...');
  await db.initDatabase();
  console.log('✨ Initialization completed.');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
