const MAILGUN_API_KEY = import.meta.env.VITE_MAILGUN_API_KEY;
const MAILGUN_DOMAIN = import.meta.env.VITE_MAILGUN_DOMAIN;
const MAILGUN_FROM_EMAIL = import.meta.env.VITE_MAILGUN_FROM_EMAIL;

interface OrderEmailData {
  customerName: string;
  orderNumber: string;
  amount: number;
  email: string;
}

export const sendOrderConfirmationEmail = async (data: OrderEmailData) => {
  const formData = new FormData();
  formData.append('from', MAILGUN_FROM_EMAIL);
  formData.append('to', data.email);
  formData.append('subject', 'Order Confirmation - Ruby Store');
  formData.append('template', 'order');
  formData.append('h:X-Mailgun-Variables', JSON.stringify({
    customerName: data.customerName,
    orderNumber: data.orderNumber,
    amount: data.amount.toFixed(2)
  }));

  try {
    const response = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Mailgun API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}; 