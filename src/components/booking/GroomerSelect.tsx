/**
 * Groomer Selection Component
 * Allows admin users to assign a groomer to an appointment
 */

'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

interface Groomer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'groomer';
}

interface GroomerSelectProps {
  value: string | null;
  onChange: (groomerId: string | null) => void;
  className?: string;
}

export function GroomerSelect({ value, onChange, className = '' }: GroomerSelectProps) {
  const [groomers, setGroomers] = useState<Groomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGroomers();
  }, []);

  const fetchGroomers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/groomers');
      if (!response.ok) {
        throw new Error('Failed to fetch groomers');
      }

      const data = await response.json();
      setGroomers(data.groomers || []);
    } catch (err) {
      console.error('Error fetching groomers:', err);
      setError('Failed to load groomers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue === '' ? null : selectedValue);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-[#434E54]/60 ${className}`}>
        <div className="loading loading-spinner loading-sm"></div>
        <span className="text-sm">Loading groomers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm text-error ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-[#434E54] mb-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>Assign Groomer</span>
          <span className="text-[#434E54]/60 font-normal">(Optional)</span>
        </div>
      </label>
      <select
        value={value || ''}
        onChange={handleChange}
        className="select select-bordered w-full bg-white border-[#434E54]/20
                 focus:border-[#434E54] focus:outline-none focus:ring-2
                 focus:ring-[#434E54]/20"
      >
        <option value="">No groomer assigned</option>
        {groomers.map((groomer) => (
          <option key={groomer.id} value={groomer.id}>
            {groomer.first_name} {groomer.last_name}
            {groomer.role === 'admin' && ' (Admin)'}
          </option>
        ))}
      </select>
      {groomers.length === 0 && (
        <p className="text-sm text-[#434E54]/60 mt-1">
          No groomers available
        </p>
      )}
    </div>
  );
}
