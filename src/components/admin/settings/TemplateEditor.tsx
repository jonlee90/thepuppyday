/**
 * Template Editor Component
 * Task 0069: Edit and preview notification templates
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  MessageSquare,
  Save,
  AlertCircle,
  Eye,
  RotateCcw,
  Copy,
  FileText,
} from 'lucide-react';
import type {
  NotificationTemplate,
  NotificationTemplateType,
  NotificationTemplates,
} from '@/types/settings';
import { DEFAULT_NOTIFICATION_TEMPLATES } from '@/types/settings';

export function TemplateEditor() {
  const [templates, setTemplates] = useState<NotificationTemplates | null>(null);
  const [selectedType, setSelectedType] =
    useState<NotificationTemplateType>('report_card');
  const [currentTemplate, setCurrentTemplate] = useState<NotificationTemplate | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Sample preview data
  const previewData = {
    customer_name: 'Sarah Johnson',
    pet_name: 'Max',
    breed_name: 'Golden Retriever',
    date: new Date().toLocaleDateString(),
    time: '10:00 AM',
    service_name: 'Premium Grooming',
    total: '$95.00',
    groomer_name: 'Jessica',
    report_card_url: 'https://puppyday.com/report/abc123',
    review_url: 'https://g.page/puppyday/review',
    booking_url: 'https://puppyday.com/book',
    discount: '10',
    expiry_hours: '2',
    weeks_since: '8',
    recommended_frequency: '6-8',
    last_appointment_date: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    addons: 'Teeth Brushing, Pawdicure',
    special_requests: 'Please be gentle with ears',
  };

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/settings/templates');
        if (!response.ok) throw new Error('Failed to fetch templates');

        const result = await response.json();
        setTemplates(result.data);
        setCurrentTemplate(result.data[selectedType]);
      } catch (error) {
        console.error('Error fetching templates:', error);
        setSaveMessage({
          type: 'error',
          text: 'Failed to load templates',
        });
        // Use defaults on error
        setTemplates(DEFAULT_NOTIFICATION_TEMPLATES);
        setCurrentTemplate(DEFAULT_NOTIFICATION_TEMPLATES[selectedType]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Update current template when selection changes
  useEffect(() => {
    if (templates) {
      setCurrentTemplate(templates[selectedType]);
    }
  }, [selectedType, templates]);

  const handleTemplateChange = (field: keyof NotificationTemplate, value: string) => {
    if (!currentTemplate) return;

    const updated = {
      ...currentTemplate,
      [field]: value,
    };

    setCurrentTemplate(updated);

    // Update templates state
    if (templates) {
      setTemplates({
        ...templates,
        [selectedType]: updated,
      });
    }
  };

  const insertVariable = (variable: string, field: 'sms_content' | 'email_body') => {
    if (!currentTemplate) return;

    const currentValue = currentTemplate[field];
    const updated = currentValue + variable;

    handleTemplateChange(field, updated);
  };

  const handleSave = async () => {
    if (!templates) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/admin/settings/templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templates }),
      });

      if (!response.ok) {
        throw new Error('Failed to save templates');
      }

      setSaveMessage({
        type: 'success',
        text: 'Templates saved successfully!',
      });

      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving templates:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to save templates. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/admin/settings/templates/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ types: [selectedType] }),
      });

      if (!response.ok) {
        throw new Error('Failed to reset template');
      }

      const result = await response.json();
      setTemplates(result.data);
      setCurrentTemplate(result.data[selectedType]);

      setSaveMessage({
        type: 'success',
        text: 'Template reset to default!',
      });

      setShowResetConfirm(false);

      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error resetting template:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to reset template. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const replaceVariables = (text: string): string => {
    let result = text;
    Object.entries(previewData).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    return result;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-100 rounded"></div>
            <div className="h-32 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentTemplate) return null;

  const smsCharCount = currentTemplate.sms_content.length;
  const smsSegments = Math.ceil(smsCharCount / 160);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#434E54]/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#EAE0D5] flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#434E54]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#434E54]">Notification Templates</h2>
            <p className="text-sm text-[#6B7280]">
              Customize SMS and email templates for automated notifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`btn btn-sm ${
              showPreview
                ? 'bg-[#434E54] text-white'
                : 'bg-white border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5]'
            }`}
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
        </div>
      </div>

      {/* Template Type Selector */}
      <div className="mb-6">
        <label className="text-sm font-medium text-[#434E54] mb-2 block">
          Template Type
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as NotificationTemplateType)}
          className="select select-bordered w-full bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none"
        >
          <option value="report_card">Report Card Notification</option>
          <option value="waitlist_offer">Waitlist Offer</option>
          <option value="breed_reminder">Breed-Based Grooming Reminder</option>
          <option value="appointment_confirmation">Appointment Confirmation</option>
          <option value="appointment_reminder">Appointment Reminder</option>
        </select>
        <p className="text-xs text-[#6B7280] mt-2">{currentTemplate.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Column */}
        <div className="space-y-6">
          {/* SMS Content */}
          <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]">
            <label className="flex items-center justify-between text-sm font-medium text-[#434E54] mb-3">
              <span className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                SMS Content
              </span>
              <span
                className={`text-xs ${
                  smsCharCount > 160 ? 'text-orange-600' : 'text-[#6B7280]'
                }`}
              >
                {smsCharCount} chars ({smsSegments} segment{smsSegments > 1 ? 's' : ''})
              </span>
            </label>
            <textarea
              value={currentTemplate.sms_content}
              onChange={(e) => handleTemplateChange('sms_content', e.target.value)}
              className="textarea textarea-bordered w-full bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none font-mono text-sm"
              rows={4}
              placeholder="Enter SMS message..."
            />
            {smsCharCount > 160 && (
              <p className="text-xs text-orange-600 mt-2">
                Messages over 160 characters are sent as multiple segments
              </p>
            )}
          </div>

          {/* Email Subject */}
          <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]">
            <label className="flex items-center gap-2 text-sm font-medium text-[#434E54] mb-3">
              <Mail className="w-4 h-4" />
              Email Subject
            </label>
            <input
              type="text"
              value={currentTemplate.email_subject}
              onChange={(e) => handleTemplateChange('email_subject', e.target.value)}
              className="input input-bordered w-full bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none"
              placeholder="Enter email subject..."
            />
          </div>

          {/* Email Body */}
          <div className="p-4 rounded-lg border border-[#434E54]/10 bg-[#FFFBF7]">
            <label className="flex items-center gap-2 text-sm font-medium text-[#434E54] mb-3">
              <Mail className="w-4 h-4" />
              Email Body
            </label>
            <textarea
              value={currentTemplate.email_body}
              onChange={(e) => handleTemplateChange('email_body', e.target.value)}
              className="textarea textarea-bordered w-full bg-white border-[#434E54]/20 focus:border-[#434E54] focus:outline-none font-mono text-sm"
              rows={12}
              placeholder="Enter email body..."
            />
          </div>

          {/* Available Variables */}
          <div className="p-4 rounded-lg border border-[#434E54]/10 bg-blue-50">
            <label className="text-sm font-medium text-[#434E54] mb-3 block">
              Available Variables
            </label>
            <div className="flex flex-wrap gap-2">
              {currentTemplate.available_variables.map((variable) => (
                <button
                  key={variable}
                  onClick={() => {
                    navigator.clipboard.writeText(variable);
                    setSaveMessage({
                      type: 'success',
                      text: `Copied ${variable}`,
                    });
                    setTimeout(() => setSaveMessage(null), 2000);
                  }}
                  className="btn btn-xs bg-white border-blue-300 text-blue-700 hover:bg-blue-100"
                  title="Click to copy"
                >
                  <Copy className="w-3 h-3" />
                  {variable}
                </button>
              ))}
            </div>
            <p className="text-xs text-blue-700 mt-3">
              Click any variable to copy it, then paste into your template
            </p>
          </div>
        </div>

        {/* Preview Column */}
        {showPreview && (
          <div className="space-y-6">
            {/* SMS Preview */}
            <div className="p-4 rounded-lg border border-[#434E54]/10 bg-gray-50">
              <h4 className="text-sm font-medium text-[#434E54] mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                SMS Preview
              </h4>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {replaceVariables(currentTemplate.sms_content)}
                </p>
              </div>
            </div>

            {/* Email Preview */}
            <div className="p-4 rounded-lg border border-[#434E54]/10 bg-gray-50">
              <h4 className="text-sm font-medium text-[#434E54] mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Preview
              </h4>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-800">
                    Subject: {replaceVariables(currentTemplate.email_subject)}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {replaceVariables(currentTemplate.email_body)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn bg-[#434E54] hover:bg-[#363F44] text-white border-none"
          >
            {isSaving ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Template
              </>
            )}
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={isSaving}
            className="btn bg-white border-[#434E54]/20 text-[#434E54] hover:bg-red-50 hover:border-red-300 hover:text-red-600"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </button>

          {/* Save Message */}
          {saveMessage && (
            <div
              className={`flex items-center gap-2 ${
                saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{saveMessage.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[#434E54] mb-3">
              Reset Template to Default?
            </h3>
            <p className="text-sm text-[#6B7280] mb-6">
              This will restore the {currentTemplate.name.toLowerCase()} to its original
              default content. Any custom changes will be lost.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="btn bg-white border-[#434E54]/20 text-[#434E54] hover:bg-[#EAE0D5]"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="btn bg-red-600 hover:bg-red-700 text-white border-none"
              >
                {isSaving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Resetting...
                  </>
                ) : (
                  'Reset Template'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
