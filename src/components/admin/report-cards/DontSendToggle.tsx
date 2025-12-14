'use client';

/**
 * DontSendToggle Component
 * Toggle to prevent automatic report card sending
 */

interface DontSendToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function DontSendToggle({ value, onChange }: DontSendToggleProps) {
  return (
    <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      {/* Toggle */}
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="toggle toggle-warning mt-0.5"
      />

      {/* Label and explanation */}
      <div className="flex-1">
        <label className="block text-sm font-semibold text-[#434E54] mb-1 cursor-pointer">
          Don't Send This Report Card
        </label>
        <p className="text-sm text-gray-600">
          Enable this to prevent automatic email delivery of this report card to the customer.
          Use this option when there are sensitive observations that require a phone call first.
        </p>
      </div>
    </div>
  );
}
