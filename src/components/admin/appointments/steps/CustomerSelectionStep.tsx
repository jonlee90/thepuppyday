/**
 * Customer Selection Step
 * Task 0014: Search existing customers or create new customer
 * Redesigned with mobile-first, touch-friendly UI matching customer booking flow
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, UserPlus, User } from 'lucide-react';
import type { ManualAppointmentState } from '@/types/admin-appointments';
import { guestInfoSchema } from '@/lib/booking/validation';
import { z } from 'zod';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  full_name: string;
}

interface CustomerSelectionStepProps {
  state: ManualAppointmentState;
  updateState: (updates: Partial<ManualAppointmentState>) => void;
  onNext: () => void;
}

export function CustomerSelectionStep({
  state,
  updateState,
}: CustomerSelectionStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    state.selectedCustomer?.id || null
  );

  // New customer form state
  const [newCustomerForm, setNewCustomerForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [duplicateEmailError, setDuplicateEmailError] = useState('');

  // Debounced search
  useEffect(() => {
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
  }, [searchQuery]);

  // Handle customer selection
  const handleSelectCustomer = useCallback(
    (customer: Customer) => {
      setSelectedCustomerId(customer.id);
      updateState({
        selectedCustomer: {
          id: customer.id,
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
          isNew: false,
        },
      });
    },
    [updateState]
  );

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
    const isValid = await validateNewCustomerForm();
    if (!isValid) return;

    updateState({
      selectedCustomer: {
        id: 'new',
        first_name: newCustomerForm.first_name,
        last_name: newCustomerForm.last_name,
        email: newCustomerForm.email,
        phone: newCustomerForm.phone,
        isNew: true,
      },
    });
    setSelectedCustomerId('new');
  }, [newCustomerForm, validateNewCustomerForm, updateState]);

  return (
    <div className="space-y-6">
      {/* Header with icon badge and paw print decoration */}
      <div className="relative">
        {/* Subtle paw print decoration */}
        <div className="absolute -top-2 -right-2 opacity-[0.04] pointer-events-none hidden lg:block">
          <svg className="w-16 h-16 text-[#434E54]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-3 12c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3 3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm3-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 6c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z"/>
          </svg>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#EAE0D5] rounded-xl flex items-center justify-center shadow-sm">
            <User className="w-5 h-5 text-[#434E54]" />
          </div>
          <h2 className="text-2xl font-bold text-[#434E54]">Select Customer</h2>
        </div>
        <p className="text-[#434E54]/70">Search for an existing customer or create a new one</p>
      </div>

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
          <div className="space-y-3 max-h-80 overflow-y-auto">
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
                  <div className="text-sm text-[#6B7280]">{customer.phone}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="relative flex items-center">
        <div className="flex-grow border-t border-[#E5E5E5]"></div>
        <span className="px-4 text-sm text-[#9CA3AF] bg-[#F8EEE5]">OR</span>
        <div className="flex-grow border-t border-[#E5E5E5]"></div>
      </div>

      {/* New Customer Form */}
      <div>
        <button
          onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
          className="flex items-center gap-2 text-[#434E54] font-semibold hover:text-[#363F44] transition-colors duration-200 min-h-[44px]"
          aria-expanded={showNewCustomerForm}
        >
          <UserPlus className="w-5 h-5" />
          Create New Customer
          {showNewCustomerForm ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showNewCustomerForm && (
          <div className="mt-4 p-4 md:p-6 bg-[#FFFBF7] rounded-xl border border-[#E5E5E5] space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  aria-invalid={!!formErrors.first_name}
                  aria-describedby={formErrors.first_name ? 'first-name-error' : undefined}
                />
                {formErrors.first_name && (
                  <p id="first-name-error" className="text-sm text-[#EF4444] mt-1">
                    {formErrors.first_name}
                  </p>
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
                  aria-invalid={!!formErrors.last_name}
                  aria-describedby={formErrors.last_name ? 'last-name-error' : undefined}
                />
                {formErrors.last_name && (
                  <p id="last-name-error" className="text-sm text-[#EF4444] mt-1">
                    {formErrors.last_name}
                  </p>
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
                aria-invalid={!!formErrors.email}
                aria-describedby={formErrors.email ? 'email-error' : undefined}
              />
              {formErrors.email && (
                <p id="email-error" className="text-sm text-[#EF4444] mt-1">
                  {formErrors.email}
                </p>
              )}
              {duplicateEmailError && (
                <div className="alert bg-[#FFB347]/10 border border-[#FFB347] rounded-lg p-3 mt-2" role="alert">
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
                value={newCustomerForm.phone}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })
                }
                className={`input input-bordered w-full h-12 bg-white rounded-lg ${
                  formErrors.phone ? 'border-[#EF4444]' : 'border-[#E5E5E5]'
                } focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20`}
                placeholder="(555) 123-4567"
                aria-invalid={!!formErrors.phone}
                aria-describedby={formErrors.phone ? 'phone-error' : undefined}
              />
              {formErrors.phone && (
                <p id="phone-error" className="text-sm text-[#EF4444] mt-1">
                  {formErrors.phone}
                </p>
              )}
            </div>

            <button
              onClick={handleNewCustomerSubmit}
              className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none w-full h-12 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Use This Customer
            </button>
          </div>
        )}
      </div>

      {/* Selected Customer Display */}
      {state.selectedCustomer && (
        <div className="p-4 bg-[#6BCB77]/10 border-2 border-[#6BCB77] rounded-xl" role="status">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#6BCB77] rounded-full"></div>
            <span className="text-sm font-semibold text-[#434E54]">Customer Selected</span>
          </div>
          <div className="font-semibold text-[#434E54]">
            {state.selectedCustomer.first_name} {state.selectedCustomer.last_name}
            {state.selectedCustomer.isNew && (
              <span className="ml-2 badge badge-sm bg-[#434E54] text-white border-none">New</span>
            )}
          </div>
          <div className="text-sm text-[#6B7280]">{state.selectedCustomer.email}</div>
          <div className="text-sm text-[#6B7280]">{state.selectedCustomer.phone}</div>
        </div>
      )}
    </div>
  );
}
