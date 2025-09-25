import { NextRequest, NextResponse } from 'next/server';
import { createLoginNotificationEmail, sendEmail } from '@/lib/mail';

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'Unknown';
  return ip;
}

function getUserAgent(req: NextRequest): string {
  const userAgent = req.headers.get('user-agent') || 'Unknown';
  return userAgent;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log(`Processing login notification for: ${email}`);

    const userAgent = getUserAgent(req);
    const ipAddress = getClientIp(req);
    
    const loginTime = new Date().toLocaleString();

    console.log('Login details:', {
      time: loginTime,
      ip: ipAddress,
      userAgent: userAgent.substring(0, 50) + '...' 
    });

    const template = createLoginNotificationEmail(
      email,
      userAgent,
      `IP: ${ipAddress}`,
      loginTime
    );

    console.log('Sending login notification email...');
    const result = await sendEmail(email, template);
    return NextResponse.json(
      { 
        success: true, 
        message: 'Login notification email sent',
        messageId: result.messageId
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending login notification:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send login notification', 
        message: error.message || 'Unknown error',
        code: error.code || 'UNKNOWN'
      },
      { status: 500 }
    );
  }
}
