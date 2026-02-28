export interface MessageContext {
  user: any;
  message: any;
  type: string;
  extractedData: any;
}

export async function parseMessage(message: any, user: any): Promise<MessageContext> {
  const messageType = message.type;
  let context: MessageContext = {
    user,
    message,
    type: 'unknown',
    extractedData: {}
  };

  switch (messageType) {
    case 'text':
      context = await parseTextMessage(message, user);
      break;
      
    case 'image':
      context = await parseImageMessage(message, user);
      break;
      
    case 'location':
      context = await parseLocationMessage(message, user);
      break;
      
    case 'audio':
      context = await parseVoiceMessage(message, user);
      break;
      
    case 'document':
      context = await parseDocumentMessage(message, user);
      break;
      
    case 'interactive':
      context = await parseInteractiveMessage(message, user);
      break;
      
    default:
      context.type = 'unknown';
  }

  return context;
}

async function parseTextMessage(message: any, user: any): Promise<MessageContext> {
  const text = message.text.body.toLowerCase().trim();
  
  // Check for help commands
  if (text === 'help' || text === 'h') {
    return {
      user,
      message,
      type: 'help',
      extractedData: {}
    };
  }

  // Check for menu commands
  if (text === 'menu' || text === 'report' || text === 'start') {
    return {
      user,
      message,
      type: 'menu',
      extractedData: {}
    };
  }

  // Check for status commands
  if (text === 'status' || text === 'my reports' || text === 'track') {
    return {
      user,
      message,
      type: 'status_check',
      extractedData: {}
    };
  }

  // Check for confirmation
  if (text === 'confirm' || text === 'yes' || text === 'submit') {
    return {
      user,
      message,
      type: 'confirm_report',
      extractedData: {}
    };
  }

  // Check for cancellation
  if (text === 'cancel' || text === 'no' || text === 'stop') {
    return {
      user,
      message,
      type: 'cancel_report',
      extractedData: {}
    };
  }

  // Parse for new report (category + description)
  const reportData = parseReportText(text);
  if (reportData.category) {
    return {
      user,
      message,
      type: 'new_report',
      extractedData: reportData
    };
  }

  // Parse for location text
  const locationData = parseLocationText(text);
  if (locationData.address) {
    return {
      user,
      message,
      type: 'location_received',
      extractedData: { location: locationData }
    };
  }

  // Default to unknown
  return {
    user,
    message,
    type: 'unknown',
    extractedData: {}
  };
}

function parseReportText(text: string): any {
  const categories = [
    'pot holes', 'potholes', 'pot hole',
    'garbage', 'trash', 'waste',
    'water leakage', 'water leak', 'leakage', 'leak',
    'drainage', 'sewage', 'drain',
    'streetlight', 'street light', 'light',
    'road damage', 'road damage', 'bad road',
    'illegal dumping', 'dumping',
    'stray animals', 'stray', 'animals',
    'traffic signal', 'traffic light', 'signal',
    'encroachment', 'encroach',
    'building', 'construction',
    'flooding', 'flood',
    'other'
  ];

  // Find category
  let category = null;
  let description = text;

  for (const cat of categories) {
    if (text.includes(cat)) {
      category = cat.toUpperCase().replace(' ', '_');
      description = text.replace(cat, '').trim();
      break;
    }
  }

  // Map common variations to standard categories
  const categoryMap: Record<string, string> = {
    'POT_HOLES': 'POTHOLES',
    'WATER_LEAKAGE': 'WATER_LEAKAGE',
    'STREET_LIGHT': 'STREETLIGHT',
    'ROAD_DAMAGE': 'ROAD_DAMAGE',
    'ILLEGAL_DUMPING': 'ILLEGAL_DUMPING',
    'STRAY_ANIMALS': 'STRAY_ANIMALS',
    'TRAFFIC_SIGNAL': 'TRAFFIC_SIGNAL',
    'DRAINAGE_SEWAGE': 'DRAINAGE_SEWAGE'
  };

  if (categoryMap[category]) {
    category = categoryMap[category];
  }

  return {
    category,
    description: description || undefined
  };
}

function parseLocationText(text: string): any {
  const locationKeywords = [
    'near', 'at', 'in', 'on', 'beside', 'opposite', 'behind', 'in front of',
    'street', 'road', 'lane', 'colony', 'area', 'sector', 'block',
    'cross', 'junction', 'signal', 'bus stop', 'metro', 'market'
  ];

  // Check if text looks like an address/location
  const hasLocationKeywords = locationKeywords.some(keyword => text.includes(keyword));
  const hasNumbers = /\d+/.test(text); // Street numbers, etc.
  
  if (hasLocationKeywords || hasNumbers || text.length > 10) {
    return {
      address: text,
      type: 'text_address'
    };
  }

  return {};
}

async function parseImageMessage(message: any, user: any): Promise<MessageContext> {
  const imageId = message.image.id;
  const mimeType = message.image.mime_type;
  
  // Download image from WhatsApp
  const imageUrl = await downloadWhatsAppMedia(imageId);
  
  return {
    user,
    message,
    type: 'image_received',
    extractedData: {
      image: {
        id: imageId,
        url: imageUrl,
        mimeType,
        caption: message.image.caption
      }
    }
  };
}

async function parseLocationMessage(message: any, user: any): Promise<MessageContext> {
  const location = message.location;
  
  return {
    user,
    message,
    type: 'location_received',
    extractedData: {
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.name || `${location.latitude}, ${location.longitude}`,
        type: 'gps_pin'
      }
    }
  };
}

async function parseVoiceMessage(message: any, user: any): Promise<MessageContext> {
  const audioId = message.audio.id;
  const mimeType = message.audio.mime_type;
  
  // Download audio file
  const audioUrl = await downloadWhatsAppMedia(audioId);
  
  return {
    user,
    message,
    type: 'voice_received',
    extractedData: {
      voice: {
        id: audioId,
        url: audioUrl,
        mimeType
      }
    }
  };
}

async function parseDocumentMessage(message: any, user: any): Promise<MessageContext> {
  const documentId = message.document.id;
  const filename = message.document.filename;
  
  // Download document
  const documentUrl = await downloadWhatsAppMedia(documentId);
  
  return {
    user,
    message,
    type: 'document_received',
    extractedData: {
      document: {
        id: documentId,
        url: documentUrl,
        filename,
        caption: message.document.caption
      }
    }
  };
}

async function parseInteractiveMessage(message: any, user: any): Promise<MessageContext> {
  const interactive = message.interactive;
  
  if (interactive.type === 'button_reply') {
    const buttonReply = interactive.button_reply;
    
    return {
      user,
      message,
      type: 'button_response',
      extractedData: {
        buttonId: buttonReply.id,
        buttonText: buttonReply.title
      }
    };
  }
  
  if (interactive.type === 'list_reply') {
    const listReply = interactive.list_reply;
    
    return {
      user,
      message,
      type: 'list_response',
      extractedData: {
        listId: listReply.id,
        listText: listReply.title
      }
    };
  }

  return {
    user,
    message,
    type: 'unknown',
    extractedData: {}
  };
}

async function downloadWhatsAppMedia(mediaId: string): Promise<string> {
  const url = `https://graph.facebook.com/v18.0/${mediaId}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download media');
    }

    const data = await response.json();
    return data.url; // Return the media URL
  } catch (error) {
    console.error('Error downloading WhatsApp media:', error);
    throw error;
  }
}
