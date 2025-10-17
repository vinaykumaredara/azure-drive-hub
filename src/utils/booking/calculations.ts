/**
 * Booking calculation utilities
 * @module utils/booking/calculations
 */

import { BookingAddons } from '@/types/booking.types';

/**
 * Add-on prices in INR
 */
const ADDON_PRICES = {
  driver: 500,
  gps: 200,
  childSeat: 150,
  insurance: 300,
} as const;

/**
 * Calculates the number of days between two dates
 * @param startDate - Start date string (YYYY-MM-DD)
 * @param endDate - End date string (YYYY-MM-DD)
 * @returns Number of days
 */
export const calculateDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays); // Minimum 1 day
};

/**
 * Calculates the total cost of selected add-ons
 * @param addons - Selected add-ons
 * @param days - Number of days
 * @returns Total add-ons cost
 */
export const calculateAddonsTotal = (
  addons: BookingAddons,
  days: number = 1
): number => {
  return Object.entries(addons).reduce((total, [key, enabled]) => {
    if (!enabled) return total;
    const price = ADDON_PRICES[key as keyof typeof ADDON_PRICES] || 0;
    return total + price * days;
  }, 0);
};

/**
 * Calculates the base rental cost
 * @param pricePerDay - Price per day
 * @param days - Number of days
 * @returns Base rental cost
 */
export const calculateBaseRental = (
  pricePerDay: number,
  days: number
): number => {
  return pricePerDay * days;
};

/**
 * Calculates the total booking cost
 * @param pricePerDay - Price per day
 * @param days - Number of days
 * @param addons - Selected add-ons
 * @returns Total booking cost
 */
export const calculateTotalCost = (
  pricePerDay: number,
  days: number,
  addons: BookingAddons
): number => {
  const baseRental = calculateBaseRental(pricePerDay, days);
  const addonsTotal = calculateAddonsTotal(addons, days);
  return baseRental + addonsTotal;
};

/**
 * Calculates the advance payment amount (10% of total)
 * @param totalCost - Total booking cost
 * @returns Advance payment amount
 */
export const calculateAdvanceAmount = (totalCost: number): number => {
  return Math.round(totalCost * 0.1);
};

/**
 * Calculates the service charge
 * @param subtotal - Subtotal amount
 * @param serviceChargePercent - Service charge percentage (default 5%)
 * @returns Service charge amount
 */
export const calculateServiceCharge = (
  subtotal: number,
  serviceChargePercent: number = 5
): number => {
  return Math.round((subtotal * serviceChargePercent) / 100);
};

/**
 * Gets the display name for an add-on
 * @param key - Add-on key
 * @returns Display name
 */
export const getAddonDisplayName = (key: string): string => {
  const names: Record<string, string> = {
    driver: 'Professional Driver',
    gps: 'GPS Navigation',
    childSeat: 'Child Safety Seat',
    insurance: 'Premium Insurance',
  };
  return names[key] || key;
};

/**
 * Gets the price for an add-on
 * @param key - Add-on key
 * @returns Price in INR
 */
export const getAddonPrice = (key: string): number => {
  return ADDON_PRICES[key as keyof typeof ADDON_PRICES] || 0;
};
