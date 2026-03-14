/**
 * Calendar-specific types for custom appointment calendar
 */

export type AppointmentStatusType = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export type CalendarView = 'day' | 'week' | 'month';

export interface Groomer {
  id: string;
  first_name: string;
  last_name: string;
}

export interface CalendarAppointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatusType;
  notes: string | null;
  customer_id: string;
  pet_id: string;
  service_id: string;
  groomer_id: string | null;
  customer: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string | null;
  } | null;
  pet: {
    name: string;
    breed?: string;
    size?: string;
    gender?: string;
    color?: string | null;
  } | null;
  service: {
    name: string;
  } | null;
  groomer: {
    first_name: string;
    last_name: string;
  } | null;
  addons?: Array<{ name: string; price: number }>;
}

export interface GroomerColorMap {
  [groomerId: string]: string;
}

export interface TimeSlot {
  hour: number;
  minute: number;
  label: string;
}

export interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: CalendarAppointment[];
}

export interface DragState {
  isDragging: boolean;
  appointment: CalendarAppointment | null;
  sourceGroomerId: string | null;
  currentX: number;
  currentY: number;
  offsetX: number;
  offsetY: number;
  snapTime: Date | null;
  snapGroomerId: string | null;
}

export interface ResizeState {
  isResizing: boolean;
  appointment: CalendarAppointment | null;
  startY: number;
  originalDuration: number;
  currentDuration: number;
}

export interface CalendarDateRange {
  start: Date;
  end: Date;
}
