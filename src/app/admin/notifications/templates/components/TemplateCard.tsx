'use client';

import { NotificationTemplate } from '@/types/template';
import { Mail, MessageSquare, Edit, Send, Power } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface TemplateCardProps {
  template: NotificationTemplate;
  onTest: (templateId: string) => void;
  onToggleActive: (templateId: string, currentStatus: boolean) => void;
}

export function TemplateCard({ template, onTest, onToggleActive }: TemplateCardProps) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/admin/notifications/templates/${template.id}/edit`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#EAE0D5] rounded-lg">
            {template.channel === 'email' ? (
              <Mail className="w-5 h-5 text-[#434E54]" />
            ) : (
              <MessageSquare className="w-5 h-5 text-[#434E54]" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#434E54]">{template.name}</h3>
            <p className="text-sm text-[#6B7280]">{template.trigger_event}</p>
          </div>
        </div>

        {/* Active Status Badge */}
        <div className={`badge ${template.is_active ? 'badge-success' : 'badge-ghost'} gap-2`}>
          {template.is_active ? 'Active' : 'Inactive'}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[#6B7280] mb-4 leading-relaxed line-clamp-2">
        {template.description}
      </p>

      {/* Metadata */}
      <div className="flex items-center gap-4 mb-5 text-sm text-[#6B7280]">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#EAE0D5] text-[#434E54] font-medium">
          {template.channel.toUpperCase()}
        </span>
        <span>v{template.version}</span>
        <span>Updated {formatDate(template.updated_at)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleEdit}
          className="flex-1 btn btn-sm bg-[#434E54] text-white hover:bg-[#363F44] border-none"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={() => onTest(template.id)}
          className="btn btn-sm bg-transparent text-[#434E54] border border-[#434E54] hover:bg-[#434E54] hover:text-white"
        >
          <Send className="w-4 h-4" />
          Test
        </button>
        <button
          onClick={() => onToggleActive(template.id, template.is_active)}
          className={`btn btn-sm ${
            template.is_active
              ? 'bg-transparent text-[#6B7280] border border-[#6B7280] hover:bg-[#6B7280] hover:text-white'
              : 'bg-[#6BCB77] text-white hover:bg-[#5AB966] border-none'
          }`}
          title={template.is_active ? 'Deactivate' : 'Activate'}
        >
          <Power className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
