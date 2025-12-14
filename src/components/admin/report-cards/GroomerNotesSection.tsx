'use client';

/**
 * GroomerNotesSection Component
 * Textarea for groomer notes with character counter and DontSend toggle
 */

import { useState, useEffect } from 'react';
import { DontSendToggle } from './DontSendToggle';

interface GroomerNotesSectionProps {
  notes: string;
  dontSend: boolean;
  onNotesChange: (notes: string) => void;
  onDontSendChange: (dontSend: boolean) => void;
}

const MAX_CHARACTERS = 500;

export function GroomerNotesSection({
  notes,
  dontSend,
  onNotesChange,
  onDontSendChange,
}: GroomerNotesSectionProps) {
  const [characterCount, setCharacterCount] = useState(notes.length);

  useEffect(() => {
    setCharacterCount(notes.length);
  }, [notes]);

  const handleNotesChange = (value: string) => {
    if (value.length <= MAX_CHARACTERS) {
      onNotesChange(value);
    }
  };

  const isNearLimit = characterCount >= MAX_CHARACTERS * 0.9;
  const isAtLimit = characterCount >= MAX_CHARACTERS;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-[#434E54] mb-6">
        Groomer Notes
      </h2>

      {/* Textarea */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-[#434E54] mb-2">
          Additional Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Add any additional observations, special care provided, or recommendations for the pet owner..."
          className="
            w-full px-4 py-3 rounded-lg border border-gray-200 bg-white
            focus:outline-none focus:ring-2 focus:ring-[#434E54]/20 focus:border-[#434E54]
            placeholder:text-gray-400 transition-colors duration-200
            resize-none
          "
          rows={6}
        />

        {/* Character Counter */}
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-gray-500">
            These notes will be shared with the customer.
          </p>
          <p
            className={`
              text-sm font-medium
              ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-gray-500'}
            `}
          >
            {characterCount} / {MAX_CHARACTERS}
          </p>
        </div>
      </div>

      {/* DontSend Toggle */}
      <DontSendToggle value={dontSend} onChange={onDontSendChange} />
    </div>
  );
}
