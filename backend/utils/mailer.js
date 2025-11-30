import { Resend } from 'resend';

let resend;

const isEmailConfigured = () => !!process.env.RESEND_API_KEY;

const getResendInstance = () => {
  if (resend) return resend;

  if (isEmailConfigured()) {
    resend = new Resend(process.env.RESEND_API_KEY);
    return resend;
  }
  
  throw new Error("Email configuration missing in .env. Please set RESEND_API_KEY and EMAIL_FROM.");
};

export const sendMail = async ({ to, subject, html, text }) => {
  if (!to) throw new Error("Email recipient is required");

  const resendInstance = getResendInstance();

  try {
    const { data, error } = await resendInstance.emails.send({
      from: process.env.EMAIL_FROM || 'JPM Security <onboarding@resend.dev>', // A verified domain on Resend is required
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: html,
      text: text, // Resend can also accept a text version
    });

    if (error) {
      console.error("Resend API Error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log(`📧 Email sent successfully to: ${to}`, data);
    return data;
  } catch (error) {
    console.error("Error sending email via Resend:", error);
    throw error;
  }
};