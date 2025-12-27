/**
 * Event Mapping Form Component
 * Task 0047: Step 3 - Map calendar events to appointment details
 */

'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Search, AlertCircle, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import type { GoogleCalendarEvent } from '@/types/calendar';

interface EventMappingFormProps {
  events: GoogleCalendarEvent[];
  selectedEventIds: Set<string>;
  mappings: Map<string, EventMapping>;
  suggestions: Array<{
    eventId: string;
    customerId?: string;
    petId?: string;
    serviceId?: string;
  }>;
  currentIndex: number;
  onUpdateMapping: (eventId: string, field: keyof EventMapping, value: string | string[]) => void;
  onChangeIndex: (index: number) => void;
}

interface EventMapping {
  eventId: string;
  customerId: string;
  petId: string;
  serviceId: string;
  addonIds: string[];
  notes: string;
  errors?: {
    customer?: string;
    pet?: string;
    service?: string;
  };
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

interface Pet {
  id: string;
  name: string;
  size: string;
  breed?: string;
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
}

interface Addon {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

export function EventMappingForm({
  events,
  selectedEventIds,
  mappings,
  suggestions,
  currentIndex,
  onUpdateMapping,
  onChangeIndex,
}: EventMappingFormProps) {
  const selectedEvents = events.filter((e) => selectedEventIds.has(e.id));
  const currentEvent = selectedEvents[currentIndex];
  const currentMapping = currentEvent ? mappings.get(currentEvent.id) : null;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);

  const [customerSearch, setCustomerSearch] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoadingPets, setIsLoadingPets] = useState(false);

  // Fetch customers, services, addons on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch customers
        const customersRes = await fetch('/api/admin/customers');
        if (customersRes.ok) {
          const data = await customersRes.json();
          setCustomers(data.customers || []);
        }

        // Fetch services
        const servicesRes = await fetch('/api/admin/services');
        if (servicesRes.ok) {
          const data = await servicesRes.json();
          setServices(data.services || []);
        }

        // Fetch addons
        const addonsRes = await fetch('/api/admin/addons');
        if (addonsRes.ok) {
          const data = await addonsRes.json();
          setAddons(data.addons || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  // Filter customers based on search
  useEffect(() => {
    if (customerSearch) {
      const search = customerSearch.toLowerCase();
      const filtered = customers.filter(
        (c) =>
          c.first_name.toLowerCase().includes(search) ||
          c.last_name.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          (c.phone && c.phone.includes(search))
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [customerSearch, customers]);

  // Fetch pets when customer is selected
  useEffect(() => {
    if (currentMapping?.customerId) {
      const fetchPets = async () => {
        setIsLoadingPets(true);
        try {
          const res = await fetch(`/api/admin/customers/${currentMapping.customerId}/pets`);
          if (res.ok) {
            const data = await res.json();
            setPets(data.pets || []);
          }
        } catch (error) {
          console.error('Failed to fetch pets:', error);
        } finally {
          setIsLoadingPets(false);
        }
      };

      fetchPets();
    } else {
      setPets([]);
    }
  }, [currentMapping?.customerId]);

  if (!currentEvent || !currentMapping) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6B7280]">No events selected</p>
      </div>
    );
  }

  // Format event date/time
  const formatDateTime = (event: GoogleCalendarEvent) => {
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);

    const dateStr = start.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const startTime = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const endTime = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return {
      date: dateStr,
      time: `${startTime} - ${endTime}`,
    };
  };

  const { date, time } = formatDateTime(currentEvent);

  // Get suggestion for current event
  const suggestion = suggestions.find((s) => s.eventId === currentEvent.id);

  // Handle customer selection
  const handleSelectCustomer = (customerId: string) => {
    onUpdateMapping(currentEvent.id, 'customerId', customerId);
    // Reset pet selection when customer changes
    onUpdateMapping(currentEvent.id, 'petId', '');
    setCustomerSearch('');
  };

  // Handle addon toggle
  const handleToggleAddon = (addonId: string) => {
    const current = currentMapping.addonIds || [];
    const next = current.includes(addonId)
      ? current.filter((id) => id !== addonId)
      : [...current, addonId];
    onUpdateMapping(currentEvent.id, 'addonIds', next);
  };

  // Calculate addon subtotal
  const addonSubtotal = (currentMapping.addonIds || []).reduce((sum, addonId) => {
    const addon = addons.find((a) => a.id === addonId);
    return sum + (addon?.price || 0);
  }, 0);

  // Selected customer
  const selectedCustomer = customers.find((c) => c.id === currentMapping.customerId);

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="text-center mb-4">
        <p className="text-sm text-[#9CA3AF]">
          Mapping {currentIndex + 1} of {selectedEvents.length}
        </p>
      </div>

      {/* Event Header */}
      <div className="p-4 bg-[#434E54] text-white rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm">{date}</span>
          <Clock className="w-5 h-5 ml-2" aria-hidden="true" />
          <span className="text-sm">{time}</span>
        </div>
        <h3 className="text-lg font-semibold">{currentEvent.summary}</h3>
        {currentEvent.description && (
          <p className="text-sm text-white/80 mt-1 line-clamp-2">{currentEvent.description}</p>
        )}
      </div>

      {/* Suggestion */}
      {suggestion && (suggestion.customerId || suggestion.petId || suggestion.serviceId) && (
        <div className="flex items-start gap-2 p-3 bg-[#DBEAFE] border border-[#93C5FD] rounded-lg">
          <Lightbulb className="w-5 h-5 text-[#1E40AF] flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-[#1E3A8A]">
            <p className="font-medium mb-1">AI Suggestions Available</p>
            <p>We found potential matches based on the event details. Apply suggestions or select manually.</p>
          </div>
        </div>
      )}

      {/* Customer Selector */}
      <div>
        <label htmlFor="customer-search" className="block text-sm font-medium text-[#6B7280] mb-2">
          Customer <span className="text-[#EF4444]" aria-label="required">*</span>
        </label>
        <div className="relative">
          <div className="relative">
            <input
              id="customer-search"
              type="text"
              placeholder="Search or create customer..."
              value={selectedCustomer ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                if (selectedCustomer) {
                  onUpdateMapping(currentEvent.id, 'customerId', '');
                }
              }}
              className={`input input-bordered w-full bg-white pr-10 ${
                currentMapping.errors?.customer ? 'border-[#EF4444] focus:border-[#EF4444]' : 'border-[#E5E5E5] focus:border-[#434E54]'
              } focus:outline-none focus:ring-2 ${currentMapping.errors?.customer ? 'focus:ring-[#EF4444]/20' : 'focus:ring-[#434E54]/20'}`}
              aria-required="true"
              aria-invalid={currentMapping.errors?.customer ? 'true' : 'false'}
              aria-describedby={currentMapping.errors?.customer ? 'customer-error' : undefined}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] pointer-events-none" aria-hidden="true" />
          </div>

          {/* Customer Dropdown */}
          {customerSearch && !selectedCustomer && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-[#E5E5E5] rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleSelectCustomer(customer.id)}
                    className="w-full px-4 py-2 text-left hover:bg-[#F8EEE5] transition-colors duration-150 border-b border-[#F5F5F5] last:border-b-0"
                  >
                    <p className="font-medium text-[#434E54]">
                      {customer.first_name} {customer.last_name}
                    </p>
                    <p className="text-sm text-[#9CA3AF]">
                      {customer.email} {customer.phone && `• ${customer.phone}`}
                    </p>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-[#9CA3AF]">
                  No customers found. <button type="button" className="text-[#434E54] underline">Create new customer</button>
                </div>
              )}
            </div>
          )}
        </div>

        {currentMapping.errors?.customer && (
          <div id="customer-error" role="alert" className="flex items-center gap-1 mt-1 text-sm text-[#EF4444]">
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            {currentMapping.errors.customer}
          </div>
        )}
      </div>

      {/* Pet Selector */}
      <div>
        <label htmlFor="pet-select" className="block text-sm font-medium text-[#6B7280] mb-2">
          Pet <span className="text-[#EF4444]" aria-label="required">*</span>
        </label>
        <select
          id="pet-select"
          value={currentMapping.petId}
          onChange={(e) => onUpdateMapping(currentEvent.id, 'petId', e.target.value)}
          disabled={!currentMapping.customerId || isLoadingPets}
          className={`select select-bordered w-full bg-white ${
            currentMapping.errors?.pet ? 'border-[#EF4444] focus:border-[#EF4444]' : 'border-[#E5E5E5] focus:border-[#434E54]'
          } focus:outline-none focus:ring-2 ${currentMapping.errors?.pet ? 'focus:ring-[#EF4444]/20' : 'focus:ring-[#434E54]/20'} ${
            !currentMapping.customerId ? 'cursor-not-allowed bg-[#F5F5F5] text-[#9CA3AF]' : ''
          }`}
          aria-required="true"
          aria-invalid={currentMapping.errors?.pet ? 'true' : 'false'}
          aria-describedby={currentMapping.errors?.pet ? 'pet-error' : undefined}
        >
          <option value="">
            {!currentMapping.customerId
              ? 'Select customer first'
              : isLoadingPets
              ? 'Loading pets...'
              : pets.length === 0
              ? 'No pets found'
              : 'Select pet...'}
          </option>
          {pets.map((pet) => (
            <option key={pet.id} value={pet.id}>
              {pet.name} ({pet.breed || 'Unknown breed'}, {pet.size})
            </option>
          ))}
        </select>

        {currentMapping.errors?.pet && (
          <div id="pet-error" role="alert" className="flex items-center gap-1 mt-1 text-sm text-[#EF4444]">
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            {currentMapping.errors.pet}
          </div>
        )}

        {currentMapping.customerId && pets.length === 0 && !isLoadingPets && (
          <p className="text-sm text-[#9CA3AF] mt-1">
            No pets found for this customer. <button type="button" className="text-[#434E54] underline">Create new pet</button>
          </p>
        )}
      </div>

      {/* Service Selector */}
      <div>
        <label htmlFor="service-select" className="block text-sm font-medium text-[#6B7280] mb-2">
          Service <span className="text-[#EF4444]" aria-label="required">*</span>
        </label>
        <select
          id="service-select"
          value={currentMapping.serviceId}
          onChange={(e) => onUpdateMapping(currentEvent.id, 'serviceId', e.target.value)}
          className={`select select-bordered w-full bg-white ${
            currentMapping.errors?.service ? 'border-[#EF4444] focus:border-[#EF4444]' : 'border-[#E5E5E5] focus:border-[#434E54]'
          } focus:outline-none focus:ring-2 ${currentMapping.errors?.service ? 'focus:ring-[#EF4444]/20' : 'focus:ring-[#434E54]/20'}`}
          aria-required="true"
          aria-invalid={currentMapping.errors?.service ? 'true' : 'false'}
          aria-describedby={currentMapping.errors?.service ? 'service-error' : undefined}
        >
          <option value="">Select service...</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} ({service.duration_minutes} min)
            </option>
          ))}
        </select>

        {currentMapping.errors?.service && (
          <div id="service-error" role="alert" className="flex items-center gap-1 mt-1 text-sm text-[#EF4444]">
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            {currentMapping.errors.service}
          </div>
        )}
      </div>

      {/* Addons Selector */}
      <div>
        <label className="block text-sm font-medium text-[#6B7280] mb-2">Add-ons (optional)</label>
        <div className="space-y-2 border border-[#E5E5E5] rounded-lg p-3 bg-white">
          {addons.length > 0 ? (
            addons.map((addon) => (
              <label
                key={addon.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-[#FFFBF7] cursor-pointer transition-colors duration-150"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(currentMapping.addonIds || []).includes(addon.id)}
                    onChange={() => handleToggleAddon(addon.id)}
                    className="checkbox checkbox-primary checkbox-sm"
                  />
                  <span className="text-[#434E54]">{addon.name}</span>
                </div>
                <span className="text-[#6B7280] font-medium">+${addon.price}</span>
              </label>
            ))
          ) : (
            <p className="text-sm text-[#9CA3AF]">No addons available</p>
          )}

          {addonSubtotal > 0 && (
            <div className="pt-2 border-t border-[#E5E5E5] flex justify-between items-center">
              <span className="text-sm font-medium text-[#434E54]">Subtotal:</span>
              <span className="text-[#434E54] font-semibold">${addonSubtotal}</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes Input */}
      <div>
        <label htmlFor="notes-input" className="block text-sm font-medium text-[#6B7280] mb-2">
          Notes (optional)
        </label>
        <textarea
          id="notes-input"
          value={currentMapping.notes}
          onChange={(e) => onUpdateMapping(currentEvent.id, 'notes', e.target.value)}
          placeholder="Add any special instructions or preferences..."
          rows={3}
          maxLength={500}
          className="textarea textarea-bordered w-full bg-white border-[#E5E5E5] focus:border-[#434E54] focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 resize-none"
        />
        <div className="flex justify-end mt-1">
          <span className="text-xs text-[#9CA3AF]">
            {currentMapping.notes.length} / 500 characters
          </span>
        </div>
      </div>

      {/* Navigation between events */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E5]">
        <button
          type="button"
          onClick={() => onChangeIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="btn btn-ghost hover:bg-[#F8EEE5] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          Previous Event
        </button>

        <button
          type="button"
          onClick={() => onChangeIndex(Math.min(selectedEvents.length - 1, currentIndex + 1))}
          disabled={currentIndex === selectedEvents.length - 1}
          className="btn btn-ghost hover:bg-[#F8EEE5] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next Event
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
