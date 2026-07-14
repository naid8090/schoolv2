/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database and authentication
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export async function traceAuth(tableName: string): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("===== AUTH TRACE =====");
    console.log({
      sessionExists: !!session,
      accessTokenExists: !!session?.access_token,
      userId: user?.id,
      userEmail: user?.email,
      sessionUserId: session?.user?.id,
      jwtRole: session?.user?.role,
    });

    const { data, error } = await supabase.rpc("is_admin");

    console.log("===== RPC is_admin =====");
    console.log({
      data,
      error,
    });

    console.log("===== WRITE TARGET =====");
    console.log({
      table: tableName,
    });
  } catch (e) {
    console.error("Error during traceAuth:", e);
  }
}

export function normalizeRoutine(r: any): any {
  if (!r) return r;
  return {
    ...r,
    override_start: r.override_start === '' ? null : r.override_start,
    override_end: r.override_end === '' ? null : r.override_end,
  };
}

export function normalizeRoutines(routines: any[]): any[] {
  if (!routines) return [];
  return routines.map(normalizeRoutine);
}

export default supabase;
