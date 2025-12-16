'use client';

import { TemplateVariable } from '@/types/template';
import { ChevronDown, Code } from 'lucide-react';
import { useRef, useState } from 'react';

interface VariableInserterProps {
  variables: TemplateVariable[];
  onInsert: (variable: string) => void;
}

export function VariableInserter({ variables, onInsert }: VariableInserterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleInsert = (variableName: string) => {
    onInsert(`{{${variableName}}}`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-sm bg-transparent text-[#434E54] border border-[#434E54]
                   hover:bg-[#434E54] hover:text-white gap-2"
      >
        <Code className="w-4 h-4" />
        Insert Variable
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg
                         border border-gray-200 z-20 max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3">
              <h4 className="font-semibold text-[#434E54]">Available Variables</h4>
              <p className="text-xs text-[#6B7280] mt-1">
                Click to insert at cursor position
              </p>
            </div>

            {/* Variables List */}
            <div className="py-2">
              {variables.length === 0 ? (
                <div className="px-4 py-8 text-center text-[#6B7280]">
                  No variables available
                </div>
              ) : (
                variables.map((variable) => (
                  <button
                    key={variable.name}
                    type="button"
                    onClick={() => handleInsert(variable.name)}
                    className="w-full text-left px-4 py-3 hover:bg-[#F8EEE5] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-mono text-[#434E54] bg-[#EAE0D5]
                                         px-2 py-0.5 rounded">
                            {`{{${variable.name}}}`}
                          </code>
                          {variable.required && (
                            <span className="text-xs text-red-500 font-medium">Required</span>
                          )}
                        </div>
                        <p className="text-sm text-[#6B7280] leading-relaxed">
                          {variable.description}
                        </p>
                        {variable.example_value && (
                          <p className="text-xs text-[#9CA3AF] mt-1">
                            Example: {variable.example_value}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-[#F8EEE5] border-t border-gray-200 px-4 py-3">
              <p className="text-xs text-[#6B7280]">
                Variables will be replaced with actual values when the notification is sent.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
