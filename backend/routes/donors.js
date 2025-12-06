import express from 'express';
import Donor from '../models/Donor.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register as a donor
router.post('/register', authenticate, async (req, res) => {
  try {
    const { name, bloodGroup, location, phone, email } = req.body;

    // Check if already registered as donor
    const existingDonor = await Donor.findOne({ userId: req.user.userId });
    if (existingDonor) {
      return res.status(400).json({ message: 'You are already registered as a donor' });
    }

    // Create donor profile
    const donor = new Donor({
      userId: req.user.userId,
      name: name || req.user.name,
      bloodGroup,
      location,
      phone,
      email: email || req.user.email
    });

    await donor.save();

    // Update user's isDonor status
    await User.findByIdAndUpdate(req.user.userId, { isDonor: true });

    res.status(201).json({
      message: 'Successfully registered as a donor',
      donor
    });
  } catch (error) {
    console.error('Register donor error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get all donors (volunteers) with location-based search
router.get('/', async (req, res) => {
  try {
    const { bloodGroup, location, lat, lng, radius, city } = req.query;
    
    // Build query for User model (since we're searching users with donorType)
    let query = {};
    
    // Only show verified donors
    query.isVerified = true;
    query.$or = [
      { donorType: 'donor' },
      { donorType: 'both' }
    ];
    
    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }
    
    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }
    
    if (location) {
      query.$or = [
        { city: { $regex: location, $options: 'i' } },
        { address: { $regex: location, $options: 'i' } }
      ];
    }

    let users = await User.find(query)
      .select('name bloodGroup city phone email latitude longitude address')
      .sort({ createdAt: -1 });

    // If lat/lng/radius provided, filter by distance
    if (lat && lng && radius) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = parseFloat(radius) || 50; // Default 50km
      
      users = users
        .filter(user => {
          if (!user.latitude || !user.longitude) return false;
          const distance = calculateDistance(userLat, userLng, user.latitude, user.longitude);
          return distance <= radiusKm;
        })
        .map(user => {
          const distance = calculateDistance(userLat, userLng, user.latitude, user.longitude);
          return {
            ...user.toObject(),
            distance: Math.round(distance * 10) / 10 // Round to 1 decimal
          };
        })
        .sort((a, b) => a.distance - b.distance); // Sort by distance
    }

    // Limit results
    users = users.slice(0, 100);

    res.json({
      count: users.length,
      donors: users
    });
  } catch (error) {
    console.error('Get donors error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single donor by ID
router.get('/:id', async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id)
      .populate('userId', 'name email');

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    res.json({ donor });
  } catch (error) {
    console.error('Get donor error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user's donor profile
router.get('/profile/me', authenticate, async (req, res) => {
  try {
    const donor = await Donor.findOne({ userId: req.user.userId })
      .populate('userId', 'name email');

    if (!donor) {
      return res.status(404).json({ message: 'You are not registered as a donor' });
    }

    res.json({ donor });
  } catch (error) {
    console.error('Get donor profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update donor profile
router.patch('/profile/me', authenticate, async (req, res) => {
  try {
    const updates = req.body;
    const donor = await Donor.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    res.json({
      message: 'Donor profile updated successfully',
      donor
    });
  } catch (error) {
    console.error('Update donor profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update donor availability
router.patch('/profile/availability', authenticate, async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const donor = await Donor.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: { isAvailable } },
      { new: true }
    );

    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    res.json({
      message: 'Availability updated successfully',
      donor
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

