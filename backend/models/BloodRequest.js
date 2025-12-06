import mongoose from 'mongoose';

const bloodRequestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  bloodGroup: {
    type: String,
    required: [true, 'Blood group is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  hospital: {
    type: String,
    trim: true,
    default: ''
  },
  urgency: {
    type: String,
    enum: ['normal', 'urgent', 'critical'],
    default: 'normal'
  },
  unitsNeeded: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'fulfilled', 'cancelled'],
    default: 'active'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  responses: [{
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    donorName: String,
    donorPhone: String,
    respondedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);

export default BloodRequest;

