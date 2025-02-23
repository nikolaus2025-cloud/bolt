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
  const formData = new URLSearchParams();
  formData.append('from', `Ruby Store <${MAILGUN_FROM_EMAIL}>`);
  formData.append('to', data.email);
  formData.append('subject', 'Order Confirmation - Ruby Store');
  formData.append('text', `
    Dear ${data.customerName},

    Thank you for your order! 
    
    Order Details:
    Order Number: ${data.orderNumber}
    Total Amount: $${data.amount.toFixed(2)}

    We'll process your order shortly.

    Best regards,
    Ruby Store Team
  `);

  try {
    const response = await fetch(`https://api.eu.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    const responseData = await response.text();
    console.log('Mailgun Response:', responseData);

    if (!response.ok) {
      throw new Error(`Mailgun API error: ${response.status} ${responseData}`);
    }

    return JSON.parse(responseData);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}; 