/**
 * Hook for booking creation logic
 */

import { useCallback } from 'react';
import { useBookingStore } from '@/stores/bookingStore';
import { useAuthStore } from '@/stores/auth-store';
import { getMockStore } from '@/mocks/supabase/store';
import type { User, Pet, Appointment } from '@/types/database';

interface BookingResult {
  success: boolean;
  appointmentId?: string;
  bookingReference?: string;
  error?: string;
}

export function useBooking() {
  const { user, isAuthenticated } = useAuthStore();
  const {
    selectedService,
    selectedPet,
    newPetData,
    petSize,
    selectedDate,
    selectedTimeSlot,
    selectedAddons,
    totalPrice,
    guestInfo,
    setBookingResult,
  } = useBookingStore();

  const createBooking = useCallback(async (): Promise<BookingResult> => {
    const store = getMockStore();

    try {
      let customerId = user?.id;
      let petId = selectedPet?.id;

      // For guest users, create a user account
      if (!isAuthenticated && guestInfo) {
        // Check if user exists with this email
        const existingUsers = store.select('users', {
          column: 'email',
          value: guestInfo.email,
        }) as unknown as User[];

        if (existingUsers.length > 0) {
          customerId = existingUsers[0].id;
        } else {
          // Create new user
          const newUser = store.insert('users', {
            email: guestInfo.email,
            phone: guestInfo.phone,
            first_name: guestInfo.firstName,
            last_name: guestInfo.lastName,
            role: 'customer',
            preferences: {},
          }) as unknown as User;
          customerId = newUser.id;
        }
      }

      if (!customerId) {
        return { success: false, error: 'Customer ID not found' };
      }

      // Create pet if new pet data provided
      if (newPetData && !petId) {
        const newPet = store.insert('pets', {
          owner_id: customerId,
          name: newPetData.name,
          size: newPetData.size,
          breed_id: newPetData.breed_id || null,
          breed_custom: newPetData.breed_custom || null,
          weight: newPetData.weight || null,
          notes: newPetData.notes || null,
          is_active: true,
        }) as unknown as Pet;
        petId = newPet.id;
      }

      if (!petId) {
        return { success: false, error: 'Pet ID not found' };
      }

      if (!selectedService || !selectedDate || !selectedTimeSlot) {
        return { success: false, error: 'Missing booking details' };
      }

      // Create the appointment datetime
      const scheduledAt = new Date(`${selectedDate}T${selectedTimeSlot}:00`);

      // Generate booking reference
      const bookingReference = `TPD-${Date.now().toString(36).toUpperCase()}`;

      // Create the appointment
      const appointment = store.insert('appointments', {
        customer_id: customerId,
        pet_id: petId,
        service_id: selectedService.id,
        groomer_id: null, // Will be assigned later by admin
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: selectedService.duration_minutes,
        status: 'pending',
        payment_status: 'pending',
        total_price: totalPrice,
        notes: null,
      }) as unknown as Appointment;

      // Create appointment add-ons
      for (const addon of selectedAddons) {
        store.insert('appointment_addons', {
          appointment_id: appointment.id,
          addon_id: addon.id,
          price: addon.price,
        });
      }

      // Set the booking result in the store
      setBookingResult(appointment.id, bookingReference);

      // Log the confirmation (mock email)
      console.log('📧 Booking confirmation email sent to:', guestInfo?.email || user?.email);
      console.log('📋 Booking Reference:', bookingReference);
      console.log('📅 Appointment:', {
        id: appointment.id,
        service: selectedService.name,
        pet: newPetData?.name || selectedPet?.name,
        date: selectedDate,
        time: selectedTimeSlot,
        total: totalPrice,
      });

      return {
        success: true,
        appointmentId: appointment.id,
        bookingReference,
      };
    } catch (error) {
      console.error('Booking creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [
    user,
    isAuthenticated,
    selectedService,
    selectedPet,
    newPetData,
    selectedDate,
    selectedTimeSlot,
    selectedAddons,
    totalPrice,
    guestInfo,
    setBookingResult,
  ]);

  const joinWaitlist = useCallback(
    async (date: string, timePreference: 'morning' | 'afternoon' | 'any'): Promise<boolean> => {
      const store = getMockStore();

      try {
        let customerId = user?.id;
        const petId = selectedPet?.id;

        if (!customerId) {
          // For guests, we need their info first
          if (guestInfo) {
            const existingUsers = store.select('users', {
              column: 'email',
              value: guestInfo.email,
            }) as unknown as User[];
            customerId = existingUsers.length > 0 ? existingUsers[0].id : undefined;
          }

          if (!customerId) {
            console.error('Cannot join waitlist without customer ID');
            return false;
          }
        }

        if (!petId && newPetData) {
          // Would need to create pet first, but for waitlist we'll just skip
          console.error('Pet must be saved before joining waitlist');
          return false;
        }

        if (!petId || !selectedService) {
          return false;
        }

        // Check for existing waitlist entry
        const existingEntries = (store.select('waitlist') as unknown as WaitlistEntry[]).filter(
          (entry) =>
            entry.customer_id === customerId &&
            entry.service_id === selectedService.id &&
            entry.requested_date === date &&
            entry.status === 'active'
        );

        if (existingEntries.length > 0) {
          console.log('Already on waitlist for this date');
          return false;
        }

        // Create waitlist entry
        store.insert('waitlist', {
          customer_id: customerId,
          pet_id: petId,
          service_id: selectedService.id,
          requested_date: date,
          time_preference: timePreference,
          status: 'active',
          notified_at: null,
        });

        console.log('📋 Added to waitlist:', {
          date,
          timePreference,
          service: selectedService.name,
        });

        return true;
      } catch (error) {
        console.error('Failed to join waitlist:', error);
        return false;
      }
    },
    [user, selectedPet, newPetData, selectedService, guestInfo]
  );

  return {
    createBooking,
    joinWaitlist,
  };
}
