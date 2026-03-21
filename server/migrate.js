const { Pool } = require('pg'); 
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_JFU1btE2rNWo@ep-damp-dew-a4zz3cjo-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' });

async function migrate() {
  try {
    const user = await pool.query('SELECT id FROM users ORDER BY created_at DESC LIMIT 1');
    if (user.rows[0]) {
      const result = await pool.query('UPDATE verifications SET user_id = $1 WHERE user_id IS NULL', [user.rows[0].id]);
      console.log(`Migrated ${result.rowCount} records to user ${user.rows[0].id}`);
    } else {
      console.log('No user found');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
migrate();
