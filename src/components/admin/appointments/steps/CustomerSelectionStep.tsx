/**
 * Customer Selection Step
 * Task 0014: Search existing customers or create new customer
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, UserPlus } from 'lucide-react';
import type { ManualAppointmentState, SelectedCustomer } from '@/types/admin-appointments';
import { guestInfoSchema } from '@/lib/booking/validation';
import { z } from 'zod';

interface CustomerSelectionStepProps {
  state: ManualAppointmentState;
  updateState: (updates: Partial<ManualAppointmentState>) => void;
  onNext: () => void;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export function CustomerSelectionStep({
  state,
  updateState,
  onNext,
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
        error.errors.forEach((err) => {
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
        first_name: newCustomerForm.first_name,
        last_name: newCustomerForm.last_name,
        email: newCustomerForm.email,
        phone: newCustomerForm.phone,
        isNew: true,
      },
    });
    setSelectedCustomerId('new');
  }, [newCustomerForm, validateNewCustomerForm, updateState]);

  // Handle next button
  const handleNext = useCallback(() => {
    if (state.selectedCustomer) {
      onNext();
    }
  }, [state.selectedCustomer, onNext]);

  const canProceed = state.selectedCustomer !== null;

  return (
    <div className="space-y-6">
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
            className="input input-bordered w-full pl-10 bg-white border-gray-200 focus:border-[#434E54] focus:outline-none"
          />
        </div>
        {isSearching && (
          <p className="text-sm text-[#6B7280] mt-2">Searching...</p>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[#434E54]">
            Select Customer ({searchResults.length} found)
          </label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.map((customer) => (
              <label
                key={customer.id}
                className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedCustomerId === customer.id
                    ? 'border-[#434E54] bg-[#FFFBF7] shadow-md'
                    : 'border-gray-200 bg-white hover:border-[#434E54]/30'
                }`}
              >
                <input
                  type="radio"
                  name="customer"
                  value={customer.id}
                  checked={selectedCustomerId === customer.id}
                  onChange={() => handleSelectCustomer(customer)}
                  className="radio radio-sm radio-primary mt-1"
                />
                <div className="ml-3 flex-1">
                  <div className="font-semibold text-[#434E54]">
                    {customer.first_name} {customer.last_name}
                  </div>
                  <div className="text-sm text-[#6B7280]">{customer.email}</div>
                  <div className="text-sm text-[#6B7280]">{customer.phone}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="divider text-[#9CA3AF]">OR</div>

      {/* New Customer Form */}
      <div>
        <button
          onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
          className="flex items-center gap-2 text-[#434E54] font-semibold hover:text-[#363F44] transition-colors"
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
          <div className="mt-4 p-6 bg-[#FFFBF7] rounded-xl border border-gray-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#434E54] mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCustomerForm.first_name}
                  onChange={(e) =>
                    setNewCustomerForm({ ...newCustomerForm, first_name: e.target.value })
                  }
                  className={`input input-bordered w-full bg-white ${
                    formErrors.first_name ? 'border-red-500' : ''
                  }`}
                  placeholder="John"
                />
                {formErrors.first_name && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.first_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#434E54] mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCustomerForm.last_name}
                  onChange={(e) =>
                    setNewCustomerForm({ ...newCustomerForm, last_name: e.target.value })
                  }
                  className={`input input-bordered w-full bg-white ${
                    formErrors.last_name ? 'border-red-500' : ''
                  }`}
                  placeholder="Doe"
                />
                {formErrors.last_name && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.last_name}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#434E54] mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={newCustomerForm.email}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, email: e.target.value })
                }
                className={`input input-bordered w-full bg-white ${
                  formErrors.email ? 'border-red-500' : ''
                }`}
                placeholder="john.doe@example.com"
              />
              {formErrors.email && (
                <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
              )}
              {duplicateEmailError && (
                <div className="alert alert-warning mt-2">
                  <span className="text-sm">{duplicateEmailError}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#434E54] mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={newCustomerForm.phone}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })
                }
                className={`input input-bordered w-full bg-white ${
                  formErrors.phone ? 'border-red-500' : ''
                }`}
                placeholder="(555) 123-4567"
              />
              {formErrors.phone && (
                <p className="text-sm text-red-500 mt-1">{formErrors.phone}</p>
              )}
            </div>

            <button
              onClick={handleNewCustomerSubmit}
              className="btn bg-[#434E54] text-white hover:bg-[#363F44] w-full"
            >
              Use This Customer
            </button>
          </div>
        )}
      </div>

      {/* Selected Customer Display */}
      {state.selectedCustomer && (
        <div className="p-4 bg-[#6BCB77]/10 border-2 border-[#6BCB77] rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#6BCB77] rounded-full"></div>
            <span className="text-sm font-semibold text-[#434E54]">Customer Selected</span>
          </div>
          <div className="font-semibold text-[#434E54]">
            {state.selectedCustomer.first_name} {state.selectedCustomer.last_name}
            {state.selectedCustomer.isNew && (
              <span className="ml-2 badge badge-sm bg-[#434E54] text-white">New</span>
            )}
          </div>
          <div className="text-sm text-[#6B7280]">{state.selectedCustomer.email}</div>
          <div className="text-sm text-[#6B7280]">{state.selectedCustomer.phone}</div>
        </div>
      )}

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`btn ${
            canProceed
              ? 'bg-[#434E54] text-white hover:bg-[#363F44]'
              : 'btn-disabled bg-gray-300 text-gray-500'
          }`}
        >
          Next: Select Pet
        </button>
      </div>
    </div>
  );
}
