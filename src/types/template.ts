/**
 * Template Management Types
 * Shared types for notification template UI
 */

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  trigger_event: string;
  channel: 'email' | 'sms';
  subject?: string;
  html_template?: string;
  text_template?: string;
  sms_template?: string;
  variables: TemplateVariable[];
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
  example_value?: string;
  max_length?: number;
}

export interface TemplateVersion {
  id: string;
  template_id: string;
  version: number;
  subject?: string;
  html_template?: string;
  text_template?: string;
  sms_template?: string;
  changed_by: string;
  changed_at: string;
  change_reason: string;
  changes_made: Record<string, any>;
}

export interface TemplatePreview {
  channel: 'email' | 'sms';
  subject?: string;
  html_content?: string;
  text_content?: string;
  sms_content?: string;
  metadata: {
    character_count?: number;
    sms_segments?: number;
    variables_used: string[];
  };
}

export interface TemplateTestRequest {
  recipient: string;
  sample_data: Record<string, string>;
}

export interface TemplateTestResponse {
  success: boolean;
  message_id?: string;
  error?: string;
}

export interface TemplateUpdateRequest {
  subject?: string;
  html_template?: string;
  text_template?: string;
  sms_template?: string;
  is_active?: boolean;
  change_reason: string;
}

export interface SmsSegmentInfo {
  characterCount: number;
  segmentCount: number;
  status: 'ok' | 'warning' | 'error';
  message: string;
}
