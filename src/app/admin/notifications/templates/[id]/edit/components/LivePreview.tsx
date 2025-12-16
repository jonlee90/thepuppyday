'use client';

import { useState, useMemo } from 'react';
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

  // Replace variables in content
  const renderContent = (content: string) => {
    let rendered = content;
    Object.entries(sampleData).forEach(([key, value]) => {
      const pattern = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(pattern, value || `[${key}]`);
    });
    return rendered;
  };

  const renderedSubject = useMemo(
    () => (subject ? renderContent(subject) : ''),
    [subject, sampleData]
  );

  const renderedHtml = useMemo(
    () => (htmlContent ? renderContent(htmlContent) : ''),
    [htmlContent, sampleData]
  );

  const renderedText = useMemo(
    () => (textContent ? renderContent(textContent) : ''),
    [textContent, sampleData]
  );

  const renderedSms = useMemo(
    () => (smsContent ? renderContent(smsContent) : ''),
    [smsContent, sampleData]
  );

  const handleSampleDataChange = (variableName: string, value: string) => {
    setSampleData((prev) => ({
      ...prev,
      [variableName]: value,
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-[#434E54]" />
          <h3 className="text-lg font-semibold text-[#434E54]">Live Preview</h3>
        </div>
        <button
          type="button"
          onClick={() => setEditMode(!editMode)}
          className="btn btn-sm bg-transparent text-[#434E54] border border-[#434E54]
                     hover:bg-[#434E54] hover:text-white gap-2"
        >
          <Edit2 className="w-4 h-4" />
          {editMode ? 'View Preview' : 'Edit Sample Data'}
        </button>
      </div>

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
                  <div className="bg-[#F8EEE5] rounded-lg p-3 border border-gray-200">
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
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
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
                  <div className="bg-[#F8EEE5] rounded-lg p-4 border border-gray-200">
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
              <div className="bg-[#F8EEE5] rounded-lg p-4 border border-gray-200">
                {/* Phone mockup */}
                <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-lg p-4">
                  <div className="bg-[#434E54] text-white rounded-2xl rounded-bl-sm p-3">
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
  );
}
