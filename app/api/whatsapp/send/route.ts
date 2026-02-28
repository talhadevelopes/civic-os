import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sender';

// API endpoint to send WhatsApp messages (for testing/admin)
export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json();

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, message' },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppMessage(to, message);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// Test endpoint to verify WhatsApp setup
export async function GET() {
  return NextResponse.json({
    status: 'WhatsApp API is ready',
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook: '/api/whatsapp/webhook',
      send: '/api/whatsapp/send'
    }
  });
}
