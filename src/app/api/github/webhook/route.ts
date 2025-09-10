import { NextRequest, NextResponse } from 'next/server';
import { githubApp } from '@/lib/github-app';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-hub-signature-256');
    const deliveryId = req.headers.get('x-github-delivery');
    const eventName = req.headers.get('x-github-event');
    if (!signature || !deliveryId || !eventName) {
      return NextResponse.json({ error: 'Missing required headers' }, { status: 400 });
    }

    const payload = JSON.stringify(await req.json());

    await githubApp.webhooks.verifyAndReceive({
      id: deliveryId,
      name: eventName as any,
      signature,
      payload,
    });

    console.log(`Received GitHub webhook event: ${eventName}, deliveryId: ${deliveryId}`);

    return NextResponse.json({ message: 'Webhook received and processed' }, { status: 200 });

  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}