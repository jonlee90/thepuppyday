'use client';

import { useEffect, useState } from 'react';
import { Users, ChevronDown } from 'lucide-react';

interface Groomer {
  id: string;
  full_name: string;
  email: string;
}

interface GroomerSelectorProps {
  onGroomerChange: (groomerId: string | null) => void;
  selectedGroomerId?: string | null;
}

export function GroomerSelector({ onGroomerChange, selectedGroomerId }: GroomerSelectorProps) {
  const [groomers, setGroomers] = useState<Groomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGroomers();
  }, []);

  const fetchGroomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users?role=groomer');
      if (!response.ok) throw new Error('Failed to fetch groomers');
      const data = await response.json();
      setGroomers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groomers');
    } finally {
      setLoading(false);
    }
  };

  const selectedGroomer = groomers.find(g => g.id === selectedGroomerId);

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="skeleton h-10 w-10 rounded-lg"></div>
          <div className="skeleton h-10 flex-1 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="text-error text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-[#EAE0D5] rounded-lg">
          <Users className="w-5 h-5 text-[#434E54]" />
        </div>

        <div className="dropdown flex-1">
          <label
            tabIndex={0}
            className="btn btn-ghost w-full justify-between normal-case font-medium text-[#434E54] hover:bg-[#F8EEE5]"
          >
            <span className="truncate">
              {selectedGroomer ? selectedGroomer.full_name : 'All Groomers'}
            </span>
            <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
          </label>

          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow-lg bg-white rounded-xl w-full max-h-64 overflow-y-auto"
          >
            <li>
              <button
                onClick={() => onGroomerChange(null)}
                className={`${
                  !selectedGroomerId
                    ? 'bg-[#EAE0D5] text-[#434E54] font-semibold'
                    : 'text-[#6B7280] hover:bg-[#F8EEE5]'
                }`}
              >
                <Users className="w-4 h-4" />
                All Groomers
              </button>
            </li>

            <div className="divider my-1"></div>

            {groomers.map((groomer) => (
              <li key={groomer.id}>
                <button
                  onClick={() => onGroomerChange(groomer.id)}
                  className={`${
                    selectedGroomerId === groomer.id
                      ? 'bg-[#EAE0D5] text-[#434E54] font-semibold'
                      : 'text-[#6B7280] hover:bg-[#F8EEE5]'
                  }`}
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-medium">{groomer.full_name}</span>
                    <span className="text-xs text-[#9CA3AF]">{groomer.email}</span>
                  </div>
                </button>
              </li>
            ))}

            {groomers.length === 0 && (
              <li className="text-center text-[#9CA3AF] text-sm py-4">
                No groomers found
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
