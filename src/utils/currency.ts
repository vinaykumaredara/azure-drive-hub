/**
 * Utility functions for currency formatting and conversion
 */

/**
 * Format paise amount to Indian Rupee currency string
 * @param paise - Amount in paise (smallest currency unit)
 * @returns Formatted currency string in Indian format (₹1,00,000.00)
 */
export function formatINRFromPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(paise / 100);
}

/**
 * Convert rupees to paise
 * @param rupees - Amount in rupees
 * @returns Amount in paise
 */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert paise to rupees
 * @param paise - Amount in paise
 * @returns Amount in rupees
 */
export function fromPaise(paise: number): number {
  return paise / 100;
}