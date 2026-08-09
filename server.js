require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

// Only allow requests from your actual site domain
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:3000', 'https://jesniya-stackdev.github.io','https://oma-business-hub.onrender.com']
}));

// Prevent spam/abuse — max 5 submissions per IP every 15 minutes
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
app.use('/api/contact', limiter);

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
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,   // e.g. "OMA Website <onboarding@resend.dev>" or your verified domain address
        to: process.env.EMAIL_TO,        // the inbox you want enquiries delivered to
        reply_to: email,
        subject: `New enquiry from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nService: ${service || 'N/A'}\n\nMessage:\n${message}`
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Resend error:', errData);
      return res.status(502).json({ error: 'Failed to send. Please try again later.' });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send. Please try again later.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));