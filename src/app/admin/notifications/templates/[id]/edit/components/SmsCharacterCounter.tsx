'use client';

import { useMemo } from 'react';
import { TemplateVariable, SmsSegmentInfo } from '@/types/template';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface SmsCharacterCounterProps {
  content: string;
  variables: TemplateVariable[];
}

/**
 * Calculate SMS character count and segment information
 * Uses maximum variable lengths to provide conservative estimates
 */
export function SmsCharacterCounter({ content, variables }: SmsCharacterCounterProps) {
  const segmentInfo = useMemo<SmsSegmentInfo>(() => {
    // Replace variables with their max lengths for conservative count
    let expandedContent = content;

    variables.forEach((variable) => {
      const variablePattern = new RegExp(`{{${variable.name}}}`, 'g');
      const maxLength = variable.max_length || variable.example_value?.length || 50;
      expandedContent = expandedContent.replace(
        variablePattern,
        'x'.repeat(maxLength)
      );
    });

    const characterCount = expandedContent.length;

    // SMS segment calculation
    // Standard SMS: 160 characters per segment
    // With special characters (unicode): 70 characters per segment
    // For simplicity, using 160 as baseline
    const segmentCount = characterCount === 0 ? 0 : Math.ceil(characterCount / 160);

    let status: SmsSegmentInfo['status'];
    let message: string;

    if (characterCount === 0) {
      status = 'ok';
      message = 'Enter your message';
    } else if (characterCount <= 160) {
      status = 'ok';
      message = 'Perfect! Fits in 1 message';
    } else if (characterCount <= 320) {
      status = 'warning';
      message = 'Will be sent as 2 messages';
    } else {
      status = 'error';
      message = `Will be sent as ${segmentCount} messages - consider shortening`;
    }

    return {
      characterCount,
      segmentCount,
      status,
      message,
    };
  }, [content, variables]);

  const getStatusIcon = () => {
    switch (segmentInfo.status) {
      case 'ok':
        return <CheckCircle className="w-5 h-5 text-[#6BCB77]" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[#FFB347]" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-[#EF4444]" />;
    }
  };

  const getStatusColor = () => {
    switch (segmentInfo.status) {
      case 'ok':
        return 'text-[#6BCB77]';
      case 'warning':
        return 'text-[#FFB347]';
      case 'error':
        return 'text-[#EF4444]';
    }
  };

  const getProgressColor = () => {
    switch (segmentInfo.status) {
      case 'ok':
        return 'bg-[#6BCB77]';
      case 'warning':
        return 'bg-[#FFB347]';
      case 'error':
        return 'bg-[#EF4444]';
    }
  };

  const progressPercentage = Math.min((segmentInfo.characterCount / 160) * 100, 100);

  return (
    <div className="bg-[#FFFBF7] rounded-lg p-4 border border-gray-200">
      {/* Character Count Display */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`font-semibold ${getStatusColor()}`}>
            {segmentInfo.characterCount} characters
          </span>
        </div>
        <span className="text-sm text-[#6B7280]">
          {segmentInfo.segmentCount} {segmentInfo.segmentCount === 1 ? 'segment' : 'segments'}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-2 bg-gray-200 rounded-full mb-3 overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full ${getProgressColor()} transition-all duration-300`}
          style={{ width: `${progressPercentage}%` }}
        />
        {/* 160 character marker */}
        <div className="absolute top-0 right-0 w-0.5 h-full bg-[#434E54]" />
      </div>

      {/* Status Message */}
      <p className={`text-sm ${getStatusColor()} font-medium`}>
        {segmentInfo.message}
      </p>

      {/* Helper Text */}
      <p className="text-xs text-[#9CA3AF] mt-2">
        Character count includes maximum variable lengths. Recommended: Keep under 160 characters.
      </p>

      {/* Segment Breakdown */}
      {segmentInfo.segmentCount > 1 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-[#6B7280]">
            <strong>Cost Impact:</strong> This message will be billed as {segmentInfo.segmentCount}{' '}
            separate SMS messages.
          </p>
        </div>
      )}
    </div>
  );
}
