/**
 * Calendar constants - business hours, slot config, groomer colors
 */

// Business hours
export const BUSINESS_HOURS = {
  start: 9, // 9 AM
  end: 17, // 5 PM
  daysOfWeek: [1, 2, 3, 4, 5, 6], // Mon-Sat
};

// Display hours (business hours + extended hours for late appointments)
export const DISPLAY_HOURS = {
  start: 9, // 9 AM
  end: 20, // 8 PM (extended from 6 PM for flexibility)
};

// Slot configuration
export const SLOT_CONFIG = {
  pixelsPerMinute: 2,
  snapMinutes: 15,
  slotDurationMinutes: 30,
  labelIntervalMinutes: 60,
};

// Lane dimensions
export const LANE_CONFIG = {
  headerWidth: 120, // Groomer name column width
  minLaneHeight: 60, // Minimum height per lane
  timeColumnWidth: 60, // Left time labels column
};

// Touch interaction thresholds
export const TOUCH_CONFIG = {
  longPressMs: 300,
  dragThresholdPx: 8,
  clickMaxMs: 150,
  resizeHandleHeight: 20,
  minTouchTarget: 44, // iPad HIG minimum
};

// Groomer color palette
export const GROOMER_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
];

export const UNASSIGNED_COLOR = '#9CA3AF';

// Status colors (matches appointment-status.ts)
export const STATUS_COLORS: Record<string, string> = {
  pending: '#FCD34D',
  confirmed: '#10B981',
  in_progress: '#6B7280',
  completed: '#434E54',
  cancelled: '#EF4444',
  no_show: '#DC2626',
};

// Design system colors
export const THEME = {
  primary: '#434E54',
  primaryHover: '#363F44',
  background: '#F8EEE5',
  backgroundLight: '#FFFBF7',
  surface: '#FFFFFF',
  muted: '#6B7280',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  accent: '#EAE0D5',
  accentHover: '#DCD2C7',
};

// Month view
export const MONTH_CONFIG = {
  maxVisibleAppointments: 3, // Show "+N more" after this
  chipHeight: 24,
  chipGap: 2,
};

// Animation config
export const ANIMATION = {
  cardAppear: { duration: 0.15, scale: { from: 0.95, to: 1 } },
  dragSpring: { stiffness: 400, damping: 30 },
  viewTransition: { duration: 0.2 },
  nowPulse: { duration: 2 },
};
