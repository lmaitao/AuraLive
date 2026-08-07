import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Faltan las variables de entorno de Supabase.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const testUsers = [
  {
    email: 'usuario@auralive.com',
    password: 'Aura123456*',
    data: { full_name: 'Carlos Estándar', username: 'carlos_user', gender: 'male', phone_number: '+1234567890' }
  },
  {
    email: 'presentadora@auralive.com',
    password: 'Aura123456*',
    data: { full_name: 'Sofia Streamer', username: 'sofia_live', gender: 'female', phone_number: '+1234567891' }
  },
  {
    email: 'agencia@auralive.com',
    password: 'Aura123456*',
    data: { full_name: 'Agencia Master', username: 'agencia_master', gender: 'male', phone_number: '+1234567892' }
  },
  {
    email: 'admin@auralive.com',
    password: 'Aura123456*',
    data: { full_name: 'SuperAdmin Aura', username: 'aura_admin', gender: 'female', phone_number: '+1234567893' }
  }
];

async function seedAuthUsers() {
  console.log('Iniciando registro de usuarios de prueba...');

  for (const user of testUsers) {
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: user.data
      }
    });

    if (error) {
      console.error(`❌ Error registrando a ${user.email}:`, error.message);
    } else {
      console.log(`✅ Registrado exitosamente: ${user.email} (ID: ${data.user?.id})`);
    }
  }

  console.log('--- Proceso de registro finalizado ---');
  console.log('IMPORTANTE: Ahora debes ir al SQL Editor de Supabase y ejecutar el script `scripts/set_roles.sql` para asignarles los permisos correctos (SuperAdmin, Streamer, Agencia) y los datos de prueba.');
}

seedAuthUsers();
