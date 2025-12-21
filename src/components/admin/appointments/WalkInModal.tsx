/**
 * Walk-In Appointment Modal
 * Single-page scrollable form for quick walk-in appointments
 * Features:
 * - DateTime auto-set to NOW (current date, nearest 15-min time slot)
 * - Email field is OPTIONAL
 * - Consolidated customer, pet, service selection
 * - Quick summary and submit
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Clock, User, Heart, Scissors, CheckCircle, Loader2, Search, UserPlus, Plus, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import type { PetSize } from '@/types/database';
import { getSizeLabel, getSizeFromWeight, formatCurrency, formatDuration } from '@/lib/booking/pricing';

interface WalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  full_name: string;
}

interface Pet {
  id: string;
  name: string;
  breed_id: string;
  breed_name: string;
  size: PetSize;
  weight: number | null;
}

interface Breed {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  prices: {
    size: PetSize;
    price: number;
  }[];
}

interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface SelectedCustomer {
  id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  isNew: boolean;
}

interface SelectedPet {
  id?: string;
  name: string;
  breed_id: string | null;
  breed_name?: string;
  size: PetSize;
  weight: number;
  isNew: boolean;
}

interface SelectedService {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

interface SelectedAddon {
  id: string;
  name: string;
  price: number;
}

// Get current time rounded to nearest 15 minutes
function getRoundedCurrentTime(): { date: string; time: string; displayDate: string; displayTime: string } {
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;

  now.setMinutes(roundedMinutes);
  now.setSeconds(0);
  now.setMilliseconds(0);

  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const hours = now.getHours().toString().padStart(2, '0');
  const mins = now.getMinutes().toString().padStart(2, '0');
  const time = `${hours}:${mins}`;

  // Display format
  const displayDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
  const displayTime = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return { date, time, displayDate, displayTime };
}

export function WalkInModal({ isOpen, onClose, onSuccess }: WalkInModalProps) {
  // Auto-set date/time to now
  const { date: currentDate, time: currentTime, displayDate, displayTime } = useMemo(() => getRoundedCurrentTime(), []);

  // State
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);
  const [selectedPet, setSelectedPet] = useState<SelectedPet | null>(null);
  const [selectedService, setSelectedService] = useState<SelectedService | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Customer search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);

  // New customer form
  const [newCustomerForm, setNewCustomerForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [customerFormErrors, setCustomerFormErrors] = useState<Record<string, string>>({});

  // Pet state
  const [existingPets, setExistingPets] = useState<Pet[]>([]);
  const [isLoadingPets, setIsLoadingPets] = useState(false);
  const [showNewPetForm, setShowNewPetForm] = useState(false);
  const [breeds, setBreeds] = useState<Breed[]>([]);

  // New pet form
  const [newPetForm, setNewPetForm] = useState({
    name: '',
    breed_id: '',
    size: '' as PetSize | '',
    weight: '',
  });
  const [petFormErrors, setPetFormErrors] = useState<Record<string, string>>({});
  const [weightSizeWarning, setWeightSizeWarning] = useState('');

  // Service & Addons
  const [services, setServices] = useState<Service[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingAddons, setIsLoadingAddons] = useState(false);

  // Load breeds on mount
  useEffect(() => {
    const fetchBreeds = async () => {
      try {
        const response = await fetch('/api/admin/breeds');
        if (response.ok) {
          const data = await response.json();
          setBreeds(data.breeds || []);
        }
      } catch (error) {
        console.error('Fetch breeds error:', error);
      }
    };
    fetchBreeds();
  }, []);

  // Load services and addons
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoadingServices(true);
      try {
        const response = await fetch('/api/admin/services');
        if (response.ok) {
          const data = await response.json();
          setServices(data.services || []);
        }
      } catch (error) {
        console.error('Fetch services error:', error);
      } finally {
        setIsLoadingServices(false);
      }
    };

    const fetchAddons = async () => {
      setIsLoadingAddons(true);
      try {
        const response = await fetch('/api/admin/addons');
        if (response.ok) {
          const data = await response.json();
          setAddons(data.addons || []);
        }
      } catch (error) {
        console.error('Fetch addons error:', error);
      } finally {
        setIsLoadingAddons(false);
      }
    };

    fetchServices();
    fetchAddons();
  }, []);

  // Debounced customer search
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

  // Load pets when customer is selected
  useEffect(() => {
    if (!selectedCustomer?.id || selectedCustomer.isNew) {
      setExistingPets([]);
      return;
    }

    const fetchPets = async () => {
      setIsLoadingPets(true);
      try {
        const response = await fetch(`/api/admin/customers/${selectedCustomer.id}/pets`);
        if (response.ok) {
          const data = await response.json();
          setExistingPets(data.pets || []);
        }
      } catch (error) {
        console.error('Fetch pets error:', error);
      } finally {
        setIsLoadingPets(false);
      }
    };

    fetchPets();
  }, [selectedCustomer?.id, selectedCustomer?.isNew]);

  // Check weight/size mismatch for new pet
  useEffect(() => {
    if (newPetForm.weight && newPetForm.size) {
      const weight = parseFloat(newPetForm.weight);
      const expectedSize = getSizeFromWeight(weight);
      if (expectedSize !== newPetForm.size) {
        setWeightSizeWarning(
          `Weight ${weight} lbs typically corresponds to ${getSizeLabel(expectedSize)}, but you selected ${getSizeLabel(newPetForm.size as PetSize)}`
        );
      } else {
        setWeightSizeWarning('');
      }
    } else {
      setWeightSizeWarning('');
    }
  }, [newPetForm.weight, newPetForm.size]);

  // Handle customer selection
  const handleSelectCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer({
      id: customer.id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      isNew: false,
    });
    setSearchQuery('');
    setSearchResults([]);
    setShowNewCustomerForm(false);
  }, []);

  // Validate new customer form (email is OPTIONAL for walk-ins)
  const validateNewCustomerForm = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!newCustomerForm.first_name.trim()) {
      errors.first_name = 'First name is required';
    }
    if (!newCustomerForm.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }
    if (!newCustomerForm.phone.trim()) {
      errors.phone = 'Phone is required';
    } else {
      // Basic phone validation
      const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
      if (!phoneRegex.test(newCustomerForm.phone.replace(/\s/g, ''))) {
        errors.phone = 'Please enter a valid phone number';
      }
    }

    // Email is optional, but if provided, validate format
    if (newCustomerForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newCustomerForm.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    setCustomerFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newCustomerForm]);

  // Handle new customer form submission
  const handleNewCustomerSubmit = useCallback(() => {
    if (!validateNewCustomerForm()) return;

    setSelectedCustomer({
      first_name: newCustomerForm.first_name,
      last_name: newCustomerForm.last_name,
      email: newCustomerForm.email || undefined,
      phone: newCustomerForm.phone,
      isNew: true,
    });
    setShowNewCustomerForm(false);
  }, [newCustomerForm, validateNewCustomerForm]);

  // Handle pet selection
  const handleSelectPet = useCallback((pet: Pet) => {
    setSelectedPet({
      id: pet.id,
      name: pet.name,
      breed_id: pet.breed_id,
      breed_name: pet.breed_name,
      size: pet.size,
      weight: pet.weight || 0,
      isNew: false,
    });
    setShowNewPetForm(false);
  }, []);

  // Validate new pet form (breed is OPTIONAL for walk-ins)
  const validateNewPetForm = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!newPetForm.name.trim()) {
      errors.name = 'Pet name is required';
    }
    if (!newPetForm.size) {
      errors.size = 'Size is required';
    }

    if (newPetForm.weight) {
      const weight = parseFloat(newPetForm.weight);
      if (isNaN(weight) || weight <= 0) {
        errors.weight = 'Weight must be a positive number';
      } else if (weight > 300) {
        errors.weight = 'Weight seems too high';
      }
    }

    setPetFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newPetForm]);

  // Handle new pet form submission
  const handleNewPetSubmit = useCallback(() => {
    if (!validateNewPetForm()) return;

    const selectedBreed = breeds.find((b) => b.id === newPetForm.breed_id);

    setSelectedPet({
      name: newPetForm.name,
      breed_id: newPetForm.breed_id || null,
      breed_name: selectedBreed?.name,
      size: newPetForm.size as PetSize,
      weight: newPetForm.weight ? parseFloat(newPetForm.weight) : 0,
      isNew: true,
    });
    setShowNewPetForm(false);
  }, [newPetForm, breeds, validateNewPetForm]);

  // Get service price for selected pet size
  const getServicePrice = useCallback(
    (service: Service): number => {
      if (!selectedPet?.size) return 0;
      const priceEntry = service.prices.find((p) => p.size === selectedPet.size);
      return priceEntry?.price || 0;
    },
    [selectedPet?.size]
  );

  // Handle service selection
  const handleSelectService = useCallback(
    (service: Service) => {
      const price = getServicePrice(service);
      setSelectedService({
        id: service.id,
        name: service.name,
        duration_minutes: service.duration_minutes,
        price,
      });
    },
    [getServicePrice]
  );

  // Handle addon toggle
  const handleToggleAddon = useCallback(
    (addon: Addon) => {
      const isSelected = selectedAddons.some((a) => a.id === addon.id);
      if (isSelected) {
        setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
      } else {
        setSelectedAddons([...selectedAddons, { id: addon.id, name: addon.name, price: addon.price }]);
      }
    },
    [selectedAddons]
  );

  // Calculate total price
  const totalPrice = useMemo(() => {
    const servicePrice = selectedService?.price || 0;
    const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
    return servicePrice + addonsTotal;
  }, [selectedService, selectedAddons]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return selectedCustomer && selectedPet && selectedService;
  }, [selectedCustomer, selectedPet, selectedService]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!isFormValid || !selectedCustomer || !selectedPet || !selectedService) {
      setSubmitError('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        customer: selectedCustomer,
        pet: selectedPet,
        service_id: selectedService.id,
        addon_ids: selectedAddons.map((a) => a.id),
        appointment_date: currentDate,
        appointment_time: currentTime,
        notes: notes || undefined,
        payment_status: 'pending' as const,
        send_notification: true,
        source: 'walk_in', // Flag for tracking
      };

      const response = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data.details
          ? `${data.error}: ${data.details}`
          : data.error || 'Failed to create appointment';
        throw new Error(errorMessage);
      }

      // Success - reset and close
      setSelectedCustomer(null);
      setSelectedPet(null);
      setSelectedService(null);
      setSelectedAddons([]);
      setNotes('');
      setSearchQuery('');
      setSearchResults([]);
      setShowNewCustomerForm(false);
      setShowNewPetForm(false);
      setNewCustomerForm({ first_name: '', last_name: '', email: '', phone: '' });
      setNewPetForm({ name: '', breed_id: '', size: '', weight: '' });
      setCustomerFormErrors({});
      setPetFormErrors({});
      setSubmitError(null);
      onSuccess();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [isFormValid, selectedCustomer, selectedPet, selectedService, selectedAddons, currentDate, currentTime, notes, onSuccess, onClose]);

  // Reset state on close
  const handleClose = useCallback(() => {
    setSelectedCustomer(null);
    setSelectedPet(null);
    setSelectedService(null);
    setSelectedAddons([]);
    setNotes('');
    setSearchQuery('');
    setSearchResults([]);
    setShowNewCustomerForm(false);
    setShowNewPetForm(false);
    setNewCustomerForm({ first_name: '', last_name: '', email: '', phone: '' });
    setNewPetForm({ name: '', breed_id: '', size: '', weight: '' });
    setCustomerFormErrors({});
    setPetFormErrors({});
    setSubmitError(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl w-full h-[90vh] max-h-[900px] md:h-auto md:max-h-[85vh] p-0 bg-white md:rounded-2xl rounded-none shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-[#434E54]">Walk In</h2>
            <p className="text-sm text-[#6B7280] mt-1">Quick appointment for customers at the door</p>
          </div>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-sm btn-circle text-[#6B7280] hover:text-[#434E54] hover:bg-[#EAE0D5]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DateTime Banner (Auto-filled, Non-editable) */}
        <div className="px-6 pt-4 pb-2 bg-[#FFFBF7] border-b border-[#E5E5E5] flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="badge bg-[#6BCB77] text-white border-none px-3 py-2 rounded-full font-semibold text-xs">
              NOW
            </span>
            <div className="flex items-center gap-2 text-[#434E54]">
              <Clock className="w-4 h-4 text-[#6B7280]" />
              <span className="font-medium">{displayDate} at {displayTime}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Customer Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#EAE0D5] rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-[#434E54]" />
              </div>
              <h3 className="text-lg font-semibold text-[#434E54]">Customer</h3>
            </div>

            {!selectedCustomer ? (
              <>
                {/* Search Existing Customer */}
                <div>
                  <label className="block text-sm font-medium text-[#434E54] mb-2">
                    Search Existing Customer
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input input-bordered w-full h-12 pl-10 bg-white border-[#E5E5E5] focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 rounded-xl"
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
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full text-left p-3 rounded-xl border-2 border-[#E5E5E5] bg-white hover:border-[#434E54] hover:bg-[#FFFBF7] transition-all duration-200"
                      >
                        <div className="font-semibold text-[#434E54]">
                          {customer.first_name} {customer.last_name}
                        </div>
                        <div className="text-sm text-[#6B7280]">{customer.email}</div>
                        <div className="text-sm text-[#6B7280]">{customer.phone}</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Divider */}
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-[#E5E5E5]"></div>
                  <span className="px-4 text-sm text-[#9CA3AF]">OR</span>
                  <div className="flex-grow border-t border-[#E5E5E5]"></div>
                </div>

                {/* New Customer Form Toggle */}
                <button
                  onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                  className="flex items-center gap-2 text-[#434E54] font-semibold hover:text-[#363F44]"
                >
                  <UserPlus className="w-5 h-5" />
                  New Customer
                  {showNewCustomerForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* New Customer Form */}
                {showNewCustomerForm && (
                  <div className="p-4 bg-[#FFFBF7] rounded-xl border border-[#E5E5E5] space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-[#434E54] mb-1">
                          First Name <span className="text-[#EF4444]">*</span>
                        </label>
                        <input
                          type="text"
                          value={newCustomerForm.first_name}
                          onChange={(e) => setNewCustomerForm({ ...newCustomerForm, first_name: e.target.value })}
                          className={`input input-bordered w-full h-12 bg-white rounded-xl ${
                            customerFormErrors.first_name ? 'border-[#EF4444]' : 'border-[#E5E5E5]'
                          }`}
                          placeholder="John"
                        />
                        {customerFormErrors.first_name && (
                          <p className="text-sm text-[#EF4444] mt-1">{customerFormErrors.first_name}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#434E54] mb-1">
                          Last Name <span className="text-[#EF4444]">*</span>
                        </label>
                        <input
                          type="text"
                          value={newCustomerForm.last_name}
                          onChange={(e) => setNewCustomerForm({ ...newCustomerForm, last_name: e.target.value })}
                          className={`input input-bordered w-full h-12 bg-white rounded-xl ${
                            customerFormErrors.last_name ? 'border-[#EF4444]' : 'border-[#E5E5E5]'
                          }`}
                          placeholder="Doe"
                        />
                        {customerFormErrors.last_name && (
                          <p className="text-sm text-[#EF4444] mt-1">{customerFormErrors.last_name}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#434E54] mb-1">
                        Phone <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        type="tel"
                        value={newCustomerForm.phone}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                        className={`input input-bordered w-full h-12 bg-white rounded-xl ${
                          customerFormErrors.phone ? 'border-[#EF4444]' : 'border-[#E5E5E5]'
                        }`}
                        placeholder="(555) 123-4567"
                      />
                      {customerFormErrors.phone && (
                        <p className="text-sm text-[#EF4444] mt-1">{customerFormErrors.phone}</p>
                      )}
                      <p className="text-xs text-[#6B7280] mt-1">Required for appointment notifications</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#434E54] mb-1">
                        Email <span className="text-[#9CA3AF]">(optional)</span>
                      </label>
                      <input
                        type="email"
                        value={newCustomerForm.email}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                        className={`input input-bordered w-full h-12 bg-white rounded-xl ${
                          customerFormErrors.email ? 'border-[#EF4444]' : 'border-[#E5E5E5]'
                        }`}
                        placeholder="john.doe@example.com"
                      />
                      {customerFormErrors.email && (
                        <p className="text-sm text-[#EF4444] mt-1">{customerFormErrors.email}</p>
                      )}
                      <p className="text-xs text-[#6B7280] mt-1">For appointment confirmations and receipts</p>
                    </div>

                    <button
                      onClick={handleNewCustomerSubmit}
                      className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none w-full h-12 rounded-xl"
                    >
                      Use This Customer
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 bg-[#6BCB77]/10 border-2 border-[#6BCB77] rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#434E54]">
                      {selectedCustomer.first_name} {selectedCustomer.last_name}
                      {selectedCustomer.isNew && (
                        <span className="ml-2 badge badge-sm bg-[#434E54] text-white border-none">New</span>
                      )}
                    </div>
                    {selectedCustomer.email && (
                      <div className="text-sm text-[#6B7280]">{selectedCustomer.email}</div>
                    )}
                    <div className="text-sm text-[#6B7280]">{selectedCustomer.phone}</div>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="btn btn-ghost btn-sm text-[#6B7280]"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pet Section (Only show if customer is selected) */}
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#EAE0D5] rounded-lg flex items-center justify-center">
                  <Heart className="w-4 h-4 text-[#434E54]" />
                </div>
                <h3 className="text-lg font-semibold text-[#434E54]">Pet</h3>
              </div>

              {!selectedPet ? (
                <>
                  {/* Existing Pets */}
                  {isLoadingPets ? (
                    <div className="flex justify-center py-4">
                      <span className="loading loading-spinner loading-md text-[#434E54]"></span>
                    </div>
                  ) : existingPets.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {existingPets.map((pet) => (
                        <button
                          key={pet.id}
                          onClick={() => handleSelectPet(pet)}
                          className="w-full text-left p-3 rounded-xl border-2 border-[#E5E5E5] bg-white hover:border-[#434E54] hover:bg-[#FFFBF7] transition-all duration-200"
                        >
                          <div className="font-semibold text-[#434E54]">{pet.name}</div>
                          <div className="text-sm text-[#6B7280]">{pet.breed_name}</div>
                          <div className="flex gap-2 mt-1">
                            <span className="badge badge-sm bg-[#EAE0D5] text-[#434E54] border-none">
                              {getSizeLabel(pet.size)}
                            </span>
                            {pet.weight && (
                              <span className="badge badge-sm bg-[#EAE0D5] text-[#434E54] border-none">
                                {pet.weight} lbs
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {/* New Pet Form Toggle */}
                  {existingPets.length > 0 && (
                    <div className="relative flex items-center">
                      <div className="flex-grow border-t border-[#E5E5E5]"></div>
                      <span className="px-4 text-sm text-[#9CA3AF]">OR</span>
                      <div className="flex-grow border-t border-[#E5E5E5]"></div>
                    </div>
                  )}

                  <button
                    onClick={() => setShowNewPetForm(!showNewPetForm)}
                    className="flex items-center gap-2 text-[#434E54] font-semibold hover:text-[#363F44]"
                  >
                    <Plus className="w-5 h-5" />
                    New Pet
                    {showNewPetForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {/* New Pet Form */}
                  {showNewPetForm && (
                    <div className="p-4 bg-[#FFFBF7] rounded-xl border border-[#E5E5E5] space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#434E54] mb-1">
                          Pet Name <span className="text-[#EF4444]">*</span>
                        </label>
                        <input
                          type="text"
                          value={newPetForm.name}
                          onChange={(e) => setNewPetForm({ ...newPetForm, name: e.target.value })}
                          className={`input input-bordered w-full h-12 bg-white rounded-xl ${
                            petFormErrors.name ? 'border-[#EF4444]' : 'border-[#E5E5E5]'
                          }`}
                          placeholder="Max"
                        />
                        {petFormErrors.name && (
                          <p className="text-sm text-[#EF4444] mt-1">{petFormErrors.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#434E54] mb-1">
                          Breed <span className="text-[#9CA3AF]">(optional)</span>
                        </label>
                        <select
                          value={newPetForm.breed_id}
                          onChange={(e) => setNewPetForm({ ...newPetForm, breed_id: e.target.value })}
                          className="select select-bordered w-full h-12 bg-white rounded-xl border-[#E5E5E5]"
                        >
                          <option value="">Select breed...</option>
                          {breeds.map((breed) => (
                            <option key={breed.id} value={breed.id}>
                              {breed.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#434E54] mb-1">
                          Size <span className="text-[#EF4444]">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['small', 'medium', 'large', 'xlarge'] as PetSize[]).map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setNewPetForm({ ...newPetForm, size })}
                              className={`btn h-12 rounded-xl ${
                                newPetForm.size === size
                                  ? 'bg-[#434E54] text-white hover:bg-[#363F44] border-none'
                                  : 'btn-outline border-[#E5E5E5] hover:border-[#434E54] text-[#434E54]'
                              }`}
                            >
                              {getSizeLabel(size)}
                            </button>
                          ))}
                        </div>
                        {petFormErrors.size && (
                          <p className="text-sm text-[#EF4444] mt-1">{petFormErrors.size}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#434E54] mb-1">
                          Weight (lbs) <span className="text-[#9CA3AF]">(optional)</span>
                        </label>
                        <input
                          type="number"
                          value={newPetForm.weight}
                          onChange={(e) => setNewPetForm({ ...newPetForm, weight: e.target.value })}
                          className={`input input-bordered w-full h-12 bg-white rounded-xl ${
                            petFormErrors.weight ? 'border-[#EF4444]' : 'border-[#E5E5E5]'
                          }`}
                          placeholder="25"
                          min="1"
                          max="300"
                        />
                        {petFormErrors.weight && (
                          <p className="text-sm text-[#EF4444] mt-1">{petFormErrors.weight}</p>
                        )}
                        {weightSizeWarning && (
                          <div className="alert bg-[#FFB347]/10 border border-[#FFB347] rounded-lg p-2 mt-2 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-[#434E54]">{weightSizeWarning}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleNewPetSubmit}
                        className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none w-full h-12 rounded-xl"
                      >
                        Use This Pet
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 bg-[#6BCB77]/10 border-2 border-[#6BCB77] rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#434E54]">
                        {selectedPet.name}
                        {selectedPet.isNew && (
                          <span className="ml-2 badge badge-sm bg-[#434E54] text-white border-none">New</span>
                        )}
                      </div>
                      {selectedPet.breed_name && (
                        <div className="text-sm text-[#6B7280]">{selectedPet.breed_name}</div>
                      )}
                      <div className="flex gap-2 mt-1">
                        <span className="badge badge-sm bg-[#EAE0D5] text-[#434E54] border-none">
                          {getSizeLabel(selectedPet.size)}
                        </span>
                        {selectedPet.weight > 0 && (
                          <span className="badge badge-sm bg-[#EAE0D5] text-[#434E54] border-none">
                            {selectedPet.weight} lbs
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPet(null)}
                      className="btn btn-ghost btn-sm text-[#6B7280]"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Service Section (Only show if pet is selected) */}
          {selectedPet && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#EAE0D5] rounded-lg flex items-center justify-center">
                  <Scissors className="w-4 h-4 text-[#434E54]" />
                </div>
                <h3 className="text-lg font-semibold text-[#434E54]">Service</h3>
              </div>

              {isLoadingServices ? (
                <div className="flex justify-center py-4">
                  <span className="loading loading-spinner loading-md text-[#434E54]"></span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {services.map((service) => {
                    const price = getServicePrice(service);
                    const isSelected = selectedService?.id === service.id;

                    return (
                      <button
                        key={service.id}
                        onClick={() => handleSelectService(service)}
                        className={`text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-[#434E54] bg-[#FFFBF7] shadow-md'
                            : 'border-[#E5E5E5] bg-white hover:border-[#434E54]/30 shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[#434E54]">{service.name}</div>
                            <div className="text-xs text-[#6B7280] mt-1 line-clamp-1">{service.description}</div>
                            <span className="inline-block badge badge-sm bg-[#EAE0D5] text-[#434E54] border-none mt-2">
                              {formatDuration(service.duration_minutes)}
                            </span>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-bold text-[#434E54]">{formatCurrency(price)}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Add-ons */}
              {selectedService && !isLoadingAddons && addons.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#434E54]">
                    Add-ons <span className="text-[#9CA3AF]">(Optional)</span>
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {addons.map((addon) => {
                      const isSelected = selectedAddons.some((a) => a.id === addon.id);

                      return (
                        <label
                          key={addon.id}
                          className={`flex items-start p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'border-[#434E54] bg-[#FFFBF7]'
                              : 'border-[#E5E5E5] bg-white hover:border-[#434E54]/30'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleAddon(addon)}
                            className="checkbox checkbox-sm checkbox-primary mt-1 min-w-[20px] min-h-[20px]"
                          />
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1">
                                <div className="font-semibold text-[#434E54] text-sm">{addon.name}</div>
                                <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-1">{addon.description}</p>
                              </div>
                              <div className="font-bold text-sm text-[#434E54]">
                                {formatCurrency(addon.price)}
                              </div>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary Section (Only show if service is selected) */}
          {selectedService && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#434E54]">Summary</h3>

              <div className="p-4 bg-[#FFFBF7] rounded-xl border border-[#E5E5E5]">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B7280]">{selectedService.name}</span>
                    <span className="font-medium text-[#434E54]">{formatCurrency(selectedService.price)}</span>
                  </div>

                  {selectedAddons.length > 0 && (
                    <>
                      <div className="border-t border-[#E5E5E5] my-2"></div>
                      {selectedAddons.map((addon) => (
                        <div key={addon.id} className="flex justify-between text-sm">
                          <span className="text-[#6B7280]">{addon.name}</span>
                          <span className="font-medium text-[#434E54]">{formatCurrency(addon.price)}</span>
                        </div>
                      ))}
                    </>
                  )}

                  <div className="border-t border-[#E5E5E5] my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#434E54]">Total</span>
                    <span className="font-bold text-xl text-[#434E54]">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[#434E54] mb-2">
                  Notes <span className="text-[#9CA3AF]">(Optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="textarea textarea-bordered w-full bg-white border-[#E5E5E5] focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 rounded-xl"
                  rows={3}
                  placeholder="Any special requests or notes..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {submitError && (
          <div className="px-6 pb-4 flex-shrink-0">
            <div className="alert alert-error bg-red-50 border border-red-200 rounded-xl p-3">
              <span className="text-sm text-red-800">{submitError}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-[#FFFBF7] flex-shrink-0">
          <button
            onClick={handleClose}
            className="btn btn-ghost text-[#434E54] hover:bg-[#EAE0D5]"
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`btn h-12 px-6 rounded-xl ${
              isFormValid && !isSubmitting
                ? 'bg-[#6BCB77] text-white hover:bg-[#5BB967] border-none'
                : 'btn-disabled bg-gray-300 text-gray-500'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Create Walk-In
              </>
            )}
          </button>
        </div>
      </div>

      {/* Backdrop */}
      <div className="modal-backdrop bg-black/50" onClick={handleClose} />
    </div>
  );
}
