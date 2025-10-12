// src/utils/deviceOptimizations.ts
// Device-specific optimizations for better performance across all devices

/**
 * Detect if the user is on a mobile device
 * @returns boolean indicating if user is on mobile
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Detect if the user is on a tablet device
 * @returns boolean indicating if user is on tablet
 */
export function isTabletDevice(): boolean {
  return /iPad|Android(?!.*Mobile)|Tablet/i.test(navigator.userAgent);
}

/**
 * Detect if the user is on a desktop device
 * @returns boolean indicating if user is on desktop
 */
export function isDesktopDevice(): boolean {
  return !isMobileDevice() && !isTabletDevice();
}

/**
 * Get device-specific image quality settings
 * @returns object with image quality settings
 */
export function getDeviceImageSettings() {
  if (isMobileDevice()) {
    return {
      quality: 0.7, // Lower quality for mobile to save bandwidth
      maxWidth: 800,
      maxHeight: 600
    };
  } else if (isTabletDevice()) {
    return {
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 900
    };
  } else {
    return {
      quality: 0.9,
      maxWidth: 1920,
      maxHeight: 1080
    };
  }
}

/**
 * Optimize animations based on device capabilities
 * @returns boolean indicating if animations should be reduced
 */
export function shouldReduceMotion(): boolean {
  // Check for user preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // On mobile devices, reduce motion for better performance
  if (isMobileDevice()) {
    return prefersReducedMotion || true;
  }
  
  return prefersReducedMotion;
}

/**
 * Get device-specific animation settings
 * @returns object with animation configuration
 */
export function getDeviceAnimationSettings() {
  if (shouldReduceMotion()) {
    return {
      duration: 0,
      easing: 'linear'
    };
  }
  
  if (isMobileDevice()) {
    return {
      duration: 150, // Faster animations on mobile
      easing: 'ease-out'
    };
  }
  
  return {
    duration: 200,
    easing: 'ease-out'
  };
}

/**
 * Optimize rendering based on device type
 * @returns object with rendering optimizations
 */
export function getDeviceRenderingOptimizations() {
  if (isMobileDevice()) {
    return {
      maxListItems: 10, // Limit list items on mobile
      lazyLoadOffset: 100, // Load items when 100px from viewport
      enableHardwareAcceleration: true,
      disableAnimations: true // Disable animations on mobile for better performance
    };
  } else if (isTabletDevice()) {
    return {
      maxListItems: 20,
      lazyLoadOffset: 200,
      enableHardwareAcceleration: true,
      disableAnimations: false
    };
  } else {
    return {
      maxListItems: 50,
      lazyLoadOffset: 300,
      enableHardwareAcceleration: true,
      disableAnimations: false
    };
  }
}

/**
 * Apply device-specific performance optimizations
 */
export function applyDeviceOptimizations() {
  // Apply hardware acceleration for smoother animations
  if (getDeviceRenderingOptimizations().enableHardwareAcceleration) {
    document.documentElement.style.setProperty('transform', 'translateZ(0)');
    document.documentElement.style.setProperty('will-change', 'transform');
  }
  
  // Reduce animation intensity on mobile
  if (isMobileDevice()) {
    document.documentElement.style.setProperty('--animate-fast', '100ms');
    document.documentElement.style.setProperty('--animate-normal', '150ms');
    document.documentElement.style.setProperty('--animate-slow', '200ms');
  }
  
  // Disable heavy animations if requested
  if (getDeviceRenderingOptimizations().disableAnimations) {
    document.documentElement.style.setProperty('--animate-fast', '0ms');
    document.documentElement.style.setProperty('--animate-normal', '0ms');
    document.documentElement.style.setProperty('--animate-slow', '0ms');
  }
}

// Initialize device optimizations when module is imported
applyDeviceOptimizations();