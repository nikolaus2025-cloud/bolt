import { loadScript } from "@paypal/paypal-js";

export const loadPayPalScript = async () => {
  try {
    await loadScript({ 
      clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
      currency: "USD"
    });
  } catch (error) {
    console.error("Failed to load PayPal script:", error);
  }
};

export const createPayPalOrder = async (amount: number) => {
  // This would typically communicate with your backend to create the order
  return {
    purchase_units: [{
      amount: {
        value: amount.toString()
      }
    }]
  };
};