import mongoose from 'mongoose';

const donationHistorySchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  certificateUrl: {
    type: String
  },
  rewardPoints: {
    type: Number,
    default: 100
  },
  nextEligibleDate: {
    type: Date
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
  },
  units: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Calculate next eligible date before saving (90 days after donation)
donationHistorySchema.pre('save', function(next) {
  if (this.date && !this.nextEligibleDate) {
    const nextDate = new Date(this.date);
    nextDate.setDate(nextDate.getDate() + 90);
    this.nextEligibleDate = nextDate;
  }
  next();
});

donationHistorySchema.index({ donorId: 1, date: -1 });
donationHistorySchema.index({ recipientId: 1 });

const DonationHistory = mongoose.model('DonationHistory', donationHistorySchema);

export default DonationHistory;

