interface WhatsAppMessage {
  type: 'text' | 'image' | 'location' | 'document';
  text?: {
    body: string;
  };
  image?: {
    link: string;
    caption?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
  };
  document?: {
    link: string;
    filename: string;
    caption?: string;
  };
}

export async function sendWhatsAppMessage(to: string, message: WhatsAppMessage) {
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  const payload = {
    messaging_product: 'whatsapp',
    to: to.replace(/[^\d]/g, ''), // Remove non-digits from phone number
    ...message
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('WhatsApp API error:', errorData);
      throw new Error(`WhatsApp API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('WhatsApp message sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

export async function sendInteractiveMessage(to: string, bodyText: string, buttons: Array<{id: string, title: string}>) {
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  const payload = {
    messaging_product: 'whatsapp',
    to: to.replace(/[^\d]/g, ''),
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: bodyText
      },
      action: {
        buttons: buttons.map((button, index) => ({
          type: 'reply',
          reply: {
            id: button.id,
            title: button.title
          }
        }))
      }
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('WhatsApp interactive message error:', errorData);
      throw new Error(`WhatsApp API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending WhatsApp interactive message:', error);
    throw error;
  }
}

export async function sendLocationMessage(to: string, latitude: number, longitude: number, name: string, address: string) {
  return sendWhatsAppMessage(to, {
    type: 'location',
    location: {
      latitude,
      longitude,
      name,
      address
    }
  });
}

export async function sendImageMessage(to: string, imageUrl: string, caption?: string) {
  return sendWhatsAppMessage(to, {
    type: 'image',
    image: {
      link: imageUrl,
      caption
    }
  });
}
