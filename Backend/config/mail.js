// TODO: MANUAL SETUP REQUIRED — See Backend/manual_setup.md (Section 1: Email/SMTP Setup)
// Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL to your .env file
// Without these, emails are skipped silently (server still works normally)
const nodemailer = require('nodemailer');
const config = require('./config');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });
};

// Base email sender
const sendEmail = async ({ to, subject, html }) => {
  if (!config.smtpUser || !config.smtpPass) {
    console.warn('[MAIL] Email not configured — skipping email send.');
    return;
  }

  const transporter = createTransporter();
  const mailOptions = {
    from: `"AlumniNet" <${config.fromEmail}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
  console.log(`[MAIL] Email sent to: ${to}`);
};

// ─── SHARED STYLES ────────────────────────────────────────────────
const baseStyles = `
  font-family: Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  color: #111827;
`;

const btnStyle = `
  display: inline-block;
  background: #4F46E5;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  margin-top: 16px;
  font-weight: bold;
`;

const footerStyle = `
  color: #6B7280;
  font-size: 12px;
  margin-top: 24px;
  border-top: 1px solid #E5E7EB;
  padding-top: 16px;
`;

const badgeStyle = (bg) => `
  display: inline-block;
  background: ${bg};
  color: white;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: bold;
`;

// ─── EMAIL TEMPLATES ─────────────────────────────────────────────

exports.sendWelcomeEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: 'Welcome to AlumniNet',
    html: `
      <div style="${baseStyles}">
        <div style="background: #4F46E5; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 1px;">AlumniNet</h1>
          <p style="color: #C7D2FE; margin: 4px 0 0;">Alumni Management Platform</p>
        </div>

        <div style="padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1F2937;">Welcome, ${user.name}!</h2>
          <p>We are excited to have you join the AlumniNet community.</p>

          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px; background: #F9FAFB; border: 1px solid #E5E7EB; width: 40%;"><strong>Role</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB;">
                <span style="${badgeStyle('#4F46E5')}">${user.role.toUpperCase()}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px; background: #F9FAFB; border: 1px solid #E5E7EB;"><strong>Department</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB;">${user.department}</td>
            </tr>
            <tr>
              <td style="padding: 8px; background: #F9FAFB; border: 1px solid #E5E7EB;"><strong>Batch</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB;">${user.batch}</td>
            </tr>
          </table>

          <p style="font-weight: bold; margin-top: 20px; color: #374151;">What you can do on AlumniNet:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 12px; border-left: 3px solid #4F46E5; background: #F5F3FF; margin-bottom: 8px; display: block;">
                Connect with fellow alumni and students
              </td>
            </tr>
            <tr><td style="height: 6px;"></td></tr>
            <tr>
              <td style="padding: 8px 12px; border-left: 3px solid #4F46E5; background: #F5F3FF; display: block;">
                Browse job and internship opportunities
              </td>
            </tr>
            <tr><td style="height: 6px;"></td></tr>
            <tr>
              <td style="padding: 8px 12px; border-left: 3px solid #4F46E5; background: #F5F3FF; display: block;">
                Stay updated on events and reunions
              </td>
            </tr>
            <tr><td style="height: 6px;"></td></tr>
            <tr>
              <td style="padding: 8px 12px; border-left: 3px solid #4F46E5; background: #F5F3FF; display: block;">
                Give or receive mentorship from industry experts
              </td>
            </tr>
          </table>

          <a href="${config.frontendUrl}/dashboard" style="${btnStyle}">
            Go to Dashboard &rarr;
          </a>

          <p style="${footerStyle}">
            This email was sent by AlumniNet. If you did not register, please ignore this email.
          </p>
        </div>
      </div>
    `,
  });
};

exports.sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${config.frontendUrl}/reset-password/${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: 'AlumniNet — Reset Your Password',
    html: `
      <div style="${baseStyles}">
        <div style="background: #4F46E5; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">AlumniNet</h1>
          <p style="color: #C7D2FE; margin: 4px 0 0;">Password Reset Request</p>
        </div>

        <div style="padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1F2937;">Reset Your Password</h2>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>We received a request to reset your AlumniNet password. Click the button below to create a new password:</p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="${btnStyle}">
              Reset Password &rarr;
            </a>
          </div>

          <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 6px; padding: 12px; margin-top: 16px;">
            <strong>Note:</strong> This link will expire in <strong>15 minutes</strong>.
          </div>

          <p style="margin-top: 16px;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>

          <p style="${footerStyle}">
            For security, never share this link with anyone. &mdash; AlumniNet Security Team
          </p>
        </div>
      </div>
    `,
  });
};

exports.sendEventNotificationEmail = async (user, event) => {
  await sendEmail({
    to: user.email,
    subject: `AlumniNet Event: ${event.title}`,
    html: `
      <div style="${baseStyles}">
        <div style="background: #4F46E5; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">AlumniNet</h1>
          <p style="color: #C7D2FE; margin: 4px 0 0;">Event Registration Confirmed</p>
        </div>

        <div style="padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1F2937;">You are registered for: ${event.title}</h2>
          <p>Hi <strong>${user.name}</strong>, your event registration is confirmed.</p>

          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 10px; background: #F9FAFB; border: 1px solid #E5E7EB; width: 35%;"><strong>Event</strong></td>
              <td style="padding: 10px; border: 1px solid #E5E7EB;">${event.title}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #F9FAFB; border: 1px solid #E5E7EB;"><strong>Date</strong></td>
              <td style="padding: 10px; border: 1px solid #E5E7EB;">${new Date(event.date).toDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #F9FAFB; border: 1px solid #E5E7EB;"><strong>Location</strong></td>
              <td style="padding: 10px; border: 1px solid #E5E7EB;">${event.location}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #F9FAFB; border: 1px solid #E5E7EB;"><strong>Description</strong></td>
              <td style="padding: 10px; border: 1px solid #E5E7EB;">${event.description}</td>
            </tr>
          </table>

          <a href="${config.frontendUrl}/events" style="${btnStyle}">
            View All Events &rarr;
          </a>

          <p style="${footerStyle}">
            This confirmation was sent by AlumniNet. Please keep this for your records.
          </p>
        </div>
      </div>
    `,
  });
};

exports.sendMentorshipRequestEmail = async (mentor, student) => {
  await sendEmail({
    to: mentor.email,
    subject: `AlumniNet — New Mentorship Request from ${student.name}`,
    html: `
      <div style="${baseStyles}">
        <div style="background: #4F46E5; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">AlumniNet</h1>
          <p style="color: #C7D2FE; margin: 4px 0 0;">New Mentorship Request</p>
        </div>

        <div style="padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1F2937;">New Mentorship Request</h2>
          <p>Hi <strong>${mentor.name}</strong>,</p>
          <p>A student has requested you as their mentor on AlumniNet.</p>

          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 10px; background: #F9FAFB; border: 1px solid #E5E7EB; width: 35%;"><strong>Student Name</strong></td>
              <td style="padding: 10px; border: 1px solid #E5E7EB;">${student.name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #F9FAFB; border: 1px solid #E5E7EB;"><strong>Department</strong></td>
              <td style="padding: 10px; border: 1px solid #E5E7EB;">${student.department}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #F9FAFB; border: 1px solid #E5E7EB;"><strong>Batch</strong></td>
              <td style="padding: 10px; border: 1px solid #E5E7EB;">${student.batch}</td>
            </tr>
          </table>

          <a href="${config.frontendUrl}/mentorship" style="${btnStyle}">
            View Request &rarr;
          </a>

          <p style="margin-top: 16px; color: #6B7280; font-size: 13px;">
            You can accept or decline this request from your mentorship dashboard.
          </p>

          <p style="${footerStyle}">
            This notification was sent by AlumniNet.
          </p>
        </div>
      </div>
    `,
  });
};
