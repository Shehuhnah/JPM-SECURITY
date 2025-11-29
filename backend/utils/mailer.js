import nodemailer from "nodemailer";

let transporter = null;
let transporterPromise = null;

const isEmailConfigured = () =>
  process.env.EMAIL_HOST &&
  process.env.EMAIL_PORT &&
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASS;

const getTransporter = async () => {
  // If we already created one, reuse it
  if (transporter) return transporter;

  // If we're already creating one, wait for it to avoid race conditions
  if (transporterPromise) return transporterPromise;

  if (isEmailConfigured()) {
    // Production or manually configured SMTP
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    return transporter;
  }
  // If email is not configured, we should throw an error or handle it explicitly
  // rather than falling back to Ethereal, as per the user's request to remove Ethereal.
  throw new Error("Email configuration missing in .env. Please set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, and optionally EMAIL_FROM.");
};

// ✅ EXPORT the sendMail function
export const sendMail = async ({ to, subject, text, html }) => {
  if (!to) throw new Error("Email recipient is required");

  const mailer = await getTransporter();

  const info = await mailer.sendMail({
    from: process.env.EMAIL_FROM || '"JPM Security Agency" <no-reply@jpmsecurity.test>',
    to,
    subject,
    text,
    html,
  });

  console.log(`📧 Email sent successfully to: ${to}`);

  return info;
};