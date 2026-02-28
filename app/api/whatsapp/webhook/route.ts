import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { handleWhatsAppMessage } from '@/lib/whatsapp/messageHandler';

// WhatsApp webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify webhook (WhatsApp sends these parameters for verification)
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge);
  }

  return NextResponse.json({ error: 'Invalid verification' }, { status: 403 });
}

// Handle incoming WhatsApp messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // Verify webhook signature (security)
    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 403 });
    }

    const [hashAlgorithm, signatureValue] = signature.split('=');
    const expectedSignature = crypto
      .createHmac(hashAlgorithm, process.env.WHATSAPP_APP_SECRET!)
      .update(body)
      .digest('hex');

    if (signatureValue !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const data = JSON.parse(body);

    // Process the message
    if (data.object === 'whatsapp_business_account') {
      for (const entry of data.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            await handleWhatsAppMessage(change.value);
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
