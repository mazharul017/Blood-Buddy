// backend/routes/auth.js
// Copy this file over your existing routes/auth.js
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Donor from '../models/Donor.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * Helper: create JWT for a user object
 */
function createToken(user) {
  const payload = { userId: user._id, email: user.email, role: user.role || 'user' };
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  // Ensure you have set JWT_SECRET in your backend/.env
  if (!secret || secret === 'your-secret-key-change-in-production') {
    console.warn('⚠️  WARNING: Using default JWT_SECRET. Set JWT_SECRET in .env for production!');
  }
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

/**
 * Register new user
 * - Supports email/password or phone registration
 * - hashes password with bcrypt
 * - prevents duplicate email/phone
 * - returns token and user info (without password)
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, age, gender, bloodGroup, address, city, donorType, latitude, longitude } = req.body;

    // Basic validation - require either email+password OR phone
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (!email && !phone) {
      return res.status(400).json({ message: 'Either email or phone is required' });
    }

    if (email && !password) {
      return res.status(400).json({ message: 'Password is required when registering with email' });
    }

    // Check if user already exists
    if (email) {
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }
    }

    if (phone) {
      const existingUser = await User.findOne({ phone: phone.trim() });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this phone number' });
      }
    }

    // Validate age for donors
    if ((donorType === 'donor' || donorType === 'both') && age && age < 18) {
      return res.status(400).json({ message: 'Donors must be at least 18 years old' });
    }

    // Create new user (password will be hashed by User model's pre-save hook)
    const userData = {
      name: name.trim(),
      oauthProvider: 'local',
      role: 'user',
      isDonor: false
    };

    if (email) {
      userData.email = email.toLowerCase().trim();
      userData.password = password;
    }

    if (phone) userData.phone = phone.trim();
    if (age) userData.age = age;
    if (gender) userData.gender = gender;
    if (bloodGroup) userData.bloodGroup = bloodGroup;
    if (address) userData.address = address.trim();
    if (city) userData.city = city.trim();
    if (donorType) userData.donorType = donorType;
    if (latitude !== undefined) userData.latitude = latitude;
    if (longitude !== undefined) userData.longitude = longitude;

    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = createToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isDonor: user.isDonor,
        donorType: user.donorType
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

/**
 * Login user
 * - finds user by email or phone
 * - compares password with bcrypt
 * - returns token and user info
 */
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Basic validation
    if ((!email && !phone) || !password) {
      return res.status(400).json({ message: 'Email or phone and password are required' });
    }

    // Find user by email or phone
    let user;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    } else {
      user = await User.findOne({ phone: phone.trim() });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user has password (OAuth users might not have password)
    if (!user.passwordHash) {
      return res.status(401).json({ message: 'Please use OAuth login for this account' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = createToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isDonor: user.isDonor,
        donorType: user.donorType
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

/**
 * Get current user (protected route)
 * - authenticate middleware should set req.user (with userId)
 * - returns user data without password and donor info if exists
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    // authenticate middleware must set req.user.userId
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Return user except password
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is a donor
    const donor = await Donor.findOne({ userId: user._id });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isDonor: user.isDonor
      },
      donor: donor || null
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Update user profile
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const updates = req.body;
    
    // Validate age for donors
    if ((updates.donorType === 'donor' || updates.donorType === 'both') && updates.age && updates.age < 18) {
      return res.status(400).json({ message: 'Donors must be at least 18 years old' });
    }

    // Don't allow password update through this route
    delete updates.password;
    delete updates.passwordHash;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
