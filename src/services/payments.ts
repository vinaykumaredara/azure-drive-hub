import { supabase } from "@/integrations/supabase/client";

export const paymentService = {
  // Create payment intent
  createPaymentIntent: async (bookingId: string, gateway: string = "razorpay") => {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          bookingId,
          gateway
        }
      });

      if (error) {throw error;}

      if (!data.success) {
        throw new Error(data.error || "Failed to create payment intent");
      }

      return { success: true, ...data };
    } catch (error) {
      console.error("Create payment intent error:", error);
      return { success: false, error: error.message };
    }
  },

  // Confirm payment
  confirmPayment: async (paymentIntentId: string, status: string = "succeeded", metadata: any = {}) => {
    try {
      const { data, error } = await supabase.functions.invoke('confirm-payment', {
        body: {
          payment_intent_id: paymentIntentId,
          status,
          metadata
        }
      });

      if (error) {throw error;}

      if (!data.success) {
        throw new Error(data.error || "Failed to confirm payment");
      }

      return { success: true, ...data };
    } catch (error) {
      console.error("Confirm payment error:", error);
      return { success: false, error: error.message };
    }
  },

  // Complete payment (for webhook handling)
  completePayment: async (paymentIntentId: string, status: string = "succeeded", metadata: any = {}) => {
    try {
      const { data, error } = await supabase.functions.invoke('complete-payment', {
        body: {
          payment_intent_id: paymentIntentId,
          status,
          metadata
        }
      });

      if (error) {throw error;}

      if (!data.success) {
        throw new Error(data.error || "Failed to complete payment");
      }

      return { success: true, ...data };
    } catch (error) {
      console.error("Complete payment error:", error);
      return { success: false, error: error.message };
    }
  }
};