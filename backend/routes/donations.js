import express from 'express';
import DonationHistory from '../models/DonationHistory.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * Create donation history entry
 * POST /api/donations
 */
router.post('/', authenticate, async (req, res) => {
  try {
    // Support both formats: date or lastDonationDate
    const { 
      recipientId, 
      date, 
      lastDonationDate, 
      nextDonationDate,
      location, 
      certificateUrl, 
      bloodGroup, 
      units 
    } = req.body;

    // Use lastDonationDate if provided, otherwise use date
    const donationDate = lastDonationDate || date;
    
    if (!donationDate || !location || !bloodGroup) {
      return res.status(400).json({ 
        message: 'Date (or lastDonationDate), location, and blood group are required' 
      });
    }

    const donation = new DonationHistory({
      donorId: req.user.userId,
      recipientId,
      date: new Date(donationDate),
      location,
      certificateUrl,
      bloodGroup,
      units: units || 1,
      rewardPoints: 100,
      // If nextDonationDate is provided, use it; otherwise it will be calculated in pre-save hook
      nextEligibleDate: nextDonationDate ? new Date(nextDonationDate) : undefined
    });

    await donation.save();

    // Create thank you notification for donor
    await Notification.create({
      userId: req.user.userId,
      type: 'donation_thanks',
      title: 'Thank You for Donating!',
      message: `Thank you for donating ${bloodGroup} blood. You've earned 100 reward points!`,
      link: `/donations/${donation._id}`,
      metadata: {
        donationId: donation._id
      }
    });

    // Update user's last donation date
    await User.findByIdAndUpdate(req.user.userId, {
      lastDonationDate: donation.date
    });

    res.status(201).json({
      message: 'Donation recorded successfully',
      donation
    });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Get donation history for current user
 * GET /api/donations
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const donations = await DonationHistory.find({ donorId: req.user.userId })
      .populate('recipientId', 'name')
      .sort({ date: -1 });

    res.json({
      count: donations.length,
      donations
    });
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Check if user is eligible to donate
 * GET /api/donations/eligibility/check
 */
router.get('/eligibility/check', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get last donation
    const lastDonation = await DonationHistory.findOne({ donorId: req.user.userId })
      .sort({ date: -1 });

    if (!lastDonation) {
      return res.json({
        eligible: true,
        message: 'No previous donations found. You are eligible to donate.'
      });
    }

    const today = new Date();
    const nextEligibleDate = lastDonation.nextEligibleDate || new Date(lastDonation.date.getTime() + 90 * 24 * 60 * 60 * 1000);
    const daysRemaining = Math.ceil((nextEligibleDate - today) / (1000 * 60 * 60 * 24));

    if (today >= nextEligibleDate) {
      return res.json({
        eligible: true,
        message: 'You are eligible to donate.',
        nextEligibleDate
      });
    } else {
      return res.json({
        eligible: false,
        message: `You can donate again after ${daysRemaining} days.`,
        nextEligibleDate,
        daysRemaining
      });
    }
  } catch (error) {
    console.error('Check eligibility error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Get donation history for a specific user (by userId)
 * GET /api/donations/:userId
 * Note: This route must come after specific routes like /eligibility/check
 */
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if userId is a valid ObjectId format (24 hex characters)
    // If not, it might be a route like /eligibility/check, so skip this handler
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(404).json({ message: 'Invalid user ID format' });
    }
    
    // Allow users to view their own donations or admins to view any user's donations
    if (userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this user\'s donations' });
    }

    const donations = await DonationHistory.find({ donorId: userId })
      .populate('recipientId', 'name')
      .sort({ date: -1 });

    // Calculate eligibility for the most recent donation
    const lastDonation = donations[0];
    let eligibility = {
      eligible: true,
      message: 'You are eligible to donate.',
      nextEligibleDate: null,
      daysRemaining: 0
    };

    if (lastDonation && lastDonation.nextEligibleDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextDate = new Date(lastDonation.nextEligibleDate);
      nextDate.setHours(0, 0, 0, 0);
      const daysRemaining = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

      eligibility = {
        eligible: today >= nextDate,
        message: today >= nextDate 
          ? 'You are eligible to donate.' 
          : `You can donate again in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}.`,
        nextEligibleDate: lastDonation.nextEligibleDate,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0
      };
    }

    res.json({
      count: donations.length,
      donations,
      eligibility
    });
  } catch (error) {
    console.error('Get donations by userId error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Get single donation by ID
 * GET /api/donations/single/:id
 * Note: Using /single/:id to avoid conflict with /:userId route
 */
router.get('/single/:id', authenticate, async (req, res) => {
  try {
    const donation = await DonationHistory.findById(req.params.id)
      .populate('donorId', 'name')
      .populate('recipientId', 'name');

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Only donor or recipient can view
    if (donation.donorId._id.toString() !== req.user.userId && 
        donation.recipientId?._id.toString() !== req.user.userId &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ donation });
  } catch (error) {
    console.error('Get donation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

