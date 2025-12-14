'use client';

import { FileText, Sparkles } from 'lucide-react';
import { CAMPAIGN_TEMPLATES } from '@/lib/campaign-templates';
import type { CampaignTemplatePreset } from '@/lib/campaign-templates';

interface TemplateSelectorProps {
  onSelectTemplate: (template: CampaignTemplatePreset) => void;
  onStartFromScratch: () => void;
}

/**
 * TemplateSelector - Choose from pre-made campaign templates or start from scratch
 */
export function TemplateSelector({ onSelectTemplate, onStartFromScratch }: TemplateSelectorProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h4 className="text-xl font-semibold text-[#434E54] mb-2">
          Choose a Campaign Template
        </h4>
        <p className="text-[#6B7280]">
          Start with a pre-built template or create your own from scratch
        </p>
      </div>

      {/* Start from Scratch Card */}
      <button
        onClick={onStartFromScratch}
        className="card bg-gradient-to-br from-[#434E54] to-[#363F44] text-white shadow-lg hover:shadow-xl transition-all w-full"
      >
        <div className="card-body items-center text-center">
          <Sparkles className="w-12 h-12 mb-2" />
          <h3 className="card-title text-white">Start from Scratch</h3>
          <p className="opacity-90">Build your custom campaign from the ground up</p>
        </div>
      </button>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CAMPAIGN_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className="card bg-white border-2 border-gray-200 hover:border-[#434E54] shadow-sm hover:shadow-md transition-all text-left"
          >
            <div className="card-body">
              {/* Category Badge */}
              <div className="flex items-start justify-between mb-2">
                <span className="badge badge-primary badge-sm capitalize">
                  {template.category}
                </span>
                <FileText className="w-5 h-5 text-[#6B7280]" />
              </div>

              {/* Template Name */}
              <h4 className="font-semibold text-[#434E54] mb-1">{template.name}</h4>

              {/* Template Description */}
              <p className="text-sm text-[#6B7280] line-clamp-2">{template.description}</p>

              {/* Channel Badge */}
              <div className="flex gap-2 mt-3">
                {template.channel === 'email' && (
                  <span className="badge badge-ghost badge-sm">Email</span>
                )}
                {template.channel === 'sms' && (
                  <span className="badge badge-ghost badge-sm">SMS</span>
                )}
                {template.channel === 'both' && (
                  <>
                    <span className="badge badge-ghost badge-sm">Email</span>
                    <span className="badge badge-ghost badge-sm">SMS</span>
                  </>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
