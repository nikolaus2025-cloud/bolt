export const loadPayPalScript = () => {
  const script = document.createElement('script');
  script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
  script.setAttribute('data-namespace', '');
  script.setAttribute('data-environment', 'production');
  script.async = true;
  document.body.appendChild(script);
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