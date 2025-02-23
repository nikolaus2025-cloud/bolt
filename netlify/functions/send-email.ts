import { Handler } from '@netlify/functions';
import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);
const client = mailgun.client({ 
  username: 'api', 
  key: process.env.MAILGUN_API_KEY! 
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { customerName, orderNumber, amount, email } = JSON.parse(event.body || '{}');

    const messageData = {
      from: `Ruby Store <${process.env.MAILGUN_FROM_EMAIL}>`,
      to: email,
      subject: 'Order Confirmation - Ruby Store',
      text: `
        Dear ${customerName},

        Thank you for your order! 
        
        Order Details:
        Order Number: ${orderNumber}
        Total Amount: $${amount.toFixed(2)}

        We'll process your order shortly.

        Best regards,
        Ruby Store Team
      `
    };

    await client.messages.create(process.env.MAILGUN_DOMAIN!, messageData);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully' })
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send email' })
    };
  }
}; 