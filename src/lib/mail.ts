import nodemailer from 'nodemailer';
import { env } from '../env.js';

export type EmailTemplate = {
  subject: string;
  text: string;
  html: string;
};

let transporter: nodemailer.Transporter;

const initializeTransporter = async () => {
  // Check if Gmail credentials are available
  if (env.GMAIL_USER && env.GMAIL_APP_PASSWORD) {
    console.log('Using Gmail SMTP for email delivery');
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.GMAIL_USER,
        pass: env.GMAIL_APP_PASSWORD,
      },
    });
    return;
  }

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    console.log('Using custom SMTP server for email delivery');
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT || '587'),
      secure: env.SMTP_SECURE === 'true',
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
    return;
  } 
};

initializeTransporter();

let isInitialized = false;

async function ensureTransporter() {
  if (!isInitialized) {
    await initializeTransporter();
    isInitialized = true;
  }
}


export async function sendEmail(
  to: string | string[],
  template: EmailTemplate,
  from?: string
) {
  try {
    await ensureTransporter();
    
    if (!transporter) {
      return { messageId: 'dummy-id-' + Date.now() } as any;
    }
    
    let senderEmail: string;
    if (from) {
      senderEmail = from;
    } else if (env.GMAIL_USER) {
      senderEmail = env.GMAIL_USER;
    } else if (env.SMTP_FROM) {
      senderEmail = env.SMTP_FROM;
    } else {
      senderEmail = 'CodeRaptor <noreply@coderaptor.app>';
    }

    const info = await transporter.sendMail({
      from: senderEmail,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: template.subject,
      text: template.text, 
      html: template.html, 
    });

    console.log('✅ Email sent successfully!');

    return info;
  } catch (error) {
    throw error;
  }
}


export function createWelcomeEmail(name: string): EmailTemplate {
  return {
    subject: 'Welcome to CodeRaptor!',
    text: `Hello ${name},\n\nWelcome to CodeRaptor! We're excited to have you on board.\n\nBest regards,\nThe CodeRaptor Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to CodeRaptor!</h1>
        <p>Hello ${name},</p>
        <p>Welcome to CodeRaptor! We're excited to have you on board.</p>
        <p>Best regards,<br>The CodeRaptor Team</p>
      </div>
    `,
  };
}


export function createPasswordResetEmail(name: string, resetLink: string): EmailTemplate {
  return {
    subject: 'Reset Your CodeRaptor Password',
    text: `Hello ${name},\n\nYou requested to reset your password. Please click the following link to reset it: ${resetLink}\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nThe CodeRaptor Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Reset Your Password</h1>
        <p>Hello ${name},</p>
        <p>You requested to reset your password. Please click the button below to reset it:</p>
        <p>
          <a href="${resetLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Reset Password
          </a>
        </p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The CodeRaptor Team</p>
      </div>
    `,
  };
}


export function createLoginNotificationEmail(
  email: string,
  deviceInfo?: string,
  location?: string,
  time?: string
): EmailTemplate {
  const loginTime = time || new Date().toLocaleString();
  const deviceString = deviceInfo || 'Unknown device';
  const locationString = location || 'Unknown location';
  
  return {
    subject: 'New Login to Your CodeRaptor Account',
    text: `Hello,

We detected a new login to your CodeRaptor account.

Account: ${email}
Time: ${loginTime}
Device: ${deviceString}
Location: ${locationString}

If this was you, you can ignore this message. If you didn't log in recently, please secure your account by changing your password immediately.

Best regards,
The CodeRaptor Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">New Login Detected</h1>
        <p>Hello,</p>
        <p>We detected a new login to your CodeRaptor account.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Account:</strong> ${email}</p>
          <p><strong>Time:</strong> ${loginTime}</p>
          <p><strong>Device:</strong> ${deviceString}</p>
          <p><strong>Location:</strong> ${locationString}</p>
        </div>
        <p>If this was you, you can ignore this message.</p>
        <p>If you didn't log in recently, please secure your account by changing your password immediately.</p>
        <p>Best regards,<br>The CodeRaptor Team</p>
      </div>
    `,
  };
}

export function createNotificationEmail(
  name: string, 
  message: string, 
  actionLink?: string, 
  actionText?: string
): EmailTemplate {
  const actionButton = actionLink && actionText 
    ? `<p>
        <a href="${actionLink}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          ${actionText}
        </a>
      </p>`
    : '';
  
  return {
    subject: 'CodeRaptor Notification',
    text: `Hello ${name},\n\n${message}\n\n${actionLink ? `${actionText}: ${actionLink}` : ''}\n\nBest regards,\nThe CodeRaptor Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">CodeRaptor Notification</h1>
        <p>Hello ${name},</p>
        <p>${message}</p>
        ${actionButton}
        <p>Best regards,<br>The CodeRaptor Team</p>
      </div>
    `,
  };
}


export function createCustomEmail(
  subject: string,
  text: string,
  html: string
): EmailTemplate {
  return {
    subject,
    text,
    html,
  };
}
