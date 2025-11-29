
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = '';
const supabaseAnonKey = '';

console.log('Initializing Supabase client with empty credentials...');
try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Client initialized.');

    console.log('Attempting to get session...');
    supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
            console.error('Error getting session:', error);
        } else {
            console.log('Session retrieved:', data);
        }
    }).catch(err => {
        console.error('Exception getting session:', err);
    });

} catch (err) {
    console.error('Exception initializing client:', err);
}
