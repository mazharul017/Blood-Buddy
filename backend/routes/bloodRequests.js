import express from 'express';
import BloodRequest from '../models/BloodRequest.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Create a new blood request
router.post('/', async (req, res) => {
  try {
    const { name, bloodGroup, location, phone, hospital, urgency, unitsNeeded, notes } = req.body;

    const bloodRequest = new BloodRequest({
      name,
      bloodGroup,
      location,
      phone,
      hospital: hospital || '',
      urgency: urgency || 'normal',
      unitsNeeded: unitsNeeded || 1,
      notes: notes || '',
      userId: req.body.userId || null
    });

    await bloodRequest.save();

    res.status(201).json({
      message: 'Blood request created successfully',
      bloodRequest
    });
  } catch (error) {
    console.error('Create blood request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all active blood requests
router.get('/', async (req, res) => {
  try {
    const { bloodGroup, location, urgency } = req.query;
    
    let query = { status: 'active' };
    
    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (urgency) {
      query.urgency = urgency;
    }

    const bloodRequests = await BloodRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .limit(50);

    res.json({
      count: bloodRequests.length,
      bloodRequests
    });
  } catch (error) {
    console.error('Get blood requests error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single blood request by ID
router.get('/:id', async (req, res) => {
  try {
    const bloodRequest = await BloodRequest.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('responses.donorId', 'name email');

    if (!bloodRequest) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    res.json({ bloodRequest });
  } catch (error) {
    console.error('Get blood request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Respond to a blood request (donor responds)
router.post('/:id/respond', authenticate, async (req, res) => {
  try {
    const { donorName, donorPhone } = req.body;
    const bloodRequest = await BloodRequest.findById(req.params.id);

    if (!bloodRequest) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    if (bloodRequest.status !== 'active') {
      return res.status(400).json({ message: 'This blood request is no longer active' });
    }

    // Add response
    bloodRequest.responses.push({
      donorId: req.user.userId,
      donorName: donorName || req.user.name,
      donorPhone: donorPhone || '',
      respondedAt: new Date()
    });

    await bloodRequest.save();

    res.json({
      message: 'Response recorded successfully',
      bloodRequest
    });
  } catch (error) {
    console.error('Respond to blood request error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update blood request status (mark as fulfilled or cancelled)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const bloodRequest = await BloodRequest.findById(req.params.id);

    if (!bloodRequest) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    if (!['active', 'fulfilled', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    bloodRequest.status = status;
    await bloodRequest.save();

    res.json({
      message: 'Blood request status updated',
      bloodRequest
    });
  } catch (error) {
    console.error('Update blood request status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's blood requests
router.get('/user/my-requests', authenticate, async (req, res) => {
  try {
    const bloodRequests = await BloodRequest.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });

    res.json({
      count: bloodRequests.length,
      bloodRequests
    });
  } catch (error) {
    console.error('Get user blood requests error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

