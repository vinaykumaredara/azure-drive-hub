/**
 * Analytics and Telemetry Service
 * Tracks user interactions and booking flow metrics
 */

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

export interface StepMetrics {
  stepName: string;
  timeSpent: number;
  completed: boolean;
  errors?: string[];
}

class TelemetryService {
  private events: AnalyticsEvent[] = [];
  private stepTimings: Map<string, number> = new Map();
  private sessionId: string;

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.debug('[Telemetry] Initialized with session:', this.sessionId);
  }

  /**
   * Track a generic analytics event
   */
  track(event: string, properties?: Record<string, any>) {
    const eventData: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
      },
      timestamp: Date.now(),
    };

    this.events.push(eventData);
    console.debug('[Telemetry] Event tracked:', eventData);

    // In production, send to analytics backend
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(eventData);
    }
  }

  /**
   * Track when a booking step starts
   */
  stepStart(stepName: string) {
    this.stepTimings.set(stepName, Date.now());
    this.track('booking_step_start', { stepName });
  }

  /**
   * Track when a booking step completes
   */
  stepComplete(stepName: string) {
    const startTime = this.stepTimings.get(stepName);
    if (startTime) {
      const timeSpent = Date.now() - startTime;
      this.track('booking_step_complete', { 
        stepName, 
        timeSpent,
        timeSpentSeconds: Math.round(timeSpent / 1000)
      });
      this.stepTimings.delete(stepName);
    }
  }

  /**
   * Track when a user drops off from a step
   */
  stepDropoff(stepName: string, reason?: string) {
    const startTime = this.stepTimings.get(stepName);
    if (startTime) {
      const timeSpent = Date.now() - startTime;
      this.track('booking_step_dropoff', { 
        stepName, 
        timeSpent,
        reason 
      });
      this.stepTimings.delete(stepName);
    }
  }

  /**
   * Track errors during booking flow
   */
  trackError(stepName: string, error: string, context?: Record<string, any>) {
    this.track('booking_error', {
      stepName,
      error,
      ...context,
    });
  }

  /**
   * Track successful booking completion
   */
  trackBookingSuccess(bookingData: {
    carId: string;
    totalAmount: number;
    advanceBooking: boolean;
    totalDays: number;
  }) {
    this.track('booking_success', {
      ...bookingData,
      conversionTime: Date.now() - (this.stepTimings.get('dates') || Date.now()),
    });
  }

  /**
   * Track modal open
   */
  trackModalOpen(carId: string) {
    this.track('booking_modal_open', { carId });
  }

  /**
   * Track modal close
   */
  trackModalClose(carId: string, reason: 'completed' | 'abandoned' | 'error') {
    this.track('booking_modal_close', { carId, reason });
  }

  /**
   * Get session summary
   */
  getSessionSummary() {
    return {
      sessionId: this.sessionId,
      totalEvents: this.events.length,
      events: this.events,
      activeSteps: Array.from(this.stepTimings.keys()),
    };
  }

  /**
   * Clear session data
   */
  clearSession() {
    this.events = [];
    this.stepTimings.clear();
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.debug('[Telemetry] Session cleared, new session:', this.sessionId);
  }

  /**
   * Send event to analytics backend
   * In production, this would send to your analytics service (GA, Mixpanel, etc.)
   */
  private async sendToAnalytics(event: AnalyticsEvent) {
    try {
      // TODO: Replace with actual analytics endpoint
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event),
      // });
      console.debug('[Telemetry] Would send to analytics:', event);
    } catch (error) {
      console.error('[Telemetry] Failed to send analytics:', error);
    }
  }
}

// Export singleton instance
export const telemetry = new TelemetryService();
