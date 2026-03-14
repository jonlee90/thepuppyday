'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { NotificationTemplate } from '@/types/template';
import { VariableInserter } from '../../../components/VariableInserter';
import { SmsCharacterCounter } from './SmsCharacterCounter';
import { Save, Loader2, Mail, Code, FileText, MessageSquare, Type } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TemplateEditorProps {
  template: NotificationTemplate;
  onSave: (updates: {
    subject_template?: string;
    html_template?: string;
    text_template?: string;
    sms_template?: string;
    change_reason: string;
  }) => Promise<void>;
  onContentChange: (content: {
    subject?: string;
    html_template?: string;
    text_template?: string;
    sms_template?: string;
  }) => void;
}

export function TemplateEditor({ template, onSave, onContentChange }: TemplateEditorProps) {
  const [subject, setSubject] = useState(template.subject_template || '');
  const [htmlTemplate, setHtmlTemplate] = useState(template.html_template || '');
  const [textTemplate, setTextTemplate] = useState(template.text_template || '');
  const [smsTemplate, setSmsTemplate] = useState(template.sms_template || '');
  const [changeReason, setChangeReason] = useState('');
  const [saving, setSaving] = useState(false);

  // Refs for cursor position tracking
  const subjectRef = useRef<HTMLInputElement>(null);
  const htmlRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const smsRef = useRef<HTMLTextAreaElement>(null);

  // Track changes with useMemo
  const hasChanges = useMemo(() => {
    return (
      subject !== (template.subject_template || '') ||
      htmlTemplate !== (template.html_template || '') ||
      textTemplate !== (template.text_template || '') ||
      smsTemplate !== (template.sms_template || '')
    );
  }, [subject, htmlTemplate, textTemplate, smsTemplate, template]);

  // Notify parent of content changes for preview
  useEffect(() => {
    onContentChange({
      subject,
      html_template: htmlTemplate,
      text_template: textTemplate,
      sms_template: smsTemplate,
    });
  }, [subject, htmlTemplate, textTemplate, smsTemplate, onContentChange]);

  const handleInsertVariable = (variable: string, field: 'subject' | 'html' | 'text' | 'sms') => {
    let ref: HTMLInputElement | HTMLTextAreaElement | null = null;
    let currentValue = '';
    let setValue: (value: string) => void = () => {};

    switch (field) {
      case 'subject':
        ref = subjectRef.current;
        currentValue = subject;
        setValue = setSubject;
        break;
      case 'html':
        ref = htmlRef.current;
        currentValue = htmlTemplate;
        setValue = setHtmlTemplate;
        break;
      case 'text':
        ref = textRef.current;
        currentValue = textTemplate;
        setValue = setTextTemplate;
        break;
      case 'sms':
        ref = smsRef.current;
        currentValue = smsTemplate;
        setValue = setSmsTemplate;
        break;
    }

    if (!ref) return;

    const cursorPosition = ref.selectionStart || 0;
    const newValue =
      currentValue.slice(0, cursorPosition) +
      variable +
      currentValue.slice(cursorPosition);

    setValue(newValue);

    // Set cursor position after insertion
    setTimeout(() => {
      if (ref) {
        ref.focus();
        ref.setSelectionRange(
          cursorPosition + variable.length,
          cursorPosition + variable.length
        );
      }
    }, 0);
  };

  const handleSave = async () => {
    if (!changeReason.trim()) {
      toast.error('Please provide a change reason');
      return;
    }

    // Validation
    if (template.channel === 'email' && !subject.trim()) {
      toast.error('Subject line is required');
      return;
    }

    // Check required variables
    const requiredVars = template.variables.filter((v) => v.required);
    const content =
      template.channel === 'email'
        ? `${subject} ${htmlTemplate} ${textTemplate}`
        : smsTemplate;

    for (const variable of requiredVars) {
      if (!content.includes(`{{${variable.name}}}`)) {
        toast.error(`Required variable {{${variable.name}}} is missing`);
        return;
      }
    }

    try {
      setSaving(true);

      await onSave({
        ...(template.channel === 'email'
          ? {
              subject_template: subject,
              html_template: htmlTemplate,
              text_template: textTemplate,
            }
          : {
              sms_template: smsTemplate,
            }),
        change_reason: changeReason,
      });

      setChangeReason('');
    } catch (err) {
      console.error('Error saving template:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Metadata */}
      <div className="bg-[#EAE0D5]/30 rounded-xl p-4 border border-[#F0EAE0]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#434E54]/40 mb-1">
              Template Name
            </label>
            <p className="text-sm text-[#434E54]">{template.name}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#434E54]/40 mb-1">
              Channel
            </label>
            <p className="text-sm text-[#434E54]">{template.channel.toUpperCase()}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#434E54]/40 mb-1">
              Trigger Event
            </label>
            <p className="text-sm text-[#434E54]">{template.trigger_event}</p>
          </div>
        </div>
      </div>

      {/* Email Template Fields */}
      {template.channel === 'email' && (
        <>
          {/* Subject Line */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Type className="w-3.5 h-3.5 text-[#434E54]/40" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#434E54]/40">
                  Subject Line
                </span>
                <span className="text-[#D4A574]">*</span>
              </div>
              <VariableInserter
                variables={template.variables}
                onInsert={(variable) => handleInsertVariable(variable, 'subject')}
              />
            </div>
            <input
              ref={subjectRef}
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="w-full py-2.5 px-4 rounded-lg border border-[#434E54]/20 bg-white
                       focus:outline-none focus:ring-2 focus:ring-[#434E54]/30
                       focus:border-[#434E54] placeholder:text-gray-400"
            />
          </div>

          {/* HTML Template */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#434E54]/40" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#434E54]/40">
                  HTML Template
                </span>
              </div>
              <VariableInserter
                variables={template.variables}
                onInsert={(variable) => handleInsertVariable(variable, 'html')}
              />
            </div>
            <textarea
              ref={htmlRef}
              value={htmlTemplate}
              onChange={(e) => setHtmlTemplate(e.target.value)}
              placeholder="Enter HTML template..."
              className="w-full py-2.5 px-4 rounded-lg border border-[#434E54]/20 bg-white
                       focus:outline-none focus:ring-2 focus:ring-[#434E54]/30
                       focus:border-[#434E54] placeholder:text-gray-400 font-mono text-sm
                       resize-none"
              rows={12}
            />
            <p className="text-xs text-[#6B7280] mt-1">
              Use HTML for rich formatting. Variables will be replaced at send time.
            </p>
          </div>

          {/* Plain Text Template */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#434E54]/40" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#434E54]/40">
                  Plain Text Version
                </span>
              </div>
              <VariableInserter
                variables={template.variables}
                onInsert={(variable) => handleInsertVariable(variable, 'text')}
              />
            </div>
            <textarea
              ref={textRef}
              value={textTemplate}
              onChange={(e) => setTextTemplate(e.target.value)}
              placeholder="Enter plain text version..."
              className="w-full py-2.5 px-4 rounded-lg border border-[#434E54]/20 bg-white
                       focus:outline-none focus:ring-2 focus:ring-[#434E54]/30
                       focus:border-[#434E54] placeholder:text-gray-400 resize-none"
              rows={8}
            />
            <p className="text-xs text-[#6B7280] mt-1">
              Plain text fallback for email clients that don&apos;t support HTML.
            </p>
          </div>
        </>
      )}

      {/* SMS Template Fields */}
      {template.channel === 'sms' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-[#434E54]/40" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#434E54]/40">
                SMS Message
              </span>
              <span className="text-[#D4A574]">*</span>
            </div>
            <VariableInserter
              variables={template.variables}
              onInsert={(variable) => handleInsertVariable(variable, 'sms')}
            />
          </div>
          <textarea
            ref={smsRef}
            value={smsTemplate}
            onChange={(e) => setSmsTemplate(e.target.value)}
            placeholder="Enter SMS message..."
            className="w-full py-2.5 px-4 rounded-lg border border-[#434E54]/20 bg-white
                     focus:outline-none focus:ring-2 focus:ring-[#434E54]/30
                     focus:border-[#434E54] placeholder:text-gray-400 resize-none"
            rows={6}
          />

          {/* Character Counter */}
          <div className="mt-4">
            <SmsCharacterCounter content={smsTemplate} variables={template.variables} />
          </div>
        </div>
      )}

      {/* Available Variables Reference */}
      <div className="bg-[#EAE0D5]/30 rounded-xl p-5 border border-[#F0EAE0]">
        <div className="flex items-center gap-2 mb-3">
          <Code className="w-3.5 h-3.5 text-[#434E54]/40" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#434E54]/40">
            Available Variables
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {template.variables.map((variable) => (
            <div key={variable.name} className="flex items-start gap-2">
              <code className="text-sm font-mono bg-[#EAE0D5] text-[#434E54] px-2 py-0.5
                             rounded flex-shrink-0">
                {`{{${variable.name}}}`}
              </code>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#6B7280]">{variable.description}</p>
                {variable.required && (
                  <span className="text-xs text-[#D4A574] font-medium">Required</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Change Reason & Save */}
      {hasChanges && (
        <div className="bg-[#FDF6EE] border border-[#F0EAE0] rounded-xl p-4">
          <label className="block text-sm font-medium text-[#434E54] mb-2">
            Change Reason
            <span className="text-[#D4A574] ml-1">*</span>
          </label>
          <input
            type="text"
            value={changeReason}
            onChange={(e) => setChangeReason(e.target.value)}
            placeholder="Briefly describe what you changed and why..."
            className="w-full py-2.5 px-4 rounded-lg border border-[#434E54]/20 bg-white
                     focus:outline-none focus:ring-2 focus:ring-[#434E54]/30
                     focus:border-[#434E54] placeholder:text-gray-400 mb-3"
          />
          <button
            onClick={handleSave}
            disabled={saving || !changeReason.trim()}
            className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none
                     disabled:bg-gray-300 disabled:text-gray-500 gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      )}

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="text-sm text-[#D4A574] flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-[#D4A574] rounded-full" />
          You have unsaved changes
        </div>
      )}
    </div>
  );
}
