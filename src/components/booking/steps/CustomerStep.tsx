/**
 * Customer Selection Step
 * Admin/Walk-in: Search for existing customers or create new customer inline
 * Customer: Login or Register
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, LogIn, UserCheck } from 'lucide-react';
import { useBookingStore } from '@/stores/bookingStore';
import { useAuthStore } from '@/stores/auth-store';
import { guestInfoSchema } from '@/lib/booking/validation';
import { z } from 'zod';
import { usePhoneMask, formatPhoneNumber } from '@/hooks/usePhoneMask';

type CustomerStepMode = 'customer' | 'admin' | 'walkin';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  full_name: string;
}

interface CustomerStepProps {
  mode?: CustomerStepMode;
}

export function CustomerStep({ mode = 'customer' }: CustomerStepProps) {
  const {
    selectedCustomerId,
    guestInfo,
    setSelectedCustomerId,
    setGuestInfo,
    nextStep,
  } = useBookingStore();

  const { isAuthenticated, user, login } = useAuthStore();

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

  // Sync phoneInput with newCustomerForm
  useEffect(() => {
    setNewCustomerForm((prev) => ({ ...prev, phone: phoneInput.rawValue }));
  }, [phoneInput.rawValue]);

  // Debounced search (admin/walk-in modes only)
  useEffect(() => {
    if (mode === 'customer') return; // Skip search for customer mode

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

  // Handle customer selection (admin/walkin modes)
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

  // Handle login (customer mode)
  const handleLogin = useCallback(async () => {
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const result = await login(loginForm.email, loginForm.password);
      if (!result.success) {
        setLoginError(result.error || 'Invalid email or password');
      }
      // If successful, the useEffect above will handle setting the customer info
    } catch (error) {
      setLoginError('An error occurred during login. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  }, [loginForm, login]);

  // Validate new customer form
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

    // Check for duplicate email
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

  // Handle new customer form submission
  const handleNewCustomerSubmit = useCallback(async () => {
    setIsCreatingCustomer(true);

    try {
      const isValid = await validateNewCustomerForm();
      if (!isValid) {
        setIsCreatingCustomer(false);
        return;
      }

      // Set as new customer (will be created on booking confirmation)
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

      // Clear loading state before auto-advancing
      setIsCreatingCustomer(false);

      // Auto-advance to next step after customer is created and selected
      setTimeout(() => {
        nextStep();
      }, 300); // Small delay for smooth UX (let user see the confirmation)
    } catch (error) {
      console.error('Error creating customer:', error);
      setIsCreatingCustomer(false);
    }
  }, [newCustomerForm, validateNewCustomerForm, setSelectedCustomerId, setGuestInfo, nextStep]);

  const isNewCustomer = selectedCustomerId === 'new';

  // Check if form is complete and valid
  const isFormComplete =
    newCustomerForm.first_name.trim() !== '' &&
    newCustomerForm.last_name.trim() !== '' &&
    newCustomerForm.email.trim() !== '' &&
    newCustomerForm.phone.trim() !== '' &&
    Object.keys(formErrors).length === 0 &&
    !duplicateEmailError;

  // Check if login form is complete
  const isLoginFormComplete =
    loginForm.email.trim() !== '' &&
    loginForm.password.trim() !== '';

  // Render customer mode (login/register)
  if (mode === 'customer') {
    // If already authenticated, show confirmation
    if (isAuthenticated && user) {
      return (
        <div className="space-y-6">
          <p className="text-[#434E54]/70 leading-relaxed">
            You're logged in and ready to book!
          </p>

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
        </div>
      );
    }

    // Show login or register form
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
                Don't have an account? <span className="font-semibold">Register</span>
              </button>
            </div>
          </div>
        )}

        {/* Register Form */}
        {viewMode === 'register' && (
          <div className="space-y-3 p-4 bg-white rounded-xl border border-[#E5E5E5]">
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

  // Admin/Walk-in mode (search + create)
  return (
    <div className="space-y-4">
      {/* Subtitle */}
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

      {/* New Customer Form - Always Visible */}
      <div>
        <div className="flex items-center gap-2 mb-4 text-[#434E54] font-semibold">
          <UserPlus className="w-5 h-5" />
          Create New Customer
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#E5E5E5] space-y-3">
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
}
