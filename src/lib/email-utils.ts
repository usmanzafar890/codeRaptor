import { 
  sendEmail, 
  createWelcomeEmail, 
  createPasswordResetEmail, 
  createNotificationEmail, 
  createCustomEmail,
  createLoginNotificationEmail,
  type EmailTemplate
} from './mail';

/**
 * Utility class for sending emails from anywhere in the application
 */
export class EmailService {
  /**
   * Send a welcome email to a new user
   * @param email - Recipient email address
   * @param name - Recipient name
   * @returns Promise resolving to the nodemailer info object
   */
  static async sendWelcomeEmail(email: string, name: string) {
    const template = createWelcomeEmail(name);
    return sendEmail(email, template);
  }

  /**
   * Send a password reset email
   * @param email - Recipient email address
   * @param name - Recipient name
   * @param resetToken - Password reset token
   * @returns Promise resolving to the nodemailer info object
   */
  static async sendPasswordResetEmail(email: string, name: string, resetToken: string) {
    const resetLink = `${process.env.BETTER_AUTH_URL}/reset-password?token=${resetToken}`;
    const template = createPasswordResetEmail(name, resetLink);
    return sendEmail(email, template);
  }

  /**
   * Send a login notification email
   * @param email - Recipient email address
   * @param deviceInfo - Optional device information
   * @param location - Optional location information
   * @param time - Optional time of login
   * @returns Promise resolving to the nodemailer info object
   */
  static async sendLoginNotificationEmail(
    email: string,
    deviceInfo?: string,
    location?: string,
    time?: string
  ) {
    const template = createLoginNotificationEmail(email, deviceInfo, location, time);
    return sendEmail(email, template);
  }

  /**
   * Send a notification email
   * @param email - Recipient email address
   * @param name - Recipient name
   * @param message - Notification message
   * @param actionLink - Optional action link
   * @param actionText - Optional action button text
   * @returns Promise resolving to the nodemailer info object
   */
  static async sendNotificationEmail(
    email: string, 
    name: string, 
    message: string, 
    actionLink?: string, 
    actionText?: string
  ) {
    const template = createNotificationEmail(name, message, actionLink, actionText);
    return sendEmail(email, template);
  }

  /**
   * Send a custom email
   * @param email - Recipient email address
   * @param subject - Email subject
   * @param text - Plain text content
   * @param html - HTML content
   * @returns Promise resolving to the nodemailer info object
   */
  static async sendCustomEmail(
    email: string,
    subject: string,
    text: string,
    html: string
  ) {
    const template = createCustomEmail(subject, text, html);
    return sendEmail(email, template);
  }

  /**
   * Send an email with a custom template
   * @param email - Recipient email address
   * @param template - Email template
   * @returns Promise resolving to the nodemailer info object
   */
  static async sendWithTemplate(email: string, template: EmailTemplate) {
    return sendEmail(email, template);
  }
}
