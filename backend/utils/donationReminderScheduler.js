import DonationHistory from '../models/DonationHistory.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

/**
 * Check and send donation reminders to users
 * This function should be called periodically (e.g., daily via cron job)
 */
export const checkAndSendReminders = async (io) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find donations where next eligible date is within 7 days
    const upcomingDonations = await DonationHistory.find({
      nextEligibleDate: {
        $gte: today,
        $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      }
    }).populate('donorId', 'name email');

    for (const donation of upcomingDonations) {
      if (!donation.donorId) continue;

      const userId = donation.donorId._id || donation.donorId;
      const daysUntil = Math.ceil(
        (donation.nextEligibleDate - today) / (1000 * 60 * 60 * 24)
      );

      // Check if reminder already sent today
      const existingReminder = await Notification.findOne({
        userId,
        type: 'donation_reminder',
        'metadata.donationId': donation._id,
        createdAt: {
          $gte: new Date(today)
        }
      });

      if (existingReminder) continue;

      // Create notification
      const notification = await Notification.create({
        userId,
        type: 'donation_reminder',
        title: 'Donation Reminder',
        message: daysUntil === 0
          ? `You are eligible to donate blood today! Your last donation was on ${new Date(donation.date).toLocaleDateString()}.`
          : `You will be eligible to donate blood in ${daysUntil} day${daysUntil > 1 ? 's' : ''}. Your last donation was on ${new Date(donation.date).toLocaleDateString()}.`,
        link: '/donations',
        metadata: {
          donationId: donation._id,
          nextEligibleDate: donation.nextEligibleDate,
          daysUntil
        }
      });

      // Emit socket event to user's room
      if (io) {
        io.to(`user_${userId}`).emit('donationReminder', {
          notification,
          donation: {
            _id: donation._id,
            date: donation.date,
            nextEligibleDate: donation.nextEligibleDate,
            bloodGroup: donation.bloodGroup
          }
        });
      }
    }

    console.log(`Checked ${upcomingDonations.length} upcoming donations for reminders`);
  } catch (error) {
    console.error('Error in donation reminder scheduler:', error);
  }
};

/**
 * Initialize the reminder scheduler
 * Runs daily at 9 AM
 */
export const initializeReminderScheduler = (io) => {
  // Run immediately on startup
  checkAndSendReminders(io);

  // Then run daily at 9 AM
  const now = new Date();
  const nextRun = new Date();
  nextRun.setHours(9, 0, 0, 0);
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  const msUntilNextRun = nextRun - now;

  setTimeout(() => {
    checkAndSendReminders(io);
    // Run every 24 hours
    setInterval(() => {
      checkAndSendReminders(io);
    }, 24 * 60 * 60 * 1000);
  }, msUntilNextRun);

  console.log(`Donation reminder scheduler initialized. Next run: ${nextRun.toLocaleString()}`);
};

