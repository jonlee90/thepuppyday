/**
 * Hook for booking creation logic
 */

import { useCallback } from 'react';
import { useBookingStore } from '@/stores/bookingStore';
import { useAuthStore } from '@/stores/auth-store';
import { getMockStore } from '@/mocks/supabase/store';
import { config } from '@/lib/config';
import type { User, Pet, Appointment, WaitlistEntry } from '@/types/database';

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
    selectedGroomerId,
    setBookingResult,
  } = useBookingStore();

  const createBooking = useCallback(async (): Promise<BookingResult> => {
    console.log('[useBooking] Starting booking creation, useMocks:', config.useMocks);

    try {
      if (config.useMocks) {
        // Mock booking creation
        return createMockBooking();
      } else {
        // Real booking via API
        return createRealBooking();
      }
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
    selectedGroomerId,
    setBookingResult,
  ]);

  const createMockBooking = useCallback(async (): Promise<BookingResult> => {
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
        groomer_id: selectedGroomerId || null,
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
      console.error('Mock booking creation failed:', error);
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
    selectedGroomerId,
    setBookingResult,
  ]);

  const createRealBooking = useCallback(async (): Promise<BookingResult> => {
    console.log('[useBooking] Creating real booking via API');

    try {
      if (!selectedService || !selectedDate || !selectedTimeSlot) {
        return { success: false, error: 'Missing booking details' };
      }

      let customerId = user?.id;
      let petId = selectedPet?.id;

      // For guest users, create user account first if we need to create a pet
      if (!isAuthenticated && guestInfo && !petId && newPetData) {
        console.log('[useBooking] Creating/fetching guest user account...');

        const guestUserResponse = await fetch('/api/users/guest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: guestInfo.email,
            firstName: guestInfo.firstName,
            lastName: guestInfo.lastName,
            phone: guestInfo.phone,
          }),
        });

        if (!guestUserResponse.ok) {
          const errorData = await guestUserResponse.json().catch(() => ({ error: 'Failed to create account' }));
          console.error('[useBooking] Guest user creation error:', errorData);
          return {
            success: false,
            error: errorData.error || 'Failed to create guest account',
          };
        }

        const guestUserData = await guestUserResponse.json();
        console.log('[useBooking] Guest user data:', guestUserData);
        customerId = guestUserData.user?.id;
      }

      // Create pet first if needed
      if (!petId && newPetData) {
        console.log('[useBooking] Creating new pet...');

        const petPayload: any = {
          name: newPetData.name,
          size: newPetData.size,
        };

        // Add optional fields only if they have values
        if (newPetData.breed_id) petPayload.breed_id = newPetData.breed_id;
        if (newPetData.breed_custom) petPayload.breed_custom = newPetData.breed_custom;
        if (newPetData.weight) {
          // Ensure weight is a number
          petPayload.weight = typeof newPetData.weight === 'string'
            ? parseFloat(newPetData.weight)
            : newPetData.weight;
        }
        if (newPetData.notes) petPayload.notes = newPetData.notes;

        // For guests with a created user ID, add owner_id
        if (!isAuthenticated && customerId) {
          petPayload.owner_id = customerId;
        }

        const petResponse = await fetch('/api/pets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(petPayload),
        });

        if (!petResponse.ok) {
          const errorData = await petResponse.json().catch(() => ({ error: 'Failed to create pet' }));
          console.error('[useBooking] Pet creation error:', errorData);
          return {
            success: false,
            error: errorData.error || 'Failed to create pet profile',
          };
        }

        const petData = await petResponse.json();
        console.log('[useBooking] Pet created:', petData);
        petId = petData.pet?.id || petData.id;
      }

      if (!petId) {
        return { success: false, error: 'Pet information required' };
      }

      // Create the appointment datetime
      const scheduledAt = new Date(`${selectedDate}T${selectedTimeSlot}:00`);

      // Prepare the appointment request payload
      const payload: any = {
        pet_id: petId,
        service_id: selectedService.id,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: selectedService.duration_minutes,
        total_price: totalPrice,
        addon_ids: selectedAddons.map(addon => addon.id),
      };

      // Add groomer if selected (for admin/walk-in bookings)
      if (selectedGroomerId) {
        payload.groomer_id = selectedGroomerId;
      }

      // Add customer info
      if (isAuthenticated && user) {
        payload.customer_id = user.id;
      } else if (customerId) {
        // Guest user - we have the customer ID from creating the guest user
        payload.customer_id = customerId;
        payload.guest_info = {
          firstName: guestInfo?.firstName,
          lastName: guestInfo?.lastName,
          email: guestInfo?.email,
          phone: guestInfo?.phone,
        };
      } else {
        return { success: false, error: 'Customer information required' };
      }

      console.log('[useBooking] Sending request to /api/appointments:', payload);

      // Call the API
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('[useBooking] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create booking' }));
        console.error('[useBooking] API error:', errorData);
        return {
          success: false,
          error: errorData.error || `Server error: ${response.statusText}`,
        };
      }

      const data = await response.json();
      console.log('[useBooking] API response:', data);

      // Set the booking result in the store
      setBookingResult(data.appointment_id, data.reference);

      return {
        success: true,
        appointmentId: data.appointment_id,
        bookingReference: data.reference,
      };
    } catch (error) {
      console.error('Real booking creation failed:', error);
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
    selectedGroomerId,
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
