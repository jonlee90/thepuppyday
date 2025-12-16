'use client';

import { useState } from 'react';
import { TemplateVariable, TemplateTestResponse } from '@/types/template';
import { Send, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TestNotificationModalProps {
  templateId: string;
  channel: 'email' | 'sms';
  variables: TemplateVariable[];
  isOpen: boolean;
  onClose: () => void;
}

export function TestNotificationModal({
  templateId,
  channel,
  variables,
  isOpen,
  onClose,
}: TestNotificationModalProps) {
  const router = useRouter();
  const [recipient, setRecipient] = useState('');
  const [sampleData, setSampleData] = useState<Record<string, string>>(() => {
    const data: Record<string, string> = {};
    variables.forEach((v) => {
      data[v.name] = v.example_value || '';
    });
    return data;
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TemplateTestResponse | null>(null);

  const handleSampleDataChange = (variableName: string, value: string) => {
    setSampleData((prev) => ({
      ...prev,
      [variableName]: value,
    }));
  };

  const handleSend = async () => {
    if (!recipient) {
      alert(`Please enter a ${channel === 'email' ? 'email address' : 'phone number'}`);
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch(`/api/admin/notifications/templates/${templateId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          sample_data: sampleData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test notification');
      }

      setResult(data);
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewInLogs = () => {
    router.push('/admin/notifications/logs');
    onClose();
  };

  const handleReset = () => {
    setRecipient('');
    setSampleData(() => {
      const data: Record<string, string> = {};
      variables.forEach((v) => {
        data[v.name] = v.example_value || '';
      });
      return data;
    });
    setResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh]
                     overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#EAE0D5] rounded-lg">
                <Send className="w-5 h-5 text-[#434E54]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#434E54]">Send Test Notification</h3>
                <p className="text-sm text-[#6B7280]">
                  Test your template with sample data
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn btn-sm btn-ghost text-[#6B7280] hover:text-[#434E54]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success/Error Result */}
          {result && (
            <div
              className={`rounded-lg p-4 ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4
                    className={`font-semibold mb-1 ${
                      result.success ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {result.success ? 'Test sent successfully!' : 'Failed to send test'}
                  </h4>
                  {result.success ? (
                    <>
                      <p className="text-sm text-green-800 mb-2">
                        Your test notification has been sent to {recipient}
                      </p>
                      {result.message_id && (
                        <p className="text-xs text-green-700 font-mono bg-green-100 px-2 py-1
                                     rounded inline-block mb-2">
                          Message ID: {result.message_id}
                        </p>
                      )}
                      <button
                        onClick={handleViewInLogs}
                        className="text-sm text-green-700 hover:text-green-800 font-medium
                                 flex items-center gap-1 mt-2"
                      >
                        View in notification logs
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-red-800 mb-2">{result.error}</p>
                      <button
                        onClick={() => setResult(null)}
                        className="text-sm text-red-700 hover:text-red-800 font-medium"
                      >
                        Try again
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recipient Input */}
          <div>
            <label className="block text-sm font-medium text-[#434E54] mb-2">
              Recipient {channel === 'email' ? 'Email' : 'Phone Number'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type={channel === 'email' ? 'email' : 'tel'}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={
                channel === 'email' ? 'example@email.com' : '+1 (555) 123-4567'
              }
              className="w-full py-2.5 px-4 rounded-lg border border-gray-200 bg-white
                       focus:outline-none focus:ring-2 focus:ring-[#434E54]/20
                       focus:border-[#434E54] placeholder:text-gray-400"
            />
            <p className="text-xs text-[#6B7280] mt-1">
              {channel === 'email'
                ? 'Enter the email address to receive the test'
                : 'Enter the phone number to receive the test (include country code)'}
            </p>
          </div>

          {/* Sample Data Editor */}
          <div>
            <label className="block text-sm font-medium text-[#434E54] mb-3">
              Sample Data
            </label>
            <div className="space-y-4 bg-[#F8EEE5] rounded-lg p-4">
              {variables.length === 0 ? (
                <p className="text-sm text-[#6B7280] text-center py-4">
                  No variables in this template
                </p>
              ) : (
                variables.map((variable) => (
                  <div key={variable.name}>
                    <label className="block text-sm font-medium text-[#434E54] mb-1">
                      {variable.name}
                      {variable.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
                      value={sampleData[variable.name] || ''}
                      onChange={(e) => handleSampleDataChange(variable.name, e.target.value)}
                      placeholder={variable.example_value}
                      className="w-full py-2 px-3 rounded-lg border border-gray-200 bg-white
                               focus:outline-none focus:ring-2 focus:ring-[#434E54]/20
                               focus:border-[#434E54] text-sm"
                    />
                    <p className="text-xs text-[#6B7280] mt-1">{variable.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4
                       rounded-b-xl flex gap-3">
          <button
            onClick={handleReset}
            className="btn bg-transparent text-[#434E54] border border-gray-200
                     hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="btn bg-transparent text-[#434E54] border border-gray-200
                     hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !recipient}
            className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none
                     flex-1 disabled:bg-gray-300 disabled:text-gray-500"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Test
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
