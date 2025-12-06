import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  age: {
    type: Number,
    min: [18, 'Age must be at least 18 for donors']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    minlength: [4, 'Password must be at least 4 characters']
  },
  passwordHash: {
    type: String
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  donorType: {
    type: String,
    enum: ['donor', 'recipient', 'both'],
    default: 'recipient'
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  idProofUrl: {
    type: String
  },
  medicalClearance: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'donor', 'admin'],
    default: 'user'
  },
  isDonor: {
    type: Boolean,
    default: false
  },
  // OAuth fields
  googleId: {
    type: String
  },
  facebookId: {
    type: String
  },
  oauthProvider: {
    type: String,
    enum: ['local', 'google', 'facebook']
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified and exists
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.password, salt);
    this.password = undefined; // Don't store plain password
    next();
  } catch (error) {
    next(error);
  }
});

// Validate age for donors
userSchema.pre('save', function(next) {
  if (this.donorType === 'donor' || this.donorType === 'both') {
    if (!this.age || this.age < 18) {
      return next(new Error('Donors must be at least 18 years old'));
    }
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Create 2dsphere index for geolocation queries
userSchema.index({ latitude: 1, longitude: 1 });

const User = mongoose.model('User', userSchema);

export default User;

