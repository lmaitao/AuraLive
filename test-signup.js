import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nhehuqgaugbxqcdvxlmp.supabase.co',
  'sb_publishable_DyWETVXfAHwtc0-dForQOg_H00hKvDE'
);

async function testSignup() {
  console.log('Attempting to sign up new user...');
  const { data, error } = await supabase.auth.signUp({
    email: 'test_new_user123@auralive.com',
    password: 'Aura123456*'
  });

  if (error) {
    console.error('Signup error:', JSON.stringify(error, null, 2));
  } else {
    console.log('Signup successful! User ID:', data.user?.id);
  }
}

testSignup();
