import express from 'express';
import Contact from '../models/Contact.js';

const router = express.Router();

// Submit contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, bloodGroup, message } = req.body;

    const contact = new Contact({
      name,
      email,
      phone,
      bloodGroup: bloodGroup || '',
      message
    });

    await contact.save();

    res.status(201).json({
      message: 'Thank you for reaching out! We will contact you soon.',
      contact
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all contact messages (admin only - you can add auth middleware later)
router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      count: contacts.length,
      contacts
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

