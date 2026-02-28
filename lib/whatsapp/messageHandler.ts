import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from './sender';
import { parseMessage, MessageContext } from './parser';
import { createReportFromWhatsApp } from './reportService';
import { getUserByWhatsApp, createUserFromWhatsApp } from './userService';

export async function handleWhatsAppMessage(data: any) {
  const messages = data.messages || [];
  
  for (const message of messages) {
    if (message.type !== 'message') continue;
    
    const from = message.from; // WhatsApp phone number
    const messageId = message.id;
    const timestamp = message.timestamp;
    
    try {
      // Get or create user
      let user = await getUserByWhatsApp(from);
      if (!user) {
        user = await createUserFromWhatsApp(from, message.contacts?.[0]?.profile?.name);
      }

      // Parse the message content
      const context = await parseMessage(message, user);
      
      // Handle based on message type and user state
      await routeMessage(context);
      
    } catch (error) {
      console.error(`Error handling message ${messageId}:`, error);
      
      // Send error message to user
      await sendWhatsAppMessage(from, {
        type: 'text',
        text: {
          body: 'Sorry, I encountered an error processing your message. Please try again or contact support.'
        }
      });
    }
  }
}

async function routeMessage(context: MessageContext) {
  const { user, message, type, extractedData } = context;
  
  switch (type) {
    case 'new_report':
      await handleNewReport(context);
      break;
      
    case 'status_check':
      await handleStatusCheck(context);
      break;
      
    case 'location_received':
      await handleLocationReceived(context);
      break;
      
    case 'image_received':
      await handleImageReceived(context);
      break;
      
    case 'voice_received':
      await handleVoiceReceived(context);
      break;
      
    case 'help':
      await sendHelpMessage(user.phone);
      break;
      
    case 'menu':
      await sendMainMenu(user.phone);
      break;
      
    default:
      await sendWhatsAppMessage(user.phone, {
        type: 'text',
        text: {
          body: `I didn't understand that. Please type "help" to see available options or "menu" to start reporting an issue.`
        }
      });
  }
}

async function handleNewReport(context: MessageContext) {
  const { user, extractedData } = context;
  
  if (!extractedData.category) {
    await sendWhatsAppMessage(user.phone, {
      type: 'text',
      text: {
        body: `Please specify the issue category. Available options:\n\n` +
          `🚗 POTHOLES\n🗑️ GARBAGE\n💧 WATER_LEAKAGE\n🚰 DRAINAGE_SEWAGE\n💡 STREETLIGHT\n` +
          `🛣️ ROAD_DAMAGE\n🚫 ILLEGAL_DUMPING\n🐕 STRAY_ANIMALS\n🚦 TRAFFIC_SIGNAL\n` +
          `🏗️ ENCROACHMENT\n🏢 BUILDING\n🌊 FLOODING\n📝 OTHER\n\n` +
          `Reply with the category name to continue.`
      }
    });
    return;
  }

  // Store incomplete report in session
  await prisma.whatsappSession.upsert({
    where: { userId: user.id },
    update: {
      currentReport: {
        category: extractedData.category,
        description: extractedData.description,
        location: extractedData.location,
        images: extractedData.images || []
      },
      step: 'awaiting_location'
    },
    create: {
      userId: user.id,
      currentReport: {
        category: extractedData.category,
        description: extractedData.description,
        location: extractedData.location,
        images: extractedData.images || []
      },
      step: 'awaiting_location'
    }
  });

  if (extractedData.location) {
    // Location already provided, ask for confirmation
    await sendWhatsAppMessage(user.phone, {
      type: 'text',
      text: {
        body: `Great! I have your ${extractedData.category} report:\n\n` +
          `Description: ${extractedData.description || 'No description provided'}\n` +
          `Location: ${extractedData.location.address || 'Location received'}\n\n` +
          `Please reply "confirm" to submit this report, or "cancel" to start over.`
      }
    });
  } else {
    // Request location
    await sendWhatsAppMessage(user.phone, {
      type: 'text',
      text: {
        body: `Please share your location by:\n\n` +
          `1. 📍 Sending your current location (WhatsApp location pin)\n` +
          `2. 📍 Typing the address/landmark\n` +
          `3. 📍 Sharing area name\n\n` +
          `This helps us assign the issue to the right authorities.`
      }
    });
  }
}

async function handleStatusCheck(context: MessageContext) {
  const { user, extractedData } = context;
  
  // Get user's recent reports
  const reports = await prisma.report.findMany({
    where: { createdById: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      ward: { select: { name: true } },
      assignedMla: { select: { name: true } }
    }
  });

  if (reports.length === 0) {
    await sendWhatsAppMessage(user.phone, {
      type: 'text',
      text: {
        body: 'You haven\'t reported any issues yet. Type "menu" to report your first issue!'
      }
    });
    return;
  }

  let message = '📋 Your Recent Reports:\n\n';
  reports.forEach((report, index) => {
    const statusEmoji = getStatusEmoji(report.status);
    message += `${index + 1}. ${statusEmoji} ${report.category}\n` +
      `   📍 ${report.areaName || 'No location'}\n` +
      `   📊 Status: ${report.status.replace(/_/g, ' ')}\n` +
      `   📅 ${new Date(report.createdAt).toLocaleDateString()}\n\n`;
  });

  message += 'Reply with the report number (1-5) for detailed updates.';

  await sendWhatsAppMessage(user.phone, {
    type: 'text',
    text: { body: message }
  });
}

async function handleLocationReceived(context: MessageContext) {
  const { user, extractedData } = context;
  
  const session = await prisma.whatsappSession.findUnique({
    where: { userId: user.id }
  });

  if (!session || !session.currentReport) {
    await sendWhatsAppMessage(user.phone, {
      type: 'text',
      text: {
        body: 'No active report found. Please type "menu" to start a new report.'
      }
    });
    return;
  }

  // Update session with location
  await prisma.whatsappSession.update({
    where: { userId: user.id },
    data: {
      currentReport: {
        ...session.currentReport,
        location: extractedData.location
      },
      step: 'awaiting_confirmation'
    }
  });

  const report = session.currentReport;
  await sendWhatsAppMessage(user.phone, {
    type: 'text',
    text: {
      body: `Perfect! Location received. Here's your report:\n\n` +
        `📝 Category: ${report.category}\n` +
        `📄 Description: ${report.description || 'No description'}\n` +
        `📍 Location: ${extractedData.location.address || 'Location received'}\n\n` +
        `Reply "confirm" to submit or "cancel" to start over.`
    }
  });
}

async function handleImageReceived(context: MessageContext) {
  const { user, extractedData } = context;
  
  const session = await prisma.whatsappSession.findUnique({
    where: { userId: user.id }
  });

  if (session && session.currentReport) {
    // Add image to current report
    const updatedImages = [...(session.currentReport.images || []), extractedData.image];
    
    await prisma.whatsappSession.update({
      where: { userId: user.id },
      data: {
        currentReport: {
          ...session.currentReport,
          images: updatedImages
        }
      }
    });

    await sendWhatsAppMessage(user.phone, {
      type: 'text',
      text: {
        body: `📸 Image received! ${updatedImages.length} image(s) attached to your report.\n\n` +
          `Please share location or reply "confirm" if you already provided it.`
      }
    });
  } else {
    await sendWhatsAppMessage(user.phone, {
      type: 'text',
      text: {
        body: 'Please start a report first by typing "menu". Images help us understand the issue better!'
      }
    });
  }
}

async function handleVoiceReceived(context: MessageContext) {
  const { user, extractedData } = context;
  
  await sendWhatsAppMessage(user.phone, {
    type: 'text',
    text: {
      body: '🎤 Voice message received! I\'m processing it...\n\n' +
        'Voice-to-text conversion is being implemented. For now, please type your issue description.'
    }
  });
}

async function sendHelpMessage(phone: string) {
  const helpText = `🤖 CIVICOS WhatsApp Bot Help\n\n` +
    `📋 Available Commands:\n\n` +
    `• "menu" or "report" - Start reporting an issue\n` +
    `• "status" or "my reports" - Check your report status\n` +
    `• "help" - Show this help message\n\n` +
    `📝 Report Categories:\n` +
    `POTHOLES, GARBAGE, WATER_LEAKAGE, DRAINAGE_SEWAGE, STREETLIGHT,\n` +
    `ROAD_DAMAGE, ILLEGAL_DUMPING, STRAY_ANIMALS, TRAFFIC_SIGNAL,\n` +
    `ENCROACHMENT, BUILDING, FLOODING, OTHER\n\n` +
    `📍 How to Report:\n` +
    `1. Send category name + description\n` +
    `2. Share location (pin or address)\n` +
    `3. Add photos (optional)\n` +
    `4. Confirm submission\n\n` +
    `Example: "POTHOLES Large pothole on Main Street near the bus stop"`;

  await sendWhatsAppMessage(phone, {
    type: 'text',
    text: { body: helpText }
  });
}

async function sendMainMenu(phone: string) {
  const menuText = `🏛️ Welcome to CIVICOS - Civic Issue Reporting\n\n` +
    `📝 To report an issue, send:\n` +
    `CATEGORY + DESCRIPTION\n\n` +
    `Example: "POTHOLES Large pothole causing traffic issues"\n\n` +
    `📊 To check status: "status"\n` +
    `❓ For help: "help"\n\n` +
    `Let's make our city better together! 🌟`;

  await sendWhatsAppMessage(phone, {
    type: 'text',
    text: { body: menuText }
  });
}

function getStatusEmoji(status: string): string {
  const statusEmojis: Record<string, string> = {
    'REPORTED': '📝',
    'ASSIGNED': '👤',
    'IN_PROGRESS': '🔧',
    'RESOLVED_PENDING_VERIFICATION': '✅',
    'CONFIRMED_FIXED': '🎉',
    'REOPENED': '🔄',
    'REJECTED': '❌'
  };
  return statusEmojis[status] || '📋';
}
