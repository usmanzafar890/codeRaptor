import nodemailer from 'nodemailer';
import { env } from '../env.js';

// Define email template types
export type EmailTemplate = {
  subject: string;
  text: string;
  html: string;
};

// Create a transporter object
let transporter: nodemailer.Transporter;

// Initialize the transporter
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
  
  // For production with custom SMTP
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
  
  // For development - using Ethereal (fake SMTP service)
  try {
    console.log('No email credentials found, using Ethereal for testing');
    // Create a test account automatically
    const testAccount = await nodemailer.createTestAccount();    
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    // Fallback to a dummy transporter that logs instead of sending
    transporter = {
      sendMail: (mailOptions: any) => {
        console.log('Email would have been sent:');
        console.log('From:', mailOptions.from);
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('Text:', mailOptions.text.substring(0, 100) + '...');
        return Promise.resolve({ messageId: 'dummy-id-' + Date.now() });
      },
    } as any;
  }
};

// Initialize the transporter immediately
initializeTransporter();

// Flag to track if transporter is initialized
let isInitialized = false;

// Function to ensure transporter is initialized
async function ensureTransporter() {
  if (!isInitialized) {
    await initializeTransporter();
    isInitialized = true;
  }
}

/**
 * Send an email
 * @param to - Recipient email address
 * @param template - Email template containing subject, text and HTML content
 * @param from - Optional sender email address (defaults to configured from address)
 * @returns Promise resolving to the nodemailer info object
 */
export async function sendEmail(
  to: string | string[],
  template: EmailTemplate,
  from?: string
) {
  try {
    // Ensure transporter is initialized
    await ensureTransporter();
    
    // If transporter is still not available, log a message and return a dummy response
    if (!transporter) {
      console.log('Email would have been sent:');
      console.log('To:', Array.isArray(to) ? to.join(', ') : to);
      console.log('Subject:', template.subject);
      return { messageId: 'dummy-id-' + Date.now() } as any;
    }
    
    // Determine the sender email address
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
    
    // Log the email attempt
    console.log(`Attempting to send email to: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`Subject: ${template.subject}`);
    console.log(`From: ${senderEmail}`);
    
    const info = await transporter.sendMail({
      from: senderEmail,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: template.subject,
      text: template.text, // Plain text version
      html: template.html, // HTML version
    });

    // Log success information
    console.log('✅ Email sent successfully!');

    // If using Ethereal, provide the preview URL
    if (nodemailer.getTestMessageUrl && nodemailer.getTestMessageUrl(info)) {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    // Provide more helpful error messages based on common issues
    if (error.code === 'EAUTH') {
      console.error('Authentication failed. Check your email credentials.');
    } else if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
      console.error('Connection failed. Check your network and SMTP server settings.');
    } else if (error.code === 'EMESSAGE') {
      console.error('Invalid message format. Check your email content.');
    }
    
    // Log the recipient for debugging
    console.error('Failed to send email to:', Array.isArray(to) ? to.join(', ') : to);
    
    throw error;
  }
}

/**
 * Helper function to create a welcome email template
 * @param name - User's name
 * @returns EmailTemplate
 */
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

/**
 * Helper function to create a password reset email template
 * @param name - User's name
 * @param resetLink - Password reset link
 * @returns EmailTemplate
 */
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

/**
 * Helper function to create a login notification email template
 * @param email - User's email
 * @param deviceInfo - Optional device information
 * @param location - Optional location information
 * @param time - Optional time of login
 * @returns EmailTemplate
 */
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

/**
 * Helper function to create a notification email template
 * @param name - User's name
 * @param message - Notification message
 * @param actionLink - Optional action link
 * @param actionText - Optional action button text
 * @returns EmailTemplate
 */
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

/**
 * Create a custom email template
 * @param subject - Email subject
 * @param text - Plain text content
 * @param html - HTML content
 * @returns EmailTemplate
 */
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
