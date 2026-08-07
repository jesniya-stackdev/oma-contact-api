require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express(); 
app.use(express.json());

// Only allow requests from your actual site domain
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:3000','https://jesniya-stackdev.github.io'] // add your real domain
}));

// Prevent spam/abuse — max 5 submissions per IP every 15 minutes
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
app.use('/api/contact', limiter);

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',   // see note below if this doesn't work
  port: 587,
  secure: true,             // true for port 465, false for port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});    
transporter.verify((err, success) => {
  if (err) {
    console.error('❌ Zoho SMTP connection failed:', err.message);
  } else {
    console.log('✅ Zoho SMTP connection verified — ready to send emails.');
  }
});
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, service, message } = req.body;

  // Basic server-side validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    await transporter.sendMail({
      from: `"OMA Website" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // where you want to receive it
      replyTo: email,
      subject: `New enquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nService: ${service || 'N/A'}\n\nMessage:\n${message}`
    });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send. Please try again later.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));