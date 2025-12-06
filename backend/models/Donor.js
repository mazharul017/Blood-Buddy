import mongoose from 'mongoose';

const donorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
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
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  lastDonationDate: {
    type: Date,
    default: null
  },
  totalDonations: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Donor = mongoose.model('Donor', donorSchema);

export default Donor;

