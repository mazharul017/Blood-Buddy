import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * Verify user (admin only)
 * PATCH /api/admin/verify/:userId
 */
router.patch('/verify/:userId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { isVerified, idProofUrl, medicalClearance } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        $set: {
          isVerified: isVerified !== undefined ? isVerified : true,
          ...(idProofUrl && { idProofUrl }),
          ...(medicalClearance && { medicalClearance })
        }
      },
      { new: true }
    ).select('-password -passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User verification updated successfully',
      user
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Get all users (admin only)
 * GET /api/admin/users
 */
router.get('/users', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const users = await User.find()
      .select('-password -passwordHash')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

