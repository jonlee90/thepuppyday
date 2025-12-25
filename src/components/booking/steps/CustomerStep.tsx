/**
 * Customer Selection Step for Admin/Walk-in booking modes
 * Search for existing customers or create new customer inline
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, UserPlus, User } from 'lucide-react';
import { useBookingStore } from '@/stores/bookingStore';
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

export function CustomerStep() {
  const {
    selectedCustomerId,
    guestInfo,
    setSelectedCustomerId,
    setGuestInfo,
  } = useBookingStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New customer form state
  const [newCustomerForm, setNewCustomerForm] = useState({
    first_name: guestInfo?.firstName || '',
    last_name: guestInfo?.lastName || '',
    email: guestInfo?.email || '',
    phone: guestInfo?.phone || '',
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
      setSelectedCustomer(customer);
      setSelectedCustomerId(customer.id);
      setGuestInfo({
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
        phone: customer.phone,
      });
      setShowNewCustomerForm(false);
    },
    [setSelectedCustomerId, setGuestInfo]
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
  }, [newCustomerForm, validateNewCustomerForm, setSelectedCustomerId, setGuestInfo]);

  const isNewCustomer = selectedCustomerId === 'new';

  return (
    <div className="space-y-6">
      {/* Subtitle */}
      <p className="text-[#434E54]/70 leading-relaxed">
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
        <span className="px-4 text-sm text-[#9CA3AF] bg-[#FFFBF7]">OR</span>
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
          <div className="mt-4 p-4 md:p-6 bg-white rounded-xl border border-[#E5E5E5] space-y-4">
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
                value={newCustomerForm.phone}
                onChange={(e) =>
                  setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })
                }
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
              className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none w-full h-12 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Use This Customer
            </button>
          </div>
        )}
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
            {selectedCustomer?.phone || guestInfo?.phone}
          </div>
        </div>
      )}
    </div>
  );
}
