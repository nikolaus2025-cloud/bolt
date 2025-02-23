interface OrderEmailData {
  customerName: string;
  orderNumber: string;
  amount: number;
  email: string;
}

export const sendOrderConfirmationEmail = async (data: OrderEmailData) => {
  try {
    const response = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to send email: ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}; 