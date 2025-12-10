/**
 * Unit tests for booking availability utilities
 */

import {
  getDayName,
  timeToMinutes,
  minutesToTime,
  generateTimeSlots,
  hasConflict,
  isDateAvailable,
  formatTimeDisplay,
  type BusinessHours,
} from '@/lib/booking/availability';
import type { Appointment } from '@/types/database';

const mockBusinessHours: BusinessHours = {
  monday: { open: '09:00', close: '18:00', is_open: true },
  tuesday: { open: '09:00', close: '18:00', is_open: true },
  wednesday: { open: '09:00', close: '18:00', is_open: true },
  thursday: { open: '09:00', close: '18:00', is_open: true },
  friday: { open: '09:00', close: '18:00', is_open: true },
  saturday: { open: '10:00', close: '16:00', is_open: true },
  sunday: { open: '10:00', close: '16:00', is_open: false },
};

describe('getDayName', () => {
  it('returns correct day name for each day of the week', () => {
    // Create dates in local timezone explicitly
    const sunday = new Date(2024, 11, 8); // December 8, 2024 is a Sunday
    expect(getDayName(sunday)).toBe('sunday');

    const monday = new Date(2024, 11, 9); // December 9, 2024 is a Monday
    expect(getDayName(monday)).toBe('monday');

    const friday = new Date(2024, 11, 13); // December 13, 2024 is a Friday
    expect(getDayName(friday)).toBe('friday');

    const saturday = new Date(2024, 11, 14); // December 14, 2024 is a Saturday
    expect(getDayName(saturday)).toBe('saturday');
  });
});

describe('timeToMinutes', () => {
  it('converts midnight to 0', () => {
    expect(timeToMinutes('00:00')).toBe(0);
  });

  it('converts noon to 720', () => {
    expect(timeToMinutes('12:00')).toBe(720);
  });

  it('converts 9:00 AM to 540', () => {
    expect(timeToMinutes('09:00')).toBe(540);
  });

  it('converts 6:30 PM to 1110', () => {
    expect(timeToMinutes('18:30')).toBe(1110);
  });

  it('converts 11:59 PM to 1439', () => {
    expect(timeToMinutes('23:59')).toBe(1439);
  });
});

describe('minutesToTime', () => {
  it('converts 0 to 00:00', () => {
    expect(minutesToTime(0)).toBe('00:00');
  });

  it('converts 720 to 12:00', () => {
    expect(minutesToTime(720)).toBe('12:00');
  });

  it('converts 540 to 09:00', () => {
    expect(minutesToTime(540)).toBe('09:00');
  });

  it('converts 1110 to 18:30', () => {
    expect(minutesToTime(1110)).toBe('18:30');
  });
});

describe('generateTimeSlots', () => {
  it('generates 30-minute slots', () => {
    const slots = generateTimeSlots('09:00', '11:00');
    expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30']);
  });

  it('returns empty array for same open and close time', () => {
    const slots = generateTimeSlots('09:00', '09:00');
    expect(slots).toEqual([]);
  });

  it('generates all-day slots correctly', () => {
    const slots = generateTimeSlots('09:00', '18:00');
    expect(slots.length).toBe(18); // 9 hours * 2 slots/hour
    expect(slots[0]).toBe('09:00');
    expect(slots[slots.length - 1]).toBe('17:30');
  });
});

describe('hasConflict', () => {
  // Create appointment times in a way that's timezone-agnostic for testing
  // Using the format that hasConflict expects
  const createAppointment = (dateStr: string, hour: number, minute: number, duration: number): Appointment => {
    const date = new Date(`${dateStr}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`);
    return {
      id: '1',
      created_at: '2024-01-01',
      customer_id: 'c1',
      pet_id: 'p1',
      service_id: 's1',
      groomer_id: 'g1',
      scheduled_at: date.toISOString(),
      duration_minutes: duration,
      status: 'confirmed',
      payment_status: 'pending',
      total_price: 50,
      notes: null,
    };
  };

  it('returns true when slot overlaps with existing appointment', () => {
    // Existing: 10:00-11:00, trying 10:30 for 60 min
    const appointments = [createAppointment('2024-12-15', 10, 0, 60)];
    expect(hasConflict('10:30', 60, appointments, '2024-12-15')).toBe(true);
  });

  it('returns true when slot starts during existing appointment', () => {
    // Existing: 10:00-11:00, trying 10:00 for 30 min
    const appointments = [createAppointment('2024-12-15', 10, 0, 60)];
    expect(hasConflict('10:00', 30, appointments, '2024-12-15')).toBe(true);
  });

  it('returns false when slot is before existing appointment', () => {
    // Existing: 10:00-11:00, trying 09:00 for 60 min
    const appointments = [createAppointment('2024-12-15', 10, 0, 60)];
    expect(hasConflict('09:00', 60, appointments, '2024-12-15')).toBe(false);
  });

  it('returns false when slot is after existing appointment', () => {
    // Existing: 10:00-11:00, trying 11:00 for 60 min
    const appointments = [createAppointment('2024-12-15', 10, 0, 60)];
    expect(hasConflict('11:00', 60, appointments, '2024-12-15')).toBe(false);
  });

  it('returns false for different date', () => {
    const appointments = [createAppointment('2024-12-15', 10, 0, 60)];
    expect(hasConflict('10:30', 60, appointments, '2024-12-16')).toBe(false);
  });

  it('ignores cancelled appointments', () => {
    const cancelledAppointment = createAppointment('2024-12-15', 10, 0, 60);
    cancelledAppointment.status = 'cancelled';
    expect(hasConflict('10:30', 60, [cancelledAppointment], '2024-12-15')).toBe(false);
  });

  it('ignores no-show appointments', () => {
    const noShowAppointment = createAppointment('2024-12-15', 10, 0, 60);
    noShowAppointment.status = 'no_show';
    expect(hasConflict('10:30', 60, [noShowAppointment], '2024-12-15')).toBe(false);
  });
});

describe('isDateAvailable', () => {
  it('returns true for future weekday when business is open', () => {
    // Use a future Monday (assuming it's open)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now
    // Find next Monday
    while (futureDate.getDay() !== 1) {
      futureDate.setDate(futureDate.getDate() + 1);
    }
    const dateStr = futureDate.toISOString().split('T')[0];
    expect(isDateAvailable(dateStr, mockBusinessHours)).toBe(true);
  });

  it('returns false for Sunday when business is closed', () => {
    // Find a future Sunday
    const futureDate = new Date();
    futureDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    futureDate.setDate(futureDate.getDate() + 30);
    while (futureDate.getDay() !== 0) {
      futureDate.setDate(futureDate.getDate() + 1);
    }
    // Use local date formatting
    const year = futureDate.getFullYear();
    const month = String(futureDate.getMonth() + 1).padStart(2, '0');
    const day = String(futureDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    expect(isDateAvailable(dateStr, mockBusinessHours)).toBe(false);
  });

  it('returns false for past dates', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7); // 7 days ago
    const dateStr = pastDate.toISOString().split('T')[0];
    expect(isDateAvailable(dateStr, mockBusinessHours)).toBe(false);
  });
});

describe('formatTimeDisplay', () => {
  it('formats morning time correctly', () => {
    expect(formatTimeDisplay('09:00')).toBe('9:00 AM');
    expect(formatTimeDisplay('09:30')).toBe('9:30 AM');
  });

  it('formats noon correctly', () => {
    expect(formatTimeDisplay('12:00')).toBe('12:00 PM');
    expect(formatTimeDisplay('12:30')).toBe('12:30 PM');
  });

  it('formats afternoon time correctly', () => {
    expect(formatTimeDisplay('14:00')).toBe('2:00 PM');
    expect(formatTimeDisplay('18:30')).toBe('6:30 PM');
  });

  it('formats midnight correctly', () => {
    expect(formatTimeDisplay('00:00')).toBe('12:00 AM');
    expect(formatTimeDisplay('00:30')).toBe('12:30 AM');
  });

  it('formats 11 AM correctly', () => {
    expect(formatTimeDisplay('11:00')).toBe('11:00 AM');
  });

  it('formats 11 PM correctly', () => {
    expect(formatTimeDisplay('23:00')).toBe('11:00 PM');
  });
});
