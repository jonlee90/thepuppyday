/**
 * Utility functions for notification settings
 */

/**
 * Parse cron expression to human-readable format
 * Supports basic cron patterns (minute hour day month weekday)
 */
export function parseCronExpression(cron: string | null): string {
  if (!cron) {
    return 'Manual';
  }

  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    return 'Custom schedule';
  }

  const [minute, hour, day, month, weekday] = parts;

  // Daily pattern: "0 9 * * *" -> "Daily at 9:00 AM"
  if (day === '*' && month === '*' && weekday === '*') {
    // Every N hours: "0 */2 * * *" -> "Every 2 hours"
    if (minute === '0' && hour.startsWith('*/')) {
      const hours = hour.replace('*/', '');
      return `Every ${hours} hours`;
    }

    // Daily at specific time
    if (minute === '0' && hour !== '*' && !hour.includes('/') && !hour.includes(',')) {
      const hourNum = parseInt(hour);
      if (!isNaN(hourNum)) {
        const time = formatTime(hourNum, 0);
        return `Daily at ${time}`;
      }
    }
  }

  // Weekly pattern: "0 9 * * 1" -> "Weekly on Monday at 9:00 AM"
  if (day === '*' && month === '*' && weekday !== '*' && !weekday.includes('/') && !weekday.includes(',')) {
    const dayName = getDayName(parseInt(weekday));
    const hourNum = parseInt(hour);
    const minuteNum = parseInt(minute);
    const time = formatTime(hourNum, minuteNum);
    return `Weekly on ${dayName} at ${time}`;
  }

  // Monthly pattern: "0 9 1 * *" -> "Monthly on the 1st at 9:00 AM"
  if (day !== '*' && month === '*' && weekday === '*' && !day.includes('/') && !day.includes(',')) {
    const dayNum = parseInt(day);
    const dayStr = formatDayOfMonth(dayNum);
    const hourNum = parseInt(hour);
    const minuteNum = parseInt(minute);
    const time = formatTime(hourNum, minuteNum);
    return `Monthly on the ${dayStr} at ${time}`;
  }

  // Fall back to showing the cron expression
  return `Custom: ${cron}`;
}

/**
 * Format hour and minute to 12-hour time
 */
function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const minuteStr = minute.toString().padStart(2, '0');
  return `${hour12}:${minuteStr} ${period}`;
}

/**
 * Get day name from cron weekday (0-6, Sunday = 0)
 */
function getDayName(weekday: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[weekday] || 'Unknown';
}

/**
 * Format day of month with ordinal suffix
 */
function formatDayOfMonth(day: number): string {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const v = day % 100;
  return day + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: string | null): string {
  if (!date) {
    return 'Never';
  }

  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();

  if (diffMs < 0) {
    return 'Just now';
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  }
}

/**
 * Calculate failure rate percentage
 * Returns null if no messages have been sent
 */
export function calculateFailureRate(totalSent: number, totalFailed: number): number | null {
  if (totalSent === 0) {
    return null;
  }
  return (totalFailed / totalSent) * 100;
}

/**
 * Get color class based on failure rate
 */
export function getFailureRateColor(rate: number | null): string {
  if (rate === null) {
    return 'text-gray-500';
  }
  if (rate < 5) {
    return 'text-green-600';
  }
  if (rate < 10) {
    return 'text-amber-600';
  }
  return 'text-red-600';
}

/**
 * Format failure rate for display
 */
export function formatFailureRate(rate: number | null): string {
  if (rate === null) {
    return 'N/A';
  }
  return `${rate.toFixed(1)}%`;
}

/**
 * Convert notification type key to human-readable label
 */
export function getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    appointment_reminder: 'Appointment Reminder',
    appointment_confirmed: 'Appointment Confirmed',
    appointment_cancelled: 'Appointment Cancelled',
    appointment_booked: 'Appointment Booked',
    appointment_completed: 'Appointment Completed',
    appointment_no_show: 'No Show Notice',
    report_card_sent: 'Report Card',
    waitlist_added: 'Waitlist Added',
    waitlist_slot_available: 'Slot Available',
    breed_reminder: 'Grooming Reminder',
    marketing_campaign: 'Marketing Campaign',
    payment_received: 'Payment Received',
    user_registered: 'Welcome Email',
    password_reset: 'Password Reset',
  };

  return labels[type] || type.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

/**
 * Format count with thousands separator
 */
export function formatCount(count: number): string {
  return count.toLocaleString();
}
