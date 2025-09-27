// Type definitions for Deno-style imports in Supabase Edge Functions
declare module "https://deno.land/std@0.190.0/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response>): void;
}

declare module "npm:@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
}