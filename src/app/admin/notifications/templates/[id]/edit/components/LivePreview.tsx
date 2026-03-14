'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { TemplateVariable } from '@/types/template';
import { Eye, Edit2 } from 'lucide-react';

interface LivePreviewProps {
  channel: 'email' | 'sms';
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  smsContent?: string;
  variables: TemplateVariable[];
}

export function LivePreview({
  channel,
  subject,
  htmlContent,
  textContent,
  smsContent,
  variables,
}: LivePreviewProps) {
  // Initialize sample data from example values
  const [sampleData, setSampleData] = useState<Record<string, string>>(() => {
    const data: Record<string, string> = {};
    variables.forEach((v) => {
      data[v.name] = v.example_value || '';
    });
    return data;
  });

  const [editMode, setEditMode] = useState(false);
  const [emailShell, setEmailShell] = useState<string | null>(null);

  // Fetch the base email shell once for wrapping HTML previews
  useEffect(() => {
    fetch('/api/admin/notifications/templates/email-shell')
      .then((r) => (r.ok ? r.text() : null))
      .then((html) => { if (html) setEmailShell(html); })
      .catch(() => {});
  }, []);

  // Replace variables in content
  const renderContent = useCallback((content: string) => {
    let rendered = content;
    Object.entries(sampleData).forEach(([key, value]) => {
      const pattern = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(pattern, value || `[${key}]`);
    });
    return rendered;
  }, [sampleData]);

  const renderedSubject = useMemo(
    () => (subject ? renderContent(subject) : ''),
    [subject, renderContent]
  );

  const renderedHtml = useMemo(() => {
    if (!htmlContent) return '';
    const content = renderContent(htmlContent);
    if (!emailShell) return content;
    return emailShell
      .replace('{{BASE_URL}}', window.location.origin)
      .replace('{{MOOD_BANNER}}', '')
      .replace('{{CONTENT}}', content)
      .replace('{{UNSUBSCRIBE_LINK}}', '#');
  }, [htmlContent, renderContent, emailShell]);

  const renderedText = useMemo(
    () => (textContent ? renderContent(textContent) : ''),
    [textContent, renderContent]
  );

  const renderedSms = useMemo(
    () => (smsContent ? renderContent(smsContent) : ''),
    [smsContent, renderContent]
  );

  const handleSampleDataChange = (variableName: string, value: string) => {
    setSampleData((prev) => ({
      ...prev,
      [variableName]: value,
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      {/* Accent Strip */}
      <div className={`h-1.5 bg-gradient-to-r ${
        channel === 'email'
          ? 'from-[#434E54] to-[#5A6870]'
          : 'from-[#D4A574] to-[#E8C5A0]'
      }`} />

      {/* Header */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#434E54]" />
            <h3 className="text-lg font-semibold text-[#434E54]">Live Preview</h3>
          </div>
          <button
            type="button"
            onClick={() => setEditMode(!editMode)}
            className="btn btn-sm bg-[#EAE0D5]/50 text-[#434E54] border border-[#F0EAE0]
                       hover:bg-[#EAE0D5] gap-2"
          >
            <Edit2 className="w-4 h-4" />
            {editMode ? 'View Preview' : 'Edit Sample Data'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        {/* Sample Data Editor */}
        {editMode ? (
          <div className="space-y-4">
            <p className="text-sm text-[#6B7280] mb-4">
              Edit sample values to preview how variables will appear:
            </p>
            {variables.map((variable) => (
              <div key={variable.name}>
                <label className="block text-sm font-medium text-[#434E54] mb-1">
                  {variable.name}
                  {variable.required && <span className="text-[#D4A574] ml-1">*</span>}
                </label>
                <input
                  type="text"
                  value={sampleData[variable.name] || ''}
                  onChange={(e) => handleSampleDataChange(variable.name, e.target.value)}
                  placeholder={variable.example_value}
                  className="w-full py-2 px-3 rounded-lg border border-[#434E54]/20 bg-white
                           focus:outline-none focus:ring-2 focus:ring-[#434E54]/30
                           focus:border-[#434E54] text-sm"
                />
                <p className="text-xs text-[#6B7280] mt-1">{variable.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Email Preview */}
            {channel === 'email' && (
              <div className="space-y-6">
                {/* Subject Line */}
                {subject && (
                  <div>
                    <label className="block text-sm font-medium text-[#434E54] mb-2">
                      Subject Line
                    </label>
                    <div className="bg-[#EAE0D5]/30 rounded-xl p-3 border border-[#F0EAE0]">
                      <p className="text-sm text-[#434E54]">{renderedSubject}</p>
                    </div>
                  </div>
                )}

                {/* HTML Preview */}
                {htmlContent && (
                  <div>
                    <label className="block text-sm font-medium text-[#434E54] mb-2">
                      HTML Email
                    </label>
                    <div className="border border-[#F0EAE0] rounded-xl overflow-hidden">
                      <iframe
                        srcDoc={renderedHtml}
                        className="w-full h-96 bg-white"
                        sandbox="allow-same-origin"
                        title="Email Preview"
                      />
                    </div>
                  </div>
                )}

                {/* Plain Text Preview */}
                {textContent && (
                  <div>
                    <label className="block text-sm font-medium text-[#434E54] mb-2">
                      Plain Text Version
                    </label>
                    <div className="bg-[#EAE0D5]/30 rounded-xl p-4 border border-[#F0EAE0]">
                      <pre className="text-sm text-[#434E54] whitespace-pre-wrap font-mono">
                        {renderedText}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SMS Preview */}
            {channel === 'sms' && (
              <div>
                <label className="block text-sm font-medium text-[#434E54] mb-2">
                  SMS Message
                </label>
                <div className="bg-[#EAE0D5]/20 rounded-2xl p-6 border border-[#F0EAE0]">
                  {/* Phone mockup */}
                  <div className="max-w-sm mx-auto bg-white rounded-[2rem] shadow-lg p-5 border border-[#F0EAE0]">
                    {/* Notch */}
                    <div className="w-24 h-1.5 bg-[#EAE0D5] rounded-full mx-auto mb-4" />
                    <div className="bg-[#434E54] text-white rounded-2xl rounded-bl-sm p-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderedSms}</p>
                    </div>
                    <p className="text-xs text-[#9CA3AF] mt-2">
                      {new Date().toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#6B7280] mt-2 text-center">
                  Preview shows how message will appear on customer&apos;s device
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
