/**
 * Apply database migration to Supabase
 * Run with: node scripts/apply-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Starting database migration...\n');

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20241211000001_initial_schema.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 Read migration file: 20241211000001_initial_schema.sql');
  console.log(`📏 SQL size: ${(sql.length / 1024).toFixed(2)} KB\n`);

  try {
    // Split SQL into individual statements
    // Note: This is a simple split and may not handle all edge cases
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip empty statements and comments
      if (statement.trim() === ';' || statement.startsWith('--')) {
        continue;
      }

      // Get statement preview
      const preview = statement.split('\n')[0].substring(0, 80);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // Check if error is benign (already exists, etc.)
          const benignErrors = [
            'already exists',
            'duplicate key',
            'relation "public.users" already exists'
          ];

          const isBenign = benignErrors.some(msg =>
            error.message?.toLowerCase().includes(msg.toLowerCase())
          );

          if (isBenign) {
            console.log(`⚠️  [${i + 1}/${statements.length}] Skipped (already exists): ${preview}...`);
            successCount++;
          } else {
            console.error(`❌ [${i + 1}/${statements.length}] Error: ${error.message}`);
            console.error(`   Statement: ${preview}...`);
            errorCount++;
          }
        } else {
          console.log(`✅ [${i + 1}/${statements.length}] Success: ${preview}...`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ [${i + 1}/${statements.length}] Exception: ${err.message}`);
        console.error(`   Statement: ${preview}...`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(60) + '\n');

    if (errorCount === 0) {
      console.log('🎉 Migration completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('   1. Update .env.local: NEXT_PUBLIC_USE_MOCKS=false');
      console.log('   2. Restart your development server');
      console.log('   3. Test the customer portal pages\n');
    } else {
      console.log('⚠️  Migration completed with errors. Please review above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exit(1);
  }
}

// Note: Supabase doesn't have a built-in exec_sql RPC by default
// We'll need to use the SQL editor or direct database connection
console.log('⚠️  Note: This script requires manual SQL execution.');
console.log('Please follow these steps instead:\n');
console.log('1. Go to Supabase Dashboard → SQL Editor');
console.log('2. Copy the contents of: supabase/migrations/20241211000001_initial_schema.sql');
console.log('3. Paste and run the SQL in the editor');
console.log('4. Update .env.local: NEXT_PUBLIC_USE_MOCKS=false');
console.log('5. Restart your development server\n');
console.log('Migration file location:');
console.log('   ' + path.join(__dirname, '../supabase/migrations/20241211000001_initial_schema.sql') + '\n');
