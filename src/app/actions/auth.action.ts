'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự'),
});

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const validated = loginSchema.safeParse({ email, password });
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // TEST: Manual cookie set to verify if headers work
  const { cookies } = await import('next/headers');
  cookies().set('test-cookie-manual', 'works', { path: '/', secure: false });
  console.log('🧪 [AUTH_LOGIN] Test cookie set manually.');

  if (error) {
    console.error(`❌ [AUTH_LOGIN] Failed for ${email}: ${error.message}`);
    return { error: 'Đăng nhập thất bại: ' + error.message };
  }

  console.log(`✅ [AUTH_LOGIN] Success for ${email}`);
  return { success: true };
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
