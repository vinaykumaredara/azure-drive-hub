// Deno type declarations for Supabase functions
// This file provides type definitions for Deno runtime environment

declare global {
  namespace Deno {
    namespace env {
      function get(key: string): string | undefined;
    }
  }
}

export {};