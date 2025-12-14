'use client';

import { useRef } from 'react';
import { VariableInserter } from './VariableInserter';

interface EmailEditorProps {
  subject: string;
  body: string;
  onSubjectChange: (subject: string) => void;
  onBodyChange: (body: string) => void;
}

/**
 * EmailEditor - Edit email subject and body
 */
export function EmailEditor({ subject, body, onSubjectChange, onBodyChange }: EmailEditorProps) {
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Handle variable insertion
  const handleInsertVariable = (variable: string) => {
    // Determine which field is focused
    const activeElement = document.activeElement;

    if (activeElement === subjectRef.current) {
      const input = subjectRef.current;
      if (!input) return;

      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;

      const newText = subject.substring(0, start) + variable + subject.substring(end);
      onSubjectChange(newText);

      setTimeout(() => {
        input.focus();
        const newCursorPos = start + variable.length;
        input.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      const textarea = bodyRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;

      const newText = body.substring(0, start) + variable + body.substring(end);
      onBodyChange(newText);

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + variable.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  return (
    <div className="space-y-4">
      {/* Subject Line */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Email Subject *</span>
          <span className="label-text-alt text-[#6B7280]">
            {subject.length}/100 characters
          </span>
        </label>
        <input
          ref={subjectRef}
          type="text"
          placeholder="e.g., Welcome to Puppy Day!"
          className="input input-bordered"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          maxLength={100}
        />
      </div>

      {/* Email Body */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Email Body *</span>
          <span className="label-text-alt text-[#6B7280]">
            {body.length}/5000 characters
          </span>
        </label>
        <textarea
          ref={bodyRef}
          placeholder="Enter your email message here... Use variables like {customer_name} for personalization."
          className="textarea textarea-bordered h-64 font-mono"
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          maxLength={5000}
        />
      </div>

      {/* Variable Inserter */}
      <VariableInserter onInsert={handleInsertVariable} />

      {/* Preview */}
      <div className="card bg-gray-50 border border-gray-200">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-medium text-[#434E54]">Preview</h5>
            <div className="badge badge-ghost">Sample Data</div>
          </div>

          {/* Email Preview */}
          <div className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
            {/* Subject */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="text-xs text-[#6B7280] mb-1">Subject:</div>
              <div className="font-semibold text-[#434E54]">
                {subject
                  ? subject
                      .replace(/{customer_name}/g, 'Sarah')
                      .replace(/{pet_name}/g, 'Max')
                  : 'Your subject line will appear here...'}
              </div>
            </div>

            {/* Body */}
            <div className="prose prose-sm max-w-none">
              {body ? (
                <div className="whitespace-pre-wrap">
                  {body
                    .replace(/{customer_name}/g, 'Sarah')
                    .replace(/{pet_name}/g, 'Max')
                    .replace(/{booking_link}/g, 'https://puppyday.com/book')}
                </div>
              ) : (
                <p className="text-[#6B7280] italic">Your message preview will appear here...</p>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-[#6B7280]">
              <p>The Puppy Day</p>
              <p>14936 Leffingwell Rd, La Mirada, CA 90638</p>
              <p>(657) 252-2903</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
