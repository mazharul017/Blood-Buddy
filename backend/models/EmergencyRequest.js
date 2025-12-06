import mongoose from 'mongoose';

const emergencyRequestSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
  },
  hospital: {
    type: String,
    required: true,
    trim: true
  },
  contact: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  urgency: {
    type: String,
    enum: ['normal', 'urgent', 'critical'],
    default: 'urgent'
  }
}, {
  timestamps: true
});

emergencyRequestSchema.index({ status: 1, createdAt: -1 });
emergencyRequestSchema.index({ requesterId: 1 });

const EmergencyRequest = mongoose.model('EmergencyRequest', emergencyRequestSchema);

export default EmergencyRequest;

