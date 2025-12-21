/**
 * CustomerProfile Component
 * Comprehensive customer profile with 6 sections
 * Task 0018: Create CustomerProfile component
 */

'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  PawPrint,
  ChevronDown,
  ChevronUp,
  Award,
  CreditCard,
  Flag,
  Plus,
} from 'lucide-react';
import { AppointmentHistoryList } from './AppointmentHistoryList';
import { CustomerFlagBadge, SingleFlagBadge } from './CustomerFlagBadge';
import { CustomerFlagForm, RemoveFlagConfirmation } from './CustomerFlagForm';
import { isWalkinPlaceholderEmail } from '@/lib/utils';
import type { User as UserType, Pet, CustomerFlag, CustomerMembership } from '@/types/database';

interface CustomerDetail extends UserType {
  pets: Pet[];
  flags: CustomerFlag[];
  loyalty_points: any;
  loyalty_transactions: any[];
  active_membership: CustomerMembership | null;
}

interface CustomerProfileProps {
  customerId: string;
}

export function CustomerProfile({ customerId }: CustomerProfileProps) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Contact info editing
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editedContact, setEditedContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [savingContact, setSavingContact] = useState(false);

  // Pet expansion state
  const [expandedPetIds, setExpandedPetIds] = useState<Set<string>>(new Set());

  // Flag modal state
  const [isFlagFormOpen, setIsFlagFormOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<CustomerFlag | null>(null);
  const [isRemoveFlagOpen, setIsRemoveFlagOpen] = useState(false);
  const [removingFlag, setRemovingFlag] = useState(false);

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/customers/${customerId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch customer');
      }

      setCustomer(result.data);
      setEditedContact({
        first_name: result.data.first_name,
        last_name: result.data.last_name,
        email: result.data.email,
        phone: result.data.phone || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async () => {
    setSavingContact(true);

    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedContact),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update customer');
      }

      setCustomer({ ...customer!, ...result.data });
      setIsEditingContact(false);
    } catch (err) {
      // Security: Replace alert() with console.error
      // TODO: Implement toast notification system for better UX
      console.error('Failed to update customer:', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSavingContact(false);
    }
  };

  const handleCancelEdit = () => {
    if (customer) {
      setEditedContact({
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone: customer.phone || '',
      });
    }
    setIsEditingContact(false);
  };

  const togglePetExpansion = (petId: string) => {
    setExpandedPetIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(petId)) {
        newSet.delete(petId);
      } else {
        newSet.add(petId);
      }
      return newSet;
    });
  };

  const handleAddFlag = () => {
    setSelectedFlag(null);
    setIsFlagFormOpen(true);
  };

  const handleEditFlag = (flag: CustomerFlag) => {
    setSelectedFlag(flag);
    setIsFlagFormOpen(true);
  };

  const handleRemoveFlag = (flag: CustomerFlag) => {
    setSelectedFlag(flag);
    setIsRemoveFlagOpen(true);
  };

  const confirmRemoveFlag = async () => {
    if (!selectedFlag) return;

    setRemovingFlag(true);

    try {
      const response = await fetch(
        `/api/admin/customers/${customerId}/flags/${selectedFlag.id}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove flag');
      }

      fetchCustomer();
      setIsRemoveFlagOpen(false);
      setSelectedFlag(null);
    } catch (err) {
      // Security: Replace alert() with console.error
      // TODO: Implement toast notification system for better UX
      console.error('Failed to remove flag:', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setRemovingFlag(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-[#434E54] rounded-full animate-spin" />
          <span>Loading customer profile...</span>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-6 rounded-lg bg-red-50 border border-red-200">
        <p className="text-red-700">{error || 'Customer not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Contact Info */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#434E54] flex items-center gap-2">
            <User className="w-5 h-5" />
            Contact Information
          </h2>
          {!isEditingContact ? (
            <button
              onClick={() => setIsEditingContact(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                         text-[#434E54] hover:bg-gray-100 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelEdit}
                disabled={savingContact}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                           border border-gray-200 text-[#434E54] hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSaveContact}
                disabled={savingContact}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                           bg-[#434E54] text-white hover:bg-[#363F44] transition-colors
                           disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingContact ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            {isEditingContact ? (
              <input
                type="text"
                value={editedContact.first_name}
                onChange={(e) =>
                  setEditedContact({ ...editedContact, first_name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200
                           focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]"
              />
            ) : (
              <p className="text-[#434E54] font-medium">{customer.first_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            {isEditingContact ? (
              <input
                type="text"
                value={editedContact.last_name}
                onChange={(e) =>
                  setEditedContact({ ...editedContact, last_name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200
                           focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]"
              />
            ) : (
              <p className="text-[#434E54] font-medium">{customer.last_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            {isEditingContact ? (
              <input
                type="email"
                value={isWalkinPlaceholderEmail(editedContact.email) ? '' : editedContact.email}
                onChange={(e) =>
                  setEditedContact({ ...editedContact, email: e.target.value })
                }
                placeholder={isWalkinPlaceholderEmail(customer.email) ? 'Add email address...' : undefined}
                className="w-full px-3 py-2 rounded-lg border border-gray-200
                           focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]"
              />
            ) : (
              <div className="flex items-center gap-2 text-[#434E54]">
                <Mail className="w-4 h-4" />
                {isWalkinPlaceholderEmail(customer.email) ? (
                  <p className="text-gray-400 italic">Walk-in customer (phone only)</p>
                ) : (
                  <p>{customer.email}</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            {isEditingContact ? (
              <input
                type="tel"
                value={editedContact.phone}
                onChange={(e) =>
                  setEditedContact({ ...editedContact, phone: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200
                           focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]"
              />
            ) : (
              <div className="flex items-center gap-2 text-[#434E54]">
                <Phone className="w-4 h-4" />
                <p>{customer.phone || 'Not provided'}</p>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registration Date
            </label>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <p>{format(new Date(customer.created_at), 'MMMM dd, yyyy')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Pets */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-[#434E54] flex items-center gap-2 mb-4">
          <PawPrint className="w-5 h-5" />
          Pets ({customer.pets.length})
        </h2>

        {customer.pets.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <PawPrint className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-600">No pets registered</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customer.pets.map((pet) => (
              <div
                key={pet.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-[#434E54]">{pet.name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#EAE0D5] text-[#434E54] text-xs font-medium">
                        {pet.size.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Breed: </span>
                        <span className="text-[#434E54]">
                          {pet.breed?.name || pet.breed_custom || 'Unknown'}
                        </span>
                      </div>
                      {pet.weight && (
                        <div>
                          <span className="text-gray-600">Weight: </span>
                          <span className="text-[#434E54]">{pet.weight} lbs</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => togglePetExpansion(pet.id)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    {expandedPetIds.has(pet.id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>

                {expandedPetIds.has(pet.id) && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-sm">
                    {pet.notes && (
                      <div>
                        <span className="text-gray-600 font-medium">Notes: </span>
                        <p className="text-[#434E54] mt-1">{pet.notes}</p>
                      </div>
                    )}
                    {pet.medical_info && (
                      <div>
                        <span className="text-gray-600 font-medium">Medical Info: </span>
                        <p className="text-[#434E54] mt-1">{pet.medical_info}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Appointment History */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-[#434E54] flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5" />
          Appointment History
        </h2>
        <AppointmentHistoryList customerId={customerId} />
      </div>

      {/* Section 4: Flags */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#434E54] flex items-center gap-2">
            <Flag className="w-5 h-5" />
            Customer Flags ({customer.flags.length})
          </h2>
          <button
            onClick={handleAddFlag}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                       bg-[#434E54] text-white hover:bg-[#363F44] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Flag
          </button>
        </div>

        {customer.flags.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Flag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-600">No flags set</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customer.flags.map((flag) => (
              <div
                key={flag.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <SingleFlagBadge flag={flag} size="md" />
                    <p className="text-sm text-gray-700 mt-2">{flag.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Added {format(new Date(flag.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveFlag(flag)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 5: Loyalty Points */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-[#434E54] flex items-center gap-2 mb-4">
          <Award className="w-5 h-5" />
          Loyalty Program
        </h2>

        {customer.loyalty_points ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 mb-1">Current Punches</p>
                <p className="text-3xl font-bold text-green-800">
                  {customer.loyalty_points.current_punches || 0}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 mb-1">Cards Completed</p>
                <p className="text-3xl font-bold text-blue-800">
                  {customer.loyalty_points.cards_completed || 0}
                </p>
              </div>
            </div>

            {customer.loyalty_transactions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h3>
                <div className="space-y-2">
                  {customer.loyalty_transactions.slice(0, 5).map((transaction: any) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between text-sm p-2 rounded bg-gray-50"
                    >
                      <span className="text-gray-700">Punch added</span>
                      <span className="text-gray-500">
                        {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-600">Not enrolled in loyalty program</p>
          </div>
        )}
      </div>

      {/* Section 6: Membership */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-semibold text-[#434E54] flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5" />
          Membership
        </h2>

        {customer.active_membership ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#434E54]">
                  {customer.active_membership.membership?.name}
                </h3>
                <p className="text-sm text-gray-600">
                  ${customer.active_membership.membership?.price}/
                  {customer.active_membership.membership?.billing_frequency}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium border border-green-200">
                Active
              </span>
            </div>

            {customer.active_membership.current_period_end && (
              <p className="text-sm text-gray-600">
                Renews on{' '}
                {format(
                  new Date(customer.active_membership.current_period_end),
                  'MMMM dd, yyyy'
                )}
              </p>
            )}

            {customer.active_membership.membership?.benefits && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Benefits:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {customer.active_membership.membership.benefits.map(
                    (benefit: string, index: number) => (
                      <li key={index}>{benefit}</li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-600">No active membership</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <CustomerFlagForm
        customerId={customerId}
        flag={selectedFlag}
        isOpen={isFlagFormOpen}
        onClose={() => {
          setIsFlagFormOpen(false);
          setSelectedFlag(null);
        }}
        onSuccess={fetchCustomer}
      />

      {selectedFlag && (
        <RemoveFlagConfirmation
          flag={selectedFlag}
          isOpen={isRemoveFlagOpen}
          onClose={() => {
            setIsRemoveFlagOpen(false);
            setSelectedFlag(null);
          }}
          onConfirm={confirmRemoveFlag}
          loading={removingFlag}
        />
      )}
    </div>
  );
}
