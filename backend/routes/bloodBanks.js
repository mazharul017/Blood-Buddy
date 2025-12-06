import express from 'express';
import BloodBank from '../models/BloodBank.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * Get all blood banks
 * GET /api/blood-banks
 */
router.get('/', async (req, res) => {
  try {
    const { bloodGroup, lat, lng, radius } = req.query;
    
    let query = { isActive: true };

    let bloodBanks = await BloodBank.find(query).sort({ name: 1 });

    // Filter by blood group availability if specified
    if (bloodGroup) {
      bloodBanks = bloodBanks.filter(bank => {
        return bank.bloodAvailable[bloodGroup] > 0;
      });
    }

    // Filter by location if lat/lng/radius provided
    if (lat && lng && radius) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = parseFloat(radius) || 50;

      bloodBanks = bloodBanks
        .filter(bank => {
          if (!bank.location?.latitude || !bank.location?.longitude) return false;
          const distance = calculateDistance(
            userLat, 
            userLng, 
            bank.location.latitude, 
            bank.location.longitude
          );
          return distance <= radiusKm;
        })
        .map(bank => {
          const distance = calculateDistance(
            userLat, 
            userLng, 
            bank.location.latitude, 
            bank.location.longitude
          );
          return {
            ...bank.toObject(),
            distance: Math.round(distance * 10) / 10
          };
        })
        .sort((a, b) => a.distance - b.distance);
    }

    res.json({
      count: bloodBanks.length,
      bloodBanks
    });
  } catch (error) {
    console.error('Get blood banks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Get single blood bank
 * GET /api/blood-banks/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const bloodBank = await BloodBank.findById(req.params.id);

    if (!bloodBank) {
      return res.status(404).json({ message: 'Blood bank not found' });
    }

    res.json({ bloodBank });
  } catch (error) {
    console.error('Get blood bank error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Create blood bank (admin only)
 * POST /api/blood-banks
 */
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { name, address, phone, email, location, bloodAvailable, operatingHours } = req.body;

    if (!name || !address || !phone) {
      return res.status(400).json({ message: 'Name, address, and phone are required' });
    }

    const bloodBank = new BloodBank({
      name,
      address,
      phone,
      email,
      location,
      bloodAvailable: bloodAvailable || {},
      operatingHours
    });

    await bloodBank.save();

    res.status(201).json({
      message: 'Blood bank created successfully',
      bloodBank
    });
  } catch (error) {
    console.error('Create blood bank error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Update blood bank (admin only)
 * PATCH /api/blood-banks/:id
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const bloodBank = await BloodBank.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!bloodBank) {
      return res.status(404).json({ message: 'Blood bank not found' });
    }

    res.json({
      message: 'Blood bank updated successfully',
      bloodBank
    });
  } catch (error) {
    console.error('Update blood bank error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to calculate distance
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

export default router;

