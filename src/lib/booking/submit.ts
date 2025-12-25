/**
 * Booking submission utilities
 * Handles submission for customer, admin, and walk-in booking flows
 */

import type { BookingModalMode } from '@/hooks/useBookingModal';
import type { BookingStore } from '@/stores/bookingStore';
import type { PetSize } from '@/types/database';

export interface BookingSubmissionResult {
  success: boolean;
  appointmentId: string;
  reference: string;
  error?: string;
}

/**
 * Submit booking based on mode
 */
export async function submitBooking(
  mode: BookingModalMode,
  bookingStore: BookingStore
): Promise<BookingSubmissionResult> {
  const {
    selectedService,
    selectedPet,
    newPetData,
    selectedDate,
    selectedTimeSlot,
    selectedAddonIds,
    selectedCustomerId,
    guestInfo,
    totalPrice,
    petSize,
  } = bookingStore;

  // Validation
  if (!selectedService) {
    return { success: false, appointmentId: '', reference: '', error: 'No service selected' };
  }

  if (!petSize) {
    return { success: false, appointmentId: '', reference: '', error: 'Pet size not specified' };
  }

  if (mode === 'walkin') {
    // Walk-in mode: Use admin appointments API
    return await submitWalkinAppointment(bookingStore);
  } else if (mode === 'admin') {
    // Admin mode: Use admin appointments API
    return await submitAdminAppointment(bookingStore);
  } else {
    // Customer mode: Use public appointments API
    return await submitCustomerAppointment(bookingStore);
  }
}

/**
 * Submit customer booking (public API)
 */
async function submitCustomerAppointment(
  bookingStore: BookingStore
): Promise<BookingSubmissionResult> {
  const {
    selectedService,
    selectedPet,
    newPetData,
    selectedDate,
    selectedTimeSlot,
    selectedAddonIds,
    guestInfo,
    totalPrice,
  } = bookingStore;

  if (!selectedService || !selectedDate || !selectedTimeSlot) {
    return {
      success: false,
      appointmentId: '',
      reference: '',
      error: 'Missing required booking information',
    };
  }

  // Combine date and time into ISO datetime
  const scheduledAt = new Date(`${selectedDate}T${selectedTimeSlot}:00`).toISOString();

  // Determine customer_id and pet_id
  let customerId: string | undefined;
  let petId: string | undefined;

  // If we have a selected pet (existing user with existing pet)
  if (selectedPet) {
    petId = selectedPet.id;
    customerId = selectedPet.owner_id;
  }

  // Handle new pet creation for guest users
  if (newPetData && guestInfo && !petId) {
    // We need to create the user first, then the pet, then the appointment
    // Step 1: Create user via appointments API (it will return the user ID)
    // Actually, the appointments API creates the user internally. We can't get the ID back easily.

    // Better approach: Create the pet with owner_id matching the guest email
    // The /api/pets endpoint supports creating pets for guests via owner_id parameter
    // But we don't have the user ID yet...

    // The simplest solution: Use a temporary appointment creation that handles everything
    // OR: Modify the appointments API to accept new_pet_data
    // For now, let's return an error and require the booking flow to create the pet first

    return {
      success: false,
      appointmentId: '',
      reference: '',
      error: 'Creating new pets during booking is not yet supported. Please contact us to complete your booking.',
    };
  }

  // Ensure we have a pet_id - it's required for appointment creation
  if (!petId) {
    return {
      success: false,
      appointmentId: '',
      reference: '',
      error: 'Pet information is required. Please select a pet.',
    };
  }

  const requestBody = {
    customer_id: customerId || '', // Will be created from guest_info if empty
    pet_id: petId,
    service_id: selectedService.id,
    scheduled_at: scheduledAt,
    duration_minutes: selectedService.duration_minutes,
    total_price: totalPrice,
    notes: null,
    addon_ids: selectedAddonIds || [],
    guest_info: guestInfo || undefined,
  };

  try {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        appointmentId: '',
        reference: '',
        error: errorData.error || 'Failed to create appointment',
      };
    }

    const data = await response.json();

    return {
      success: true,
      appointmentId: data.appointment_id,
      reference: data.reference,
    };
  } catch (error) {
    console.error('Error submitting customer appointment:', error);
    return {
      success: false,
      appointmentId: '',
      reference: '',
      error: 'Network error. Please try again.',
    };
  }
}

/**
 * Submit admin appointment (admin API)
 */
async function submitAdminAppointment(
  bookingStore: BookingStore
): Promise<BookingSubmissionResult> {
  const {
    selectedService,
    selectedPet,
    newPetData,
    selectedDate,
    selectedTimeSlot,
    selectedAddonIds,
    selectedCustomerId,
    guestInfo,
    totalPrice,
    petSize,
  } = bookingStore;

  if (!selectedService || !selectedDate || !selectedTimeSlot || !petSize) {
    return {
      success: false,
      appointmentId: '',
      reference: '',
      error: 'Missing required booking information',
    };
  }

  // Build customer object
  const customer: any = {
    isNew: false,
  };

  if (selectedCustomerId === 'new' && guestInfo) {
    // New customer
    customer.isNew = true;
    customer.first_name = guestInfo.firstName;
    customer.last_name = guestInfo.lastName;
    customer.email = guestInfo.email;
    customer.phone = guestInfo.phone;
  } else if (selectedCustomerId) {
    // Existing customer
    customer.id = selectedCustomerId;
    // We still need to provide name/email/phone for the API
    // In a real scenario, we'd fetch this from the customer selection
    // For now, use guestInfo if available
    if (guestInfo) {
      customer.first_name = guestInfo.firstName;
      customer.last_name = guestInfo.lastName;
      customer.email = guestInfo.email;
      customer.phone = guestInfo.phone;
    }
  }

  // Build pet object
  const pet: any = {
    isNew: false,
  };

  if (selectedPet) {
    // Existing pet
    pet.id = selectedPet.id;
    pet.name = selectedPet.name;
    pet.breed_id = selectedPet.breed_id;
    pet.size = selectedPet.size;
    pet.weight = selectedPet.weight;
  } else if (newPetData) {
    // New pet
    pet.isNew = true;
    pet.name = newPetData.name;
    pet.breed_id = newPetData.breed_id;
    pet.breed_name = newPetData.breed_custom;
    pet.size = newPetData.size;
    pet.weight = newPetData.weight;
  } else {
    return {
      success: false,
      appointmentId: '',
      reference: '',
      error: 'No pet information provided',
    };
  }

  const requestBody = {
    customer,
    pet,
    service_id: selectedService.id,
    addon_ids: selectedAddonIds || [],
    appointment_date: selectedDate,
    appointment_time: selectedTimeSlot,
    notes: null,
    payment_status: 'pending',
    send_notification: true,
    source: 'admin',
  };

  try {
    const response = await fetch('/api/admin/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        appointmentId: '',
        reference: '',
        error: errorData.error || 'Failed to create appointment',
      };
    }

    const data = await response.json();

    return {
      success: true,
      appointmentId: data.appointment_id,
      reference: data.booking_reference,
    };
  } catch (error) {
    console.error('Error submitting admin appointment:', error);
    return {
      success: false,
      appointmentId: '',
      reference: '',
      error: 'Network error. Please try again.',
    };
  }
}

/**
 * Submit walk-in appointment (admin API with walk-in source)
 */
async function submitWalkinAppointment(
  bookingStore: BookingStore
): Promise<BookingSubmissionResult> {
  const {
    selectedService,
    selectedPet,
    newPetData,
    selectedDate,
    selectedTimeSlot,
    selectedAddonIds,
    selectedCustomerId,
    guestInfo,
    totalPrice,
    petSize,
  } = bookingStore;

  if (!selectedService || !selectedDate || !selectedTimeSlot || !petSize) {
    return {
      success: false,
      appointmentId: '',
      reference: '',
      error: 'Missing required booking information',
    };
  }

  // Build customer object
  const customer: any = {
    isNew: false,
  };

  if (selectedCustomerId === 'new' && guestInfo) {
    // New customer (walk-in)
    customer.isNew = true;
    customer.first_name = guestInfo.firstName;
    customer.last_name = guestInfo.lastName;
    customer.email = guestInfo.email || ''; // Email is optional for walk-in
    customer.phone = guestInfo.phone;
  } else if (selectedCustomerId) {
    // Existing customer
    customer.id = selectedCustomerId;
    if (guestInfo) {
      customer.first_name = guestInfo.firstName;
      customer.last_name = guestInfo.lastName;
      customer.email = guestInfo.email || '';
      customer.phone = guestInfo.phone;
    }
  }

  // Build pet object
  const pet: any = {
    isNew: false,
  };

  if (selectedPet) {
    // Existing pet
    pet.id = selectedPet.id;
    pet.name = selectedPet.name;
    pet.breed_id = selectedPet.breed_id;
    pet.size = selectedPet.size;
    pet.weight = selectedPet.weight;
  } else if (newPetData) {
    // New pet
    pet.isNew = true;
    pet.name = newPetData.name;
    pet.breed_id = newPetData.breed_id;
    pet.breed_name = newPetData.breed_custom;
    pet.size = newPetData.size;
    pet.weight = newPetData.weight;
  } else {
    return {
      success: false,
      appointmentId: '',
      reference: '',
      error: 'No pet information provided',
    };
  }

  const requestBody = {
    customer,
    pet,
    service_id: selectedService.id,
    addon_ids: selectedAddonIds || [],
    appointment_date: selectedDate,
    appointment_time: selectedTimeSlot,
    notes: null,
    payment_status: 'pending',
    send_notification: false, // Don't auto-notify walk-ins
    source: 'walk_in',
  };

  try {
    const response = await fetch('/api/admin/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        appointmentId: '',
        reference: '',
        error: errorData.error || 'Failed to create appointment',
      };
    }

    const data = await response.json();

    return {
      success: true,
      appointmentId: data.appointment_id,
      reference: data.booking_reference,
    };
  } catch (error) {
    console.error('Error submitting walk-in appointment:', error);
    return {
      success: false,
      appointmentId: '',
      reference: '',
      error: 'Network error. Please try again.',
    };
  }
}
