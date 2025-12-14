'use client';

import { useState, useRef } from 'react';
import { VariableInserter } from './VariableInserter';

interface SMSEditorProps {
  body: string;
  onBodyChange: (body: string) => void;
}

/**
 * SMSEditor - Edit SMS message with character limit
 */
export function SMSEditor({ body, onBodyChange }: SMSEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  const MAX_LENGTH = 160;
  const remaining = MAX_LENGTH - body.length;

  // Handle variable insertion
  const handleInsertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newText = body.substring(0, start) + variable + body.substring(end);
    onBodyChange(newText);

    // Move cursor after inserted variable
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + variable.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Update cursor position
  const handleCursorChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  return (
    <div className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">SMS Message *</span>
          <span
            className={`label-text-alt font-medium ${
              remaining < 0 ? 'text-error' : remaining < 20 ? 'text-warning' : 'text-[#6B7280]'
            }`}
          >
            {remaining} characters remaining
          </span>
        </label>
        <textarea
          ref={textareaRef}
          placeholder="Enter your SMS message here... Use variables like {customer_name} for personalization."
          className={`textarea textarea-bordered h-32 font-mono ${
            remaining < 0 ? 'textarea-error' : ''
          }`}
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          onSelect={handleCursorChange}
          onKeyUp={handleCursorChange}
          onClick={handleCursorChange}
          maxLength={200}
        />
        {remaining < 0 && (
          <label className="label">
            <span className="label-text-alt text-error">
              Message exceeds 160 character limit. Please shorten your message.
            </span>
          </label>
        )}
      </div>

      {/* Variable Inserter */}
      <VariableInserter onInsert={handleInsertVariable} />

      {/* Preview */}
      <div className="card bg-gray-50 border border-gray-200">
        <div className="card-body">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-medium text-[#434E54]">Preview</h5>
            <div className="badge badge-ghost">Sample Data</div>
          </div>
          <div className="mockup-phone">
            <div className="camera"></div>
            <div className="display">
              <div className="artboard artboard-demo phone-1 bg-white p-4">
                <div className="chat chat-start">
                  <div className="chat-bubble bg-gray-200 text-gray-900">
                    {body
                      ? body
                          .replace(/{customer_name}/g, 'Sarah')
                          .replace(/{pet_name}/g, 'Max')
                          .replace(/{booking_link}/g, 'puppyday.com/book')
                      : 'Your message preview will appear here...'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
