/**
 * Combined Customer + Pet Details Step
 * Replaces separate CustomerStep and PetStep with a single unified step.
 * Supports progressive disclosure: pet section appears after customer is set.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, UserPlus, LogIn, UserCheck, PawPrint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@/stores/bookingStore';
import { useAuthStore } from '@/stores/auth-store';
import { guestInfoSchema } from '@/lib/booking/validation';
import { z } from 'zod';
import { usePhoneMask, formatPhoneNumber } from '@/hooks/usePhoneMask';
import { PetCard, AddPetCard } from '../PetCard';
import { PetForm } from '../PetForm';
import { usePets } from '@/hooks/usePets';
import type { Pet, CreatePetInput } from '@/types/database';
import type { PetFormData } from '@/lib/booking/validation';
import type { BookingModalMode } from '@/hooks/useBookingModal';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  full_name: string;
}

interface DetailsStepProps {
  mode?: BookingModalMode;
  section?: 'customer' | 'pet';
}

export function DetailsStep({ mode = 'customer', section }: DetailsStepProps) {
  const {
    selectedCustomerId,
    guestInfo,
    setSelectedCustomerId,
    setGuestInfo,
    selectedPetId,
    newPetData,
    selectedService,
    selectPet,
    setNewPetData,
    nextStep,
  } = useBookingStore();

  const { isAuthenticated, user, login } = useAuthStore();

  // --- Customer Section State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Customer mode: Login or Register
  const [viewMode, setViewMode] = useState<'login' | 'register'>('register');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // New customer/register form state
  const [newCustomerForm, setNewCustomerForm] = useState({
    first_name: guestInfo?.firstName || '',
    last_name: guestInfo?.lastName || '',
    email: guestInfo?.email || '',
    phone: guestInfo?.phone || '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [duplicateEmailError, setDuplicateEmailError] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Phone masking hook for new customer form
  const phoneInput = usePhoneMask(guestInfo?.phone || '');

  // --- Pet Section State ---
  const [showPetForm, setShowPetForm] = useState(false);
  const petSectionRef = useRef<HTMLDivElement>(null);

  // Determine if customer is set (for progressive disclosure in admin/walkin)
  const isNewCustomer = selectedCustomerId === 'new';
  const hasCustomerSet =
    (mode === 'customer' && (isAuthenticated || (selectedCustomerId !== null && selectedCustomerId !== ''))) ||
    (mode !== 'customer' && selectedCustomerId !== null && selectedCustomerId !== '');

  // Pet data
  const effectiveOwnerId = (() => {
    if (isNewCustomer) return null;
    if (selectedCustomerId && selectedCustomerId !== '') return selectedCustomerId;
    if (mode === 'customer') return user?.id ?? null;
    return null;
  })();

  const { pets, isLoading: petsLoading, error: petsError, refetch: refetchPets } = usePets(effectiveOwnerId);

  // Sync phoneInput with newCustomerForm
  useEffect(() => {
    setNewCustomerForm((prev) => ({ ...prev, phone: phoneInput.rawValue }));
  }, [phoneInput.rawValue]);

  // Debounced search (admin/walk-in modes only)
  useEffect(() => {
    if (mode === 'customer') return;

    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/admin/customers?search=${encodeURIComponent(searchQuery)}`
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.data || []);
        }
      } catch (error) {
        console.error('Customer search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, mode]);

  // Set authenticated user info (customer mode)
  useEffect(() => {
    if (mode === 'customer' && isAuthenticated && user) {
      setSelectedCustomerId(user.id);
      setGuestInfo({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [mode, isAuthenticated, user, setSelectedCustomerId, setGuestInfo]);

  // Auto-show pet form for new customers or customers with no pets
  useEffect(() => {
    if (!petsLoading && hasCustomerSet) {
      const shouldShowForm =
        isNewCustomer ||
        (!isAuthenticated && mode === 'customer') ||
        pets.length === 0 ||
        (mode !== 'customer' && !selectedCustomerId);

      if (shouldShowForm) {
        setShowPetForm(true);
      }
    }
  }, [petsLoading, hasCustomerSet, isNewCustomer, isAuthenticated, pets.length, mode, selectedCustomerId]);

  // Scroll to pet section when customer is set (admin/walkin progressive disclosure)
  useEffect(() => {
    if (hasCustomerSet && mode !== 'customer' && petSectionRef.current) {
      const timer = setTimeout(() => {
        petSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [hasCustomerSet, mode]);

  // --- Customer Handlers ---
  const handleSelectCustomer = useCallback(
    (customer: Customer) => {
      setSelectedCustomer(customer);
      setSelectedCustomerId(customer.id);
      setGuestInfo({
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
        phone: customer.phone,
      });
    },
    [setSelectedCustomerId, setGuestInfo]
  );

  const handleLogin = useCallback(async () => {
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const result = await login(loginForm.email, loginForm.password);
      if (!result.success) {
        setLoginError(result.error || 'Invalid email or password');
      } else if (section === 'customer') {
        // Auto-advance to next step after successful login
        nextStep();
      }
    } catch {
      setLoginError('An error occurred during login. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  }, [loginForm, login, section, nextStep]);

  const validateNewCustomerForm = useCallback(async () => {
    const errors: Record<string, string> = {};
    setDuplicateEmailError('');

    try {
      guestInfoSchema.parse({
        firstName: newCustomerForm.first_name,
        lastName: newCustomerForm.last_name,
        email: newCustomerForm.email,
        phone: newCustomerForm.phone,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((err) => {
          const field = err.path[0];
          if (field === 'firstName') errors.first_name = err.message;
          if (field === 'lastName') errors.last_name = err.message;
          if (field === 'email') errors.email = err.message;
          if (field === 'phone') errors.phone = err.message;
        });
      }
    }

    if (newCustomerForm.email && !errors.email) {
      try {
        const response = await fetch(
          `/api/admin/customers?search=${encodeURIComponent(newCustomerForm.email)}`
        );
        if (response.ok) {
          const data = await response.json();
          const existingCustomer = data.data?.find(
            (c: Customer) => c.email.toLowerCase() === newCustomerForm.email.toLowerCase()
          );
          if (existingCustomer) {
            setDuplicateEmailError(
              `A customer with this email already exists: ${existingCustomer.first_name} ${existingCustomer.last_name}`
            );
            errors.email = 'Email already in use';
          }
        }
      } catch (error) {
        console.error('Email check error:', error);
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newCustomerForm]);

  const handleNewCustomerSubmit = useCallback(async () => {
    setIsCreatingCustomer(true);

    try {
      const isValid = await validateNewCustomerForm();
      if (!isValid) {
        setIsCreatingCustomer(false);
        return;
      }

      setSelectedCustomerId('new');
      setGuestInfo({
        firstName: newCustomerForm.first_name,
        lastName: newCustomerForm.last_name,
        email: newCustomerForm.email,
        phone: newCustomerForm.phone,
      });
      setSelectedCustomer({
        id: 'new',
        first_name: newCustomerForm.first_name,
        last_name: newCustomerForm.last_name,
        email: newCustomerForm.email,
        phone: newCustomerForm.phone,
        full_name: `${newCustomerForm.first_name} ${newCustomerForm.last_name}`,
      });

      setIsCreatingCustomer(false);

      // Auto-advance to next step after successful customer form submission
      if (section === 'customer') {
        nextStep();
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      setIsCreatingCustomer(false);
    }
  }, [newCustomerForm, validateNewCustomerForm, setSelectedCustomerId, setGuestInfo, section, nextStep]);

  // --- Pet Handlers ---
  const handleSelectPet = (pet: Pet) => {
    selectPet(pet);
    setShowPetForm(false);
  };

  const handleAddNewPet = () => {
    setShowPetForm(true);
  };

  const handlePetFormSubmit = (data: PetFormData) => {
    const petInput: CreatePetInput = {
      owner_id: user?.id || '',
      name: data.name,
      size: data.size,
      breed_id: data.breed_id || undefined,
      breed_custom: data.breed_custom || undefined,
      weight: data.weight || undefined,
      notes: data.notes || undefined,
    };

    setNewPetData(petInput);
    setShowPetForm(false);
  };

  const handlePetFormCancel = () => {
    if (pets.length > 0) {
      setShowPetForm(false);
    }
  };

  const isFormComplete =
    newCustomerForm.first_name.trim() !== '' &&
    newCustomerForm.last_name.trim() !== '' &&
    newCustomerForm.email.trim() !== '' &&
    newCustomerForm.phone.trim() !== '' &&
    Object.keys(formErrors).length === 0 &&
    !duplicateEmailError;

  const isLoginFormComplete =
    loginForm.email.trim() !== '' &&
    loginForm.password.trim() !== '';

  // ============================================
  // RENDER: Customer Section
  // ============================================
  const renderCustomerSection = () => {
    // Customer mode: authenticated confirmation
    if (mode === 'customer' && isAuthenticated && user) {
      return (
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-[#434E54]">Logged In</span>
          </div>
          <div className="font-semibold text-[#434E54]">
            {user.first_name} {user.last_name}
          </div>
          <div className="text-sm text-[#6B7280]">{user.email}</div>
          {user.phone && <div className="text-sm text-[#6B7280]">{formatPhoneNumber(user.phone)}</div>}
        </div>
      );
    }

    // Customer mode: login/register
    if (mode === 'customer') {
      return (
        <div className="space-y-4">
          <p className="text-[#434E54]/70 leading-relaxed max-w-2xl">
            {viewMode === 'login' ? 'Log in to continue' : 'Create an account to book your appointment'}
          </p>

          {/* Login Form */}
          {viewMode === 'login' && (
            <div className="space-y-3 p-4 bg-white rounded-xl border border-[#E5E5E5]">
              <div>
                <label className="block text-sm font-medium text-[#434E54] mb-2">
                  Email <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="input input-bordered w-full h-12 bg-white rounded-lg border-[#E5E5E5] focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20"
                  placeholder="john.doe@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#434E54] mb-2">
                  Password <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="input input-bordered w-full h-12 bg-white rounded-lg border-[#E5E5E5] focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20"
                  placeholder="Enter your password"
                />
              </div>

              {loginError && (
                <div className="alert bg-red-50 border border-red-200 rounded-lg p-3">
                  <span className="text-sm text-[#EF4444]">{loginError}</span>
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={!isLoginFormComplete || isLoggingIn}
                className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none w-full h-12 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:bg-[#434E54]/40 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Log In
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  onClick={() => setViewMode('register')}
                  className="text-sm text-[#434E54] hover:underline"
                >
                  Don&apos;t have an account? <span className="font-semibold">Register</span>
                </button>
              </div>
            </div>
          )}

          {/* Register Form */}
          {viewMode === 'register' && (
            <div className="space-y-3 p-4 bg-white rounded-xl border border-[#E5E5E5]">
              {renderNewCustomerFormFields()}

              <button
                onClick={handleNewCustomerSubmit}
                disabled={!isFormComplete || isCreatingCustomer}
                className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none w-full h-12 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:bg-[#434E54]/40 disabled:cursor-not-allowed"
              >
                {isCreatingCustomer ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Continue
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  onClick={() => setViewMode('login')}
                  className="text-sm text-[#434E54] hover:underline"
                >
                  Already have an account? <span className="font-semibold">Log In</span>
                </button>
              </div>
            </div>
          )}

          {/* Selected Customer Display (for register mode after submission) */}
          {viewMode === 'register' && (selectedCustomer || (selectedCustomerId && guestInfo)) && (
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-semibold text-[#434E54]">Information Confirmed</span>
              </div>
              <div className="font-semibold text-[#434E54]">
                {selectedCustomer?.first_name || guestInfo?.firstName}{' '}
                {selectedCustomer?.last_name || guestInfo?.lastName}
                {isNewCustomer && (
                  <span className="ml-2 badge badge-sm bg-[#434E54] text-white border-none">New</span>
                )}
              </div>
              <div className="text-sm text-[#6B7280]">
                {selectedCustomer?.email || guestInfo?.email}
              </div>
              <div className="text-sm text-[#6B7280]">
                {formatPhoneNumber(selectedCustomer?.phone || guestInfo?.phone || '')}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Admin/Walk-in mode: search + create
    return (
      <div className="space-y-4">
        <p className="text-[#434E54]/70 leading-relaxed max-w-2xl">
          Search for an existing customer or create a new one
        </p>

        {/* Search Section */}
        <div>
          <label className="block text-sm font-semibold text-[#434E54] mb-2">
            Search Existing Customer
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full h-12 pl-10 bg-white border-[#E5E5E5] focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 rounded-lg transition-all duration-150"
            />
          </div>
          {isSearching && (
            <p className="text-sm text-[#6B7280] mt-2 flex items-center gap-2">
              <span className="loading loading-spinner loading-xs"></span>
              Searching...
            </p>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-[#434E54]">
              Select Customer ({searchResults.length} found)
            </label>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {searchResults.map((customer) => (
                <label
                  key={customer.id}
                  className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedCustomerId === customer.id
                      ? 'border-[#434E54] bg-[#FFFBF7] shadow-md'
                      : 'border-[#E5E5E5] bg-white hover:border-[#434E54]/30 shadow-sm'
                  }`}
                >
                  <input
                    type="radio"
                    name="customer"
                    value={customer.id}
                    checked={selectedCustomerId === customer.id}
                    onChange={() => handleSelectCustomer(customer)}
                    className="radio radio-sm radio-primary mt-1 min-w-[20px]"
                    aria-label={`Select ${customer.first_name} ${customer.last_name}`}
                  />
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="font-semibold text-[#434E54]">
                      {customer.first_name} {customer.last_name}
                    </div>
                    <div className="text-sm text-[#6B7280] truncate">{customer.email}</div>
                    <div className="text-sm text-[#6B7280]">{formatPhoneNumber(customer.phone)}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="relative flex items-center">
          <div className="flex-grow border-t border-[#E5E5E5]"></div>
          <span className="px-4 text-sm text-[#9CA3AF] bg-[#FFFBF7]">OR</span>
          <div className="flex-grow border-t border-[#E5E5E5]"></div>
        </div>

        {/* New Customer Form */}
        <div>
          <div className="flex items-center gap-2 mb-4 text-[#434E54] font-semibold">
            <UserPlus className="w-5 h-5" />
            Create New Customer
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#E5E5E5] space-y-3">
            {renderNewCustomerFormFields()}

            <button
              onClick={handleNewCustomerSubmit}
              disabled={!isFormComplete || isCreatingCustomer}
              className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none w-full h-12 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:bg-[#434E54]/40 disabled:cursor-not-allowed"
            >
              {isCreatingCustomer ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Use This Customer
                </>
              )}
            </button>
          </div>
        </div>

        {/* Selected Customer Display */}
        {(selectedCustomer || (selectedCustomerId && guestInfo)) && (
          <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-semibold text-[#434E54]">Customer Selected</span>
            </div>
            <div className="font-semibold text-[#434E54]">
              {selectedCustomer?.first_name || guestInfo?.firstName}{' '}
              {selectedCustomer?.last_name || guestInfo?.lastName}
              {isNewCustomer && (
                <span className="ml-2 badge badge-sm bg-[#434E54] text-white border-none">New</span>
              )}
            </div>
            <div className="text-sm text-[#6B7280]">
              {selectedCustomer?.email || guestInfo?.email}
            </div>
            <div className="text-sm text-[#6B7280]">
              {formatPhoneNumber(selectedCustomer?.phone || guestInfo?.phone || '')}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Shared form fields for new customer (used in both customer register and admin/walkin create)
  const renderNewCustomerFormFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-[#434E54] mb-2">
            First Name <span className="text-[#EF4444]">*</span>
          </label>
          <input
            type="text"
            value={newCustomerForm.first_name}
            onChange={(e) =>
              setNewCustomerForm({ ...newCustomerForm, first_name: e.target.value })
            }
            className={`input input-bordered w-full h-12 bg-white rounded-lg ${
              formErrors.first_name ? 'border-[#EF4444]' : 'border-[#E5E5E5]'
            } focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20`}
            placeholder="John"
          />
          {formErrors.first_name && (
            <p className="text-sm text-[#EF4444] mt-1">{formErrors.first_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#434E54] mb-2">
            Last Name <span className="text-[#EF4444]">*</span>
          </label>
          <input
            type="text"
            value={newCustomerForm.last_name}
            onChange={(e) =>
              setNewCustomerForm({ ...newCustomerForm, last_name: e.target.value })
            }
            className={`input input-bordered w-full h-12 bg-white rounded-lg ${
              formErrors.last_name ? 'border-[#EF4444]' : 'border-[#E5E5E5]'
            } focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20`}
            placeholder="Doe"
          />
          {formErrors.last_name && (
            <p className="text-sm text-[#EF4444] mt-1">{formErrors.last_name}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#434E54] mb-2">
          Email <span className="text-[#EF4444]">*</span>
        </label>
        <input
          type="email"
          value={newCustomerForm.email}
          onChange={(e) =>
            setNewCustomerForm({ ...newCustomerForm, email: e.target.value })
          }
          className={`input input-bordered w-full h-12 bg-white rounded-lg ${
            formErrors.email ? 'border-[#EF4444]' : 'border-[#E5E5E5]'
          } focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20`}
          placeholder="john.doe@example.com"
        />
        {formErrors.email && (
          <p className="text-sm text-[#EF4444] mt-1">{formErrors.email}</p>
        )}
        {duplicateEmailError && (
          <div className="alert bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
            <span className="text-sm text-[#434E54]">{duplicateEmailError}</span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[#434E54] mb-2">
          Phone <span className="text-[#EF4444]">*</span>
        </label>
        <input
          type="tel"
          value={phoneInput.value}
          onChange={phoneInput.onChange}
          onPaste={phoneInput.onPaste}
          className={`input input-bordered w-full h-12 bg-white rounded-lg ${
            formErrors.phone ? 'border-[#EF4444]' : 'border-[#E5E5E5]'
          } focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20`}
          placeholder="(555) 123-4567"
        />
        {formErrors.phone && (
          <p className="text-sm text-[#EF4444] mt-1">{formErrors.phone}</p>
        )}
      </div>
    </>
  );

  // ============================================
  // RENDER: Pet Section
  // ============================================
  const renderPetSection = () => {
    if (petsLoading) {
      return (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#EAE0D5]" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-[#EAE0D5] rounded w-1/3" />
                  <div className="h-4 bg-[#EAE0D5] rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (petsError) {
      return (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-[#434E54]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[#434E54]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#434E54] mb-2">Failed to Load Pets</h3>
          <p className="text-[#434E54]/70 mb-4">{petsError.message}</p>
          <button
            onClick={() => refetchPets()}
            className="bg-[#434E54] text-white font-medium py-2.5 px-5 rounded-lg
                     hover:bg-[#434E54]/90 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      );
    }

    // Show pet form
    if (showPetForm) {
      return (
        <div className="space-y-4">
          <p className="text-[#434E54]/70 leading-relaxed max-w-2xl">
            {isAuthenticated
              ? "Enter your pet's information so we can provide the best care"
              : 'Tell us about your pet so we can provide the best grooming experience'}
          </p>

          <div className="bg-white rounded-xl shadow-md p-4">
            <PetForm
              onSubmit={handlePetFormSubmit}
              onCancel={pets.length > 0 ? handlePetFormCancel : undefined}
              initialData={newPetData || undefined}
              selectedService={selectedService}
            />
          </div>
        </div>
      );
    }

    // Show pet selection (existing pets as cards)
    return (
      <div className="space-y-4">
        <p className="text-[#434E54]/70 leading-relaxed max-w-2xl">Select your pet for this appointment</p>

        {/* New pet info banner */}
        {newPetData && (
          <div className="bg-[#434E54]/10 border border-[#434E54]/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#434E54]/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-[#434E54]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[#434E54]">New pet: {newPetData.name}</p>
                  <p className="text-sm text-[#434E54]/70">
                    This pet will be created when you confirm your booking
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPetForm(true)}
                className="text-[#434E54] font-medium py-1.5 px-3 rounded-lg text-sm
                         hover:bg-[#EAE0D5] transition-colors duration-200"
              >
                Edit
              </button>
            </div>
          </div>
        )}

        {/* Pets list */}
        <div className="space-y-4">
          {pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              isSelected={selectedPetId === pet.id}
              onSelect={() => handleSelectPet(pet)}
            />
          ))}
          <AddPetCard onClick={handleAddNewPet} />
        </div>
      </div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  // Render only customer section
  if (section === 'customer') {
    return (
      <div className="space-y-6">
        {renderCustomerSection()}
      </div>
    );
  }

  // Render only pet section
  if (section === 'pet') {
    return (
      <div className="space-y-6">
        {renderPetSection()}
      </div>
    );
  }

  // Legacy: render both sections (combined mode)
  return (
    <div className="space-y-6">
      {/* Customer Section */}
      <div>
        {renderCustomerSection()}
      </div>

      {/* Pet Section - Progressive disclosure */}
      <AnimatePresence>
        {hasCustomerSet && (
          <motion.div
            ref={petSectionRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Divider */}
            <div className="relative flex items-center mb-6">
              <div className="flex-grow border-t border-[#E5E5E5]"></div>
              <span className="px-4 text-sm font-semibold text-[#434E54] flex items-center gap-2">
                <PawPrint className="w-4 h-4" />
                Pet Information
              </span>
              <div className="flex-grow border-t border-[#E5E5E5]"></div>
            </div>

            {renderPetSection()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
