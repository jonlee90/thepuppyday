'use client';

export interface ChipOption {
  value: string;
  label: string;
  count?: number;
}

export interface MobileChipRowProps {
  options: ChipOption[];
  value: string | string[];
  onChange: (value: string) => void;
  multiSelect?: boolean;
  className?: string;
}

export function MobileChipRow({
  options,
  value,
  onChange,
  multiSelect = false,
  className = '',
}: MobileChipRowProps) {
  const isActive = (chipValue: string) => {
    if (Array.isArray(value)) {
      return value.includes(chipValue);
    }
    return value === chipValue;
  };

  return (
    <div
      role={multiSelect ? 'group' : 'radiogroup'}
      className={`flex gap-2 overflow-x-auto scrollbar-hide px-1 -mx-1 py-1 ${className}`}
      style={{ scrollSnapType: 'x mandatory' }}
    >
      {options.map((option) => {
        const active = isActive(option.value);
        return (
          <button
            key={option.value}
            role={multiSelect ? 'checkbox' : 'radio'}
            aria-checked={active}
            onClick={() => onChange(option.value)}
            style={{ scrollSnapAlign: 'start' }}
            className={`flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              active
                ? 'bg-[#434E54] text-white'
                : 'bg-white text-[#434E54] border border-[#E5E5E5] hover:border-[#434E54]/30'
            }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="ml-1 text-xs opacity-70">{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
