/**
 * Customer selection/creation step for booking wizard
 * Extracted from DetailsStep — handles customer search, login, and registration.
 * No inline submit/continue buttons — the modal footer drives all navigation.
 *
 * Customer mode has 3 views: guest (default), createAccount, login.
 * Admin/walkin modes are unchanged (search + create).
 */

'use client';

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Search, UserPlus, UserCheck, Eye, EyeOff } from 'lucide-react';
import { useBookingStore } from '@/stores/bookingStore';
import { useAuthStore } from '@/stores/auth-store';
import { useAuth } from '@/hooks/use-auth';
import { guestInfoSchema } from '@/lib/booking/validation';
import { z } from 'zod';
import { usePhoneMask, formatPhoneNumber } from '@/hooks/usePhoneMask';
import { toast } from '@/hooks/use-toast';
import type { BookingModalMode } from '@/hooks/useBookingModal';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  full_name: string;
}

export interface CustomerStepHandle {
  /** Validate and save. Returns true if step can proceed. */
  onContinue: () => Promise<boolean>;
}

interface CustomerStepProps {
  mode?: BookingModalMode;
  /** Callback to override the footer's canContinue state */
  onCanContinueChange?: (override: boolean | null) => void;
}

/** Password validation matching registerSchema rules */
function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
    return 'Must contain uppercase, lowercase, and a number';
  return null;
}

export const CustomerStep = forwardRef<CustomerStepHandle, CustomerStepProps>(
  function CustomerStep({ mode = 'customer', onCanContinueChange }, ref) {
    const {
      selectedCustomerId,
      guestInfo,
      setSelectedCustomerId,
      setGuestInfo,
    } = useBookingStore();

    const { isAuthenticated, user } = useAuthStore();
    const { signIn, signUp } = useAuth();

    // --- State ---
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const [viewMode, setViewMode] = useState<'guest' | 'createAccount' | 'login'>('guest');
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loginError, setLoginError] = useState('');

    // Create account state
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [signUpError, setSignUpError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const [newCustomerForm, setNewCustomerForm] = useState({
      first_name: guestInfo?.firstName || '',
      last_name: guestInfo?.lastName || '',
      email: guestInfo?.email || '',
      phone: guestInfo?.phone || '',
      address: guestInfo?.address || '',
      city: guestInfo?.city || '',
      zip: guestInfo?.zip || '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [duplicateEmailError, setDuplicateEmailError] = useState('');
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

    const phoneInput = usePhoneMask(guestInfo?.phone || '');

    // Sync phone mask → form state
    useEffect(() => {
      setNewCustomerForm((prev) => ({ ...prev, phone: phoneInput.rawValue }));
    }, [phoneInput.rawValue]);

    // Debounced customer search (admin/walkin only)
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

    // Auto-set authenticated user info (customer mode)
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

    // --- Sync canContinue override to parent ---
    useEffect(() => {
      if (!onCanContinueChange) return;

      // Already authenticated — always can continue
      if (mode === 'customer' && isAuthenticated) {
        onCanContinueChange(true);
        return;
      }

      // Existing customer selected (admin/walkin search result)
      if (selectedCustomerId && selectedCustomerId !== 'new' && selectedCustomerId !== '') {
        onCanContinueChange(true);
        return;
      }

      // Customer mode — login form
      if (mode === 'customer' && viewMode === 'login') {
        const ready = loginForm.email.trim() !== '' && loginForm.password.trim() !== '';
        onCanContinueChange(ready);
        return;
      }

      // Guest or createAccount: required fields filled
      const baseReady =
        newCustomerForm.first_name.trim() !== '' &&
        newCustomerForm.last_name.trim() !== '' &&
        newCustomerForm.email.trim() !== '' &&
        newCustomerForm.phone.trim() !== '';

      if (mode === 'customer' && viewMode === 'createAccount') {
        onCanContinueChange(baseReady && password.trim() !== '' && confirmPassword.trim() !== '');
        return;
      }

      onCanContinueChange(baseReady);
    }, [
      onCanContinueChange, mode, isAuthenticated, selectedCustomerId, viewMode,
      loginForm.email, loginForm.password, password, confirmPassword,
      newCustomerForm.first_name, newCustomerForm.last_name, newCustomerForm.email, newCustomerForm.phone,
    ]);

    // --- Handlers ---
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

      // Duplicate email check — only in admin/walkin mode (API requires admin auth)
      if (mode !== 'customer' && newCustomerForm.email && !errors.email) {
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
    }, [newCustomerForm, mode]);

    const handleNewCustomerSubmit = useCallback(async (): Promise<boolean> => {
      setIsCreatingCustomer(true);
      try {
        const isValid = await validateNewCustomerForm();
        if (!isValid) return false;

        setSelectedCustomerId('new');
        setGuestInfo({
          firstName: newCustomerForm.first_name,
          lastName: newCustomerForm.last_name,
          email: newCustomerForm.email,
          phone: newCustomerForm.phone,
          address: newCustomerForm.address || undefined,
          city: newCustomerForm.city || undefined,
          zip: newCustomerForm.zip || undefined,
        });
        setSelectedCustomer({
          id: 'new',
          first_name: newCustomerForm.first_name,
          last_name: newCustomerForm.last_name,
          email: newCustomerForm.email,
          phone: newCustomerForm.phone,
          full_name: `${newCustomerForm.first_name} ${newCustomerForm.last_name}`,
        });
        return true;
      } catch (error) {
        console.error('Error creating customer:', error);
        return false;
      } finally {
        setIsCreatingCustomer(false);
      }
    }, [newCustomerForm, validateNewCustomerForm, setSelectedCustomerId, setGuestInfo]);

    const handleCreateAccount = useCallback(async (): Promise<boolean> => {
      // Validate guest fields first
      const isValid = await validateNewCustomerForm();
      if (!isValid) return false;

      // Validate password
      const pwError = validatePassword(password);
      if (pwError) {
        setPasswordError(pwError);
        return false;
      }
      setPasswordError('');

      if (password !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match');
        return false;
      }
      setConfirmPasswordError('');

      setIsSigningUp(true);
      setSignUpError('');

      try {
        const result = await signUp({
          email: newCustomerForm.email,
          password,
          firstName: newCustomerForm.first_name,
          lastName: newCustomerForm.last_name,
          phone: newCustomerForm.phone,
        });

        if (result.error) {
          setSignUpError(result.error.message || 'Failed to create account');
          return false;
        }

        if (result.requiresEmailConfirmation) {
          toast.success('Account created! Check your email to verify.');
          // Fall through to guest flow so booking can proceed
          setSelectedCustomerId('new');
          setGuestInfo({
            firstName: newCustomerForm.first_name,
            lastName: newCustomerForm.last_name,
            email: newCustomerForm.email,
            phone: newCustomerForm.phone,
            address: newCustomerForm.address || undefined,
            city: newCustomerForm.city || undefined,
            zip: newCustomerForm.zip || undefined,
          });
          return true;
        }

        // Success with session — auto-set effect (line 111) handles the rest
        return true;
      } catch {
        setSignUpError('An error occurred. Please try again.');
        return false;
      } finally {
        setIsSigningUp(false);
      }
    }, [
      newCustomerForm, password, confirmPassword, validateNewCustomerForm,
      signUp, setSelectedCustomerId, setGuestInfo,
    ]);

    const handleLogin = useCallback(async (): Promise<boolean> => {
      setIsLoggingIn(true);
      setLoginError('');
      try {
        const result = await signIn(loginForm.email, loginForm.password);
        if (result.error) {
          setLoginError(result.error.message || 'Invalid email or password');
          return false;
        }
        return true;
      } catch {
        setLoginError('An error occurred during login. Please try again.');
        return false;
      } finally {
        setIsLoggingIn(false);
      }
    }, [loginForm, signIn]);

    // --- Imperative handle for footer Continue ---
    useImperativeHandle(ref, () => ({
      onContinue: async () => {
        // Customer mode — authenticated: nothing to do
        if (mode === 'customer' && isAuthenticated) return true;

        // Customer mode — login form
        if (mode === 'customer' && viewMode === 'login') {
          return handleLogin();
        }

        // Customer mode — create account
        if (mode === 'customer' && viewMode === 'createAccount') {
          return handleCreateAccount();
        }

        // Customer mode — guest OR admin/walkin "Create New Customer"
        // If an existing customer is already selected (not 'new'), just proceed
        if (selectedCustomerId && selectedCustomerId !== 'new' && selectedCustomerId !== '') {
          return true;
        }

        // Need to validate + save the new customer form
        return handleNewCustomerSubmit();
      },
    }), [mode, isAuthenticated, viewMode, handleLogin, handleCreateAccount, selectedCustomerId, handleNewCustomerSubmit]);

    const isNewCustomer = selectedCustomerId === 'new';

    // ============================================
    // RENDER
    // ============================================

    // Customer mode: authenticated confirmation
    if (mode === 'customer' && isAuthenticated && user) {
      return (
        <div className="space-y-6">
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

    // Customer mode: guest / createAccount / login
    if (mode === 'customer') {
      return (
        <div className="space-y-6">
          <div className="space-y-4">
            {/* Mode toggle buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode('createAccount')}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  viewMode === 'createAccount'
                    ? 'bg-[#434E54] text-white'
                    : 'border border-[#434E54]/20 text-[#434E54] hover:border-[#434E54]/40'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => setViewMode('login')}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  viewMode === 'login'
                    ? 'bg-[#434E54] text-white'
                    : 'border border-[#434E54]/20 text-[#434E54] hover:border-[#434E54]/40'
                }`}
              >
                Log In
              </button>
            </div>

            {/* Back to guest link */}
            {viewMode !== 'guest' && (
              <button
                type="button"
                onClick={() => setViewMode('guest')}
                className="text-sm text-[#434E54]/50 hover:text-[#434E54]/80 transition-colors"
              >
                or continue as guest
              </button>
            )}

            {/* Heading */}
            <p className="text-[#434E54]/70 leading-relaxed max-w-2xl">
              {viewMode === 'guest' && 'Continue as Guest'}
              {viewMode === 'createAccount' && 'Create an account to manage your bookings'}
              {viewMode === 'login' && 'Log in to continue'}
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

                {isLoggingIn && (
                  <div className="flex items-center justify-center gap-2 text-sm text-[#434E54]/60 py-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    Logging in...
                  </div>
                )}
              </div>
            )}

            {/* Guest / Create Account Forms */}
            {(viewMode === 'guest' || viewMode === 'createAccount') && (
              <div className="space-y-3 p-4 bg-white rounded-xl border border-[#E5E5E5]">
                {renderNewCustomerFormFields()}

                {/* Password fields for Create Account */}
                {viewMode === 'createAccount' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[#434E54] mb-2">
                        Password <span className="text-[#EF4444]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setPasswordError('');
                          }}
                          className={`input input-bordered w-full h-12 bg-white rounded-lg pr-10 ${
                            passwordError ? 'border-[#EF4444]' : 'border-[#E5E5E5]'
                          } focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20`}
                          placeholder="Min 8 chars, uppercase, lowercase, number"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#434E54]"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordError && (
                        <p className="text-sm text-[#EF4444] mt-1">{passwordError}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#434E54] mb-2">
                        Confirm Password <span className="text-[#EF4444]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setConfirmPasswordError('');
                          }}
                          className={`input input-bordered w-full h-12 bg-white rounded-lg pr-10 ${
                            confirmPasswordError ? 'border-[#EF4444]' : 'border-[#E5E5E5]'
                          } focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20`}
                          placeholder="Re-enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#434E54]"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmPasswordError && (
                        <p className="text-sm text-[#EF4444] mt-1">{confirmPasswordError}</p>
                      )}
                    </div>
                  </>
                )}

                {signUpError && (
                  <div className="alert bg-red-50 border border-red-200 rounded-lg p-3">
                    <span className="text-sm text-[#EF4444]">{signUpError}</span>
                  </div>
                )}

                {(isCreatingCustomer || isSigningUp) && (
                  <div className="flex items-center justify-center gap-2 text-sm text-[#434E54]/60 py-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    {isSigningUp ? 'Creating account...' : 'Saving...'}
                  </div>
                )}
              </div>
            )}

            {/* Selected Customer Display (after submission) */}
            {(viewMode === 'guest' || viewMode === 'createAccount') &&
              (selectedCustomer || (selectedCustomerId && guestInfo)) && (
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
        </div>
      );
    }

    // Admin/Walk-in mode: search + create
    return (
      <div className="space-y-6">
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

              {isCreatingCustomer && (
                <div className="flex items-center justify-center gap-2 text-sm text-[#434E54]/60 py-2">
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </div>
              )}
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
      </div>
    );

    // --- Shared form fields ---
    function renderNewCustomerFormFields() {
      return (
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

          <div>
            <label className="block text-sm font-medium text-[#434E54] mb-2">
              Address
            </label>
            <input
              type="text"
              value={newCustomerForm.address}
              onChange={(e) =>
                setNewCustomerForm({ ...newCustomerForm, address: e.target.value })
              }
              className="input input-bordered w-full h-12 bg-white rounded-lg border-[#E5E5E5] focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20"
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#434E54] mb-2">
                City
              </label>
              <input
                type="text"
                value={newCustomerForm.city}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, city: e.target.value })
                }
                className="input input-bordered w-full h-12 bg-white rounded-lg border-[#E5E5E5] focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20"
                placeholder="La Mirada"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#434E54] mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                value={newCustomerForm.zip}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, zip: e.target.value })
                }
                maxLength={10}
                className="input input-bordered w-full h-12 bg-white rounded-lg border-[#E5E5E5] focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20"
                placeholder="90638"
              />
            </div>
          </div>
        </>
      );
    }
  }
);
