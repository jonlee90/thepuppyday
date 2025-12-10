/**
 * Business hours utility functions
 */

interface DayHours {
  open: string;
  close: string;
  is_open: boolean;
}

type BusinessHours = Record<string, DayHours>;

/**
 * Check if the business is currently open
 */
export function isCurrentlyOpen(businessHours: BusinessHours): boolean {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const dayHours = businessHours[dayName];

  if (!dayHours || !dayHours.is_open) {
    return false;
  }

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = dayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = dayHours.close.split(':').map(Number);

  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  return currentTime >= openTime && currentTime < closeTime;
}

/**
 * Get the next opening time if currently closed
 */
export function getNextOpenTime(businessHours: BusinessHours): string | null {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // Check today first (if we haven't passed opening time yet)
  const todayName = dayNames[currentDay];
  const todayHours = businessHours[todayName];

  if (todayHours?.is_open) {
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = todayHours.open.split(':').map(Number);
    const openTime = openHour * 60 + openMin;

    if (currentTime < openTime) {
      return `Today at ${formatTime(todayHours.open)}`;
    }
  }

  // Check next 7 days
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDay + i) % 7;
    const nextDayName = dayNames[nextDayIndex];
    const nextDayHours = businessHours[nextDayName];

    if (nextDayHours?.is_open) {
      const dayLabel = i === 1 ? 'Tomorrow' : capitalize(nextDayName);
      return `${dayLabel} at ${formatTime(nextDayHours.open)}`;
    }
  }

  return null;
}

/**
 * Format 24-hour time to 12-hour format
 */
export function formatTime(time: string): string {
  const [hour, minute] = time.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get current day name
 */
export function getCurrentDayName(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}
