import { 
  sendEmail, 
  createWelcomeEmail, 
  createPasswordResetEmail, 
  createNotificationEmail, 
  createCustomEmail,
  createLoginNotificationEmail,
  type EmailTemplate
} from './mail';


export async function sendWelcomeEmail(email: string, name: string) {
  const template = createWelcomeEmail(name);
  return sendEmail(email, template);
}


export async function sendPasswordResetEmail(email: string, name: string, resetToken: string) {
  const resetLink = `${process.env.BETTER_AUTH_URL}/reset-password?token=${resetToken}`;
  const template = createPasswordResetEmail(name, resetLink);
  return sendEmail(email, template);
}


export async function sendLoginNotificationEmail(
  email: string,
  deviceInfo?: string,
  location?: string,
  time?: string
) {
  const template = createLoginNotificationEmail(email, deviceInfo, location, time);
  return sendEmail(email, template);
}

export async function sendNotificationEmail(
  email: string, 
  name: string, 
  message: string, 
  actionLink?: string, 
  actionText?: string
) {
  const template = createNotificationEmail(name, message, actionLink, actionText);
  return sendEmail(email, template);
}

export async function sendCustomEmail(
  email: string,
  subject: string,
  text: string,
  html: string
) {
  const template = createCustomEmail(subject, text, html);
  return sendEmail(email, template);
}


export async function sendWithTemplate(email: string, template: EmailTemplate) {
  return sendEmail(email, template);
}
