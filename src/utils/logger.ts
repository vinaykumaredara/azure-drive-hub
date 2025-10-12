/**
 * Development-only logging utility
 * Logs are only shown in development mode
 */
export const debugLog = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.debug(...args);
  }
};

export const errorLog = (...args: any[]) => {
  console.error(...args);
};
