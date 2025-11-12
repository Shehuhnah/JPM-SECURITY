import nodemailer from "nodemailer";

let transporter = null;
let transporterPromise = null;

// ✅ Automatically detect if .env email settings exist
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
  } else {
    // 💡 Local dev mode using Ethereal fake SMTP
    transporterPromise = (async () => {
      const testAccount = await nodemailer.createTestAccount();

      const etherealTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      console.log("🧪 [Ethereal] Using test account for email:");
      console.log(`   Login: ${testAccount.user}`);
      console.log(`   Pass:  ${testAccount.pass}`);
      console.log(`   Preview: https://ethereal.email`);

      return etherealTransporter;
    })();

    transporter = await transporterPromise;
    transporterPromise = null; // ✅ Clear promise after resolution
    return transporter;
  }
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

  // If Ethereal, show the preview URL
  if (!isEmailConfigured()) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📧 [Ethereal] Email sent! Preview at: ${previewUrl}`);
    } else {
      console.log(`📧 [Ethereal] Email sent! Check your Ethereal inbox.`);
    }
  } else {
    console.log(`📧 Email sent successfully to: ${to}`);
  }

  return info;
};