import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
const asyncHandler = require('express-async-handler');

interface MailData {
  email: string;
  html: string;
}
const sendMail = asyncHandler(async ({ email, html }: MailData) => {
  let transporter: Transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_NAME,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  let info = await transporter.sendMail({
    from: 'Gia dụng Haven <no-relply@cuahanggiadung.com>',
    to: email,
    subject: 'Quên mật khẩu',
    html: html,
  });
  return info;
});

export default sendMail;
