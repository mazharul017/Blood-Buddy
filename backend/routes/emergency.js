import express from 'express';
import EmergencyRequest from '../models/EmergencyRequest.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * Create emergency request
 * POST /api/emergency
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { bloodGroup, hospital, contact, message, location, urgency } = req.body;

    if (!bloodGroup || !hospital || !contact) {
      return res.status(400).json({ message: 'Blood group, hospital, and contact are required' });
    }

    const emergencyRequest = new EmergencyRequest({
      requesterId: req.user.userId,
      bloodGroup,
      hospital,
      contact,
      message,
      location,
      urgency: urgency || 'urgent',
      status: 'open'
    });

    await emergencyRequest.save();

    // Create notification for matching donors
    const matchingDonors = await User.find({
      bloodGroup,
      isVerified: true,
      $or: [
        { donorType: 'donor' },
        { donorType: 'both' }
      ]
    }).select('_id');

    // Create notifications for all matching donors
    const notifications = matchingDonors.map(donor => ({
      userId: donor._id,
      type: 'emergency_request',
      title: 'Emergency Blood Request',
      message: `Emergency request for ${bloodGroup} blood at ${hospital}`,
      link: `/emergency/${emergencyRequest._id}`,
      metadata: {
        emergencyRequestId: emergencyRequest._id,
        bloodGroup,
        hospital
      }
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    // Emit socket event (will be handled in server.js)
    req.io?.emit('new_emergency', {
      emergencyRequest,
      matchingDonorsCount: matchingDonors.length
    });

    res.status(201).json({
      message: 'Emergency request created successfully',
      emergencyRequest
    });
  } catch (error) {
    console.error('Create emergency error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Get all open emergency requests
 * GET /api/emergency
 */
router.get('/', async (req, res) => {
  try {
    const { status, bloodGroup } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    } else {
      query.status = 'open'; // Default to open requests
    }
    
    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }

    const emergencyRequests = await EmergencyRequest.find(query)
      .populate('requesterId', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      count: emergencyRequests.length,
      emergencyRequests
    });
  } catch (error) {
    console.error('Get emergency requests error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Get single emergency request
 * GET /api/emergency/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const emergencyRequest = await EmergencyRequest.findById(req.params.id)
      .populate('requesterId', 'name phone email');

    if (!emergencyRequest) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    res.json({ emergencyRequest });
  } catch (error) {
    console.error('Get emergency request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Update emergency request status
 * PATCH /api/emergency/:id
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const emergencyRequest = await EmergencyRequest.findById(req.params.id);

    if (!emergencyRequest) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    // Only requester or admin can update
    if (emergencyRequest.requesterId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    emergencyRequest.status = status || emergencyRequest.status;
    await emergencyRequest.save();

    res.json({
      message: 'Emergency request updated successfully',
      emergencyRequest
    });
  } catch (error) {
    console.error('Update emergency request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

