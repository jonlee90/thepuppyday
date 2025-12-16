'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { NotificationTemplate } from '@/types/template';
import { TemplateEditor } from './components/TemplateEditor';
import { LivePreview } from './components/LivePreview';
import { TestNotificationModal } from './components/TestNotificationModal';
import { VersionHistorySidebar } from './components/VersionHistorySidebar';
import { ArrowLeft, Send, Loader2, AlertCircle } from 'lucide-react';

export default function TemplateEditPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<NotificationTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);

  // Preview content (updated as user types)
  const [previewContent, setPreviewContent] = useState({
    subject: '',
    html_template: '',
    text_template: '',
    sms_template: '',
  });

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/notifications/templates/${templateId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch template');
      }

      const data = await response.json();
      setTemplate(data.template);
      setPreviewContent({
        subject: data.template.subject || '',
        html_template: data.template.html_template || '',
        text_template: data.template.text_template || '',
        sms_template: data.template.sms_template || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updates: {
    subject?: string;
    html_template?: string;
    text_template?: string;
    sms_template?: string;
    change_reason: string;
  }) => {
    try {
      const response = await fetch(`/api/admin/notifications/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update template');
      }

      // Refresh template
      await fetchTemplate();

      // Show success message
      alert('Template updated successfully!');
    } catch (err) {
      throw err;
    }
  };

  const handleContentChange = (content: {
    subject?: string;
    html_template?: string;
    text_template?: string;
    sms_template?: string;
  }) => {
    setPreviewContent(content);
  };

  const handleRollback = () => {
    // Refresh template after rollback
    fetchTemplate();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8EEE5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#434E54] animate-spin" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-[#F8EEE5] flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#434E54] mb-2">Error Loading Template</h3>
          <p className="text-[#6B7280] mb-4">{error || 'Template not found'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/admin/notifications/templates')}
              className="btn bg-transparent text-[#434E54] border border-gray-200
                       hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Templates
            </button>
            <button
              onClick={fetchTemplate}
              className="btn bg-[#434E54] text-white hover:bg-[#363F44] border-none"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8EEE5]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/notifications/templates')}
                className="btn btn-sm bg-transparent text-[#434E54] border border-gray-200
                         hover:bg-gray-50 gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div>
                <h1 className="text-xl font-bold text-[#434E54]">{template.name}</h1>
                <p className="text-sm text-[#6B7280]">
                  {template.channel.toUpperCase()} • {template.trigger_event} • v
                  {template.version}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <VersionHistorySidebar
                templateId={templateId}
                currentVersion={template.version}
                onRollback={handleRollback}
              />
              <button
                onClick={() => setTestModalOpen(true)}
                className="btn btn-sm bg-[#434E54] text-white hover:bg-[#363F44] border-none
                         gap-2"
              >
                <Send className="w-4 h-4" />
                Send Test
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Editor (60% - 3 cols) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-[#434E54] mb-6">Template Editor</h2>
              <TemplateEditor
                template={template}
                onSave={handleSave}
                onContentChange={handleContentChange}
              />
            </div>
          </div>

          {/* Preview (40% - 2 cols) */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <LivePreview
                channel={template.channel}
                subject={previewContent.subject}
                htmlContent={previewContent.html_template}
                textContent={previewContent.text_template}
                smsContent={previewContent.sms_template}
                variables={template.variables}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Test Modal */}
      <TestNotificationModal
        templateId={templateId}
        channel={template.channel}
        variables={template.variables}
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
      />
    </div>
  );
}
