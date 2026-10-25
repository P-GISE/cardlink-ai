import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const getEnabledOAuthProviders = async (request = fetch) => {
  if (!isSupabaseConfigured) return [];
  try {
    const response = await request(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabaseAnonKey }
    });
    if (!response.ok) return [];
    const settings = await response.json();
    return ["google", "github"].filter((provider) => settings?.external?.[provider] === true);
  } catch {
    return [];
  }
};
