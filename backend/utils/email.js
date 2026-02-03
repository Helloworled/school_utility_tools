const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'your_email@example.com',
      pass: process.env.EMAIL_PASSWORD || 'your_email_password'
    }
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@schoolutility.com',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your account. Click the link below to reset your password:</p>
          <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>Thank you,<br>School Utility Tools Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

// Send verification code email
const sendVerificationCodeEmail = async (email, code, type) => {
  try {
    const transporter = createTransporter();

    const subject = type === 'login' ? 'Login Verification Code' : 'Password Reset Verification Code';
    const purpose = type === 'login' ? 'to login to your account' : 'to reset your password';

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@schoolutility.com',
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>${subject}</h2>
          <p>Your verification code is: <strong style="font-size: 24px; color: #4CAF50;">${code}</strong></p>
          <p>Use this code ${purpose}.</p>
          <p>This code will expire in 15 minutes.</p>
          <p>If you did not request this code, please ignore this email.</p>
          <p>Thank you,<br>School Utility Tools Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending verification code email:', error);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendVerificationCodeEmail
};
