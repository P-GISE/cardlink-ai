import { createClient } from "@supabase/supabase-js";
import { createLocalSupabaseAuthClient, createLocalSupabaseServiceClient } from "./localSupabase.js";

export const createSupabaseAnonClient = (env) =>
  env.supabase.isConfigured
    ? createClient(env.supabase.url, env.supabase.anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      })
    : env.supabase.enableLocalAuth
      ? createLocalSupabaseAuthClient()
      : (() => {
          throw new Error("Supabase auth is not configured and local auth fallback is disabled.");
        })();

export const createSupabaseServiceClient = (env) =>
  env.supabase.isConfigured
    ? createClient(env.supabase.url, env.supabase.serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      })
    : env.supabase.enableLocalAuth
      ? createLocalSupabaseServiceClient()
      : (() => {
          throw new Error("Supabase service client is not configured and local auth fallback is disabled.");
        })();
