'use client';

import { Plus } from 'lucide-react';

interface VariableInserterProps {
  onInsert: (variable: string) => void;
}

interface Variable {
  name: string;
  value: string;
  description: string;
}

const AVAILABLE_VARIABLES: Variable[] = [
  {
    name: 'Customer Name',
    value: '{customer_name}',
    description: "Customer's full name",
  },
  {
    name: 'Pet Name',
    value: '{pet_name}',
    description: "Customer's pet name",
  },
  {
    name: 'Booking Link',
    value: '{booking_link}',
    description: 'Link to booking page',
  },
  {
    name: 'Business Name',
    value: '{business_name}',
    description: 'The Puppy Day',
  },
  {
    name: 'Business Phone',
    value: '{business_phone}',
    description: '(657) 252-2903',
  },
  {
    name: 'Business Address',
    value: '{business_address}',
    description: '14936 Leffingwell Rd, La Mirada, CA 90638',
  },
];

/**
 * VariableInserter - Insert personalization variables into messages
 */
export function VariableInserter({ onInsert }: VariableInserterProps) {
  return (
    <div>
      <label className="label">
        <span className="label-text font-medium">Personalization Variables</span>
      </label>
      <div className="card bg-gray-50 border border-gray-200">
        <div className="card-body py-4">
          <p className="text-sm text-[#6B7280] mb-3">
            Click to insert a variable at your cursor position
          </p>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_VARIABLES.map((variable) => (
              <button
                key={variable.value}
                onClick={() => onInsert(variable.value)}
                className="btn btn-sm btn-outline gap-1"
                title={variable.description}
                type="button"
              >
                <Plus className="w-3 h-3" />
                {variable.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
