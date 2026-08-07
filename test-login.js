import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nhehuqgaugbxqcdvxlmp.supabase.co',
  'sb_publishable_DyWETVXfAHwtc0-dForQOg_H00hKvDE'
);

async function testLogin() {
  console.log('Attempting to log in as hombre@auralive.com...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'hombre@auralive.com',
    password: 'Aura123456*'
  });

  if (error) {
    console.error('Login error:', JSON.stringify(error, null, 2));
  } else {
    console.log('Login successful! User ID:', data.user?.id);
  }
}

testLogin();
