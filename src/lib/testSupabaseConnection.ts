
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local (or other .env files)
dotenv.config({ path: '.env.local' }); 
dotenv.config(); // Also load .env if it exists

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testSupabaseConnection() {
    console.log('Attempting to connect to Supabase...');
    console.log('Supabase URL:', supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'NOT FOUND'); // Log partial URL for security
    console.log('Supabase Anon Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'NOT FOUND'); // Log partial key for security

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Error: Supabase URL or Anon Key is missing. Please check your .env.local or environment variables.');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log('\nFetching a test record from the "profiles" table...');
    
    // Attempt to fetch the first profile to check read access
    // Replace 'profiles' with any public table you have if 'profiles' doesn't exist or isn't suitable
    const { data, error } = await supabase
        .from('profiles') // Using 'profiles' as it's commonly available and used in your app
        .select('*')
        .limit(1);

    if (error) {
        console.error('\n--- Supabase Connection Test FAILED ---');
        console.error('Error details:');
        console.error('  Message:', error.message);
        if (error.details) console.error('  Details:', error.details); // Keep any here if details can be non-string
        if ((error as { hint?: string }).hint) console.error('  Hint:', (error as { hint: string }).hint);
        if ((error as { code?: string }).code) console.error('  Code:', (error as { code: string }).code);
        
        if (error.message.includes('fetch failed') || error.message.includes('NetworkError')) {
            console.error('\nPossible Solutions for "Failed to fetch":');
            console.error('1. Check your internet connection.');
            console.error('2. Verify NEXT_PUBLIC_SUPABASE_URL in your .env.local or environment variables.');
            console.error('3. Ensure the Supabase project is running and accessible (not paused).');
            console.error('4. If running in an environment that restricts outbound connections, check firewall/network policies.');
        } else if (error.message.includes('Invalid API key') || error.message.includes('invalid JWT')) {
            console.error('\nPossible Solution for API key/JWT issues:');
            console.error('1. Verify NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local or environment variables.');
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
            console.error('\nPossible Solution for "relation does not exist":');
            console.error('1. Ensure the table (e.g., "profiles") exists in your Supabase database.');
            console.error('2. Check for typos in the table name used in the test script.');
        } else if (error.message.includes('permission denied')) {
            console.error('\nPossible Solution for "permission denied":');
            console.error('1. Check Row Level Security (RLS) policies for the table (e.g., "profiles").');
            console.error('   The anonymous key needs read access to at least one row for this test.');
        }

    } else {
        console.log('\n--- Supabase Connection Test SUCCESSFUL ---');
        if (data && data.length > 0) {
            console.log('Successfully fetched data (first record):', JSON.stringify(data[0], null, 2));
        } else {
            console.log('Query successful, but no data returned from the "profiles" table (or the table is empty).');
        }
    }
}

// Execute the test function
testSupabaseConnection().catch(e => {
    console.error('\n--- UNEXPECTED ERROR DURING TEST EXECUTION ---'); // Consider typing 'e' if possible, e.g., 'catch (e: Error)'
    console.error(e);
});
