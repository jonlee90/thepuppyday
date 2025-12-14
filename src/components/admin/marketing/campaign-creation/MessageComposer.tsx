'use client';

import { useState } from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import { SMSEditor } from './SMSEditor';
import { EmailEditor } from './EmailEditor';
import { ABTestToggle } from './ABTestToggle';
import type { CampaignChannel, MessageContent, ABTestConfig } from '@/types/marketing';

interface MessageComposerProps {
  channel: CampaignChannel;
  onChannelChange: (channel: CampaignChannel) => void;
  messageContent: MessageContent;
  onMessageChange: (content: MessageContent) => void;
  abTestConfig: ABTestConfig | null;
  onAbTestChange: (config: ABTestConfig | null) => void;
}

/**
 * MessageComposer - Compose campaign messages for email and/or SMS
 */
export function MessageComposer({
  channel,
  onChannelChange,
  messageContent,
  onMessageChange,
  abTestConfig,
  onAbTestChange,
}: MessageComposerProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'sms'>('email');

  // Auto-switch tab when channel changes
  const handleChannelChange = (newChannel: CampaignChannel) => {
    onChannelChange(newChannel);

    // Switch to appropriate tab
    if (newChannel === 'sms') {
      setActiveTab('sms');
    } else if (newChannel === 'email') {
      setActiveTab('email');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h4 className="text-xl font-semibold text-[#434E54] mb-2">Compose Your Message</h4>
        <p className="text-[#6B7280]">
          Create your campaign message for selected communication channels
        </p>
      </div>

      {/* Channel Selection */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Communication Channel *</span>
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => handleChannelChange('email')}
            className={`btn flex-1 ${
              channel === 'email' ? 'btn-primary' : 'btn-outline'
            }`}
          >
            <Mail className="w-5 h-5" />
            Email Only
          </button>
          <button
            onClick={() => handleChannelChange('sms')}
            className={`btn flex-1 ${
              channel === 'sms' ? 'btn-primary' : 'btn-outline'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            SMS Only
          </button>
          <button
            onClick={() => handleChannelChange('both')}
            className={`btn flex-1 ${
              channel === 'both' ? 'btn-primary' : 'btn-outline'
            }`}
          >
            <Mail className="w-4 h-4" />
            <MessageSquare className="w-4 h-4" />
            Both
          </button>
        </div>
      </div>

      {/* Message Editors */}
      {channel === 'both' && (
        <div className="tabs tabs-boxed bg-gray-100">
          <button
            className={`tab ${activeTab === 'email' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            <Mail className="w-4 h-4 mr-2" />
            Email
          </button>
          <button
            className={`tab ${activeTab === 'sms' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('sms')}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            SMS
          </button>
        </div>
      )}

      {/* Email Editor */}
      {(channel === 'email' || (channel === 'both' && activeTab === 'email')) && (
        <EmailEditor
          subject={messageContent.email_subject || ''}
          body={messageContent.email_body || ''}
          onSubjectChange={(subject) =>
            onMessageChange({ ...messageContent, email_subject: subject })
          }
          onBodyChange={(body) =>
            onMessageChange({ ...messageContent, email_body: body })
          }
        />
      )}

      {/* SMS Editor */}
      {(channel === 'sms' || (channel === 'both' && activeTab === 'sms')) && (
        <SMSEditor
          body={messageContent.sms_body || ''}
          onBodyChange={(body) =>
            onMessageChange({ ...messageContent, sms_body: body })
          }
        />
      )}

      {/* A/B Testing Toggle */}
      <div className="divider">Advanced Options</div>
      <ABTestToggle
        channel={channel}
        config={abTestConfig}
        onChange={onAbTestChange}
      />
    </div>
  );
}
