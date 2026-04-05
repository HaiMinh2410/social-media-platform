import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/infrastructure/config/env-registry";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const cookieStore = cookies();

    const response = NextResponse.json({ success: true });

    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              if (!Array.isArray(cookiesToSet) || cookiesToSet.length === 0) {
                console.log('📡 [API_AUTH] No cookies to set in this call.');
                return;
              }

              console.log(`📡 [API_AUTH] Setting ${cookiesToSet.length} cookies: ${cookiesToSet.map(c => c.name).join(', ')}`);
              
              cookiesToSet.forEach(({ name, value, options }) => {
                // 1. Set on global store (for same-request visibility)
                cookieStore.set(name, value, { ...options, path: '/' });

                // 2. Set on local response object (for the browser)
                response.cookies.set(name, value, { 
                  ...options, 
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
                  path: '/'
                });
              });
            } catch (err: any) {
              console.error('⚠️ [API_AUTH] setAll failed runtime:', err.message);
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
       console.error(`❌ [API_AUTH] Login failed: ${error.message}`);
       return NextResponse.json(
         { error: error.message }, 
         { 
           status: 401,
           headers: response.headers 
         }
       );
    }

    console.log(`✅ [API_AUTH] Login successful for ${email}`);
    return response;
  } catch (err: any) {
    console.error(`❌ [API_AUTH] System error:`, err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
