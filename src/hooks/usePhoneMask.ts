/**
 * Phone number masking hook
 * Auto-formats phone numbers as user types in the format (XXX) XXX-XXXX
 */

'use client';

import { useState, useCallback, ChangeEvent } from 'react';
import { formatPhoneNumber, unformatPhoneNumber } from '@/lib/utils/phone';

// Re-export utilities for convenience
export { formatPhoneNumber, unformatPhoneNumber };

interface UsePhoneMaskReturn {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  setValue: (value: string) => void;
  rawValue: string;
}

/**
 * Hook for phone number input masking
 * @param initialValue - Initial phone number value (can be formatted or unformatted)
 * @returns Object with value, onChange handler, onPaste handler, and setValue function
 */
export function usePhoneMask(initialValue: string = ''): UsePhoneMaskReturn {
  const [value, setValueState] = useState(() => formatPhoneNumber(initialValue));

  const setValue = useCallback((newValue: string) => {
    setValueState(formatPhoneNumber(newValue));
  }, []);

  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPhoneNumber(inputValue);
    setValueState(formatted);
  }, []);

  const onPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const formatted = formatPhoneNumber(pastedText);
    setValueState(formatted);
  }, []);

  const rawValue = unformatPhoneNumber(value);

  return {
    value,
    onChange,
    onPaste,
    setValue,
    rawValue,
  };
}
