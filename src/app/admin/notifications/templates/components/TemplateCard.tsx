'use client';

import { memo } from 'react';
import { NotificationTemplate } from '@/types/template';
import { Mail, MessageSquare, Pencil, Power, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface TemplateCardProps {
  template: NotificationTemplate;
  channelEnabled: boolean;
  index: number;
  onToggleActive: (templateId: string, currentStatus: boolean) => void;
}

export const TemplateCard = memo(function TemplateCard({
  template,
  channelEnabled,
  index,
  onToggleActive,
}: TemplateCardProps) {
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

  const isEmail = template.channel === 'email';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="group relative rounded-2xl bg-white shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={handleEdit}
    >
      {/* Channel accent strip */}
      <div
        className={`h-1.5 w-full ${
          isEmail
            ? 'bg-gradient-to-r from-[#434E54] to-[#5A6970]'
            : 'bg-gradient-to-r from-[#D4A574] to-[#E8C49A]'
        }`}
      />

      {/* Live status dot */}
      <div className="absolute top-4 right-4">
        {template.is_active ? (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        ) : (
          <span className="inline-flex rounded-full h-2.5 w-2.5 bg-gray-300 opacity-40" />
        )}
      </div>

      <div className="p-5">
        {/* Header: Icon + Name */}
        <div className="flex items-start gap-3 mb-3">
          <div className="shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EAE0D5] to-[#D4C4B4] shadow-inner flex items-center justify-center">
              {isEmail ? (
                <Mail className="w-[18px] h-[18px] text-[#434E54]" />
              ) : (
                <MessageSquare className="w-[18px] h-[18px] text-[#434E54]" />
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="font-semibold text-[#434E54] truncate leading-tight">
              {template.name}
            </h3>
            <p className="text-xs text-[#8B7355] mt-0.5 truncate">
              {template.trigger_event}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-[#8B7355] mb-3 leading-relaxed line-clamp-2">
          {template.description}
        </p>

        {/* Channel disabled warning */}
        {template.is_active && !channelEnabled && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200/50 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-xs text-amber-700">
              {template.channel.toUpperCase()} channel disabled in settings
            </span>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center border-t border-[#F0EAE0] pt-4 mt-1">
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-1">
              {isEmail ? (
                <Mail className="w-3 h-3 text-[#434E54]" />
              ) : (
                <MessageSquare className="w-3 h-3 text-[#D4A574]" />
              )}
              <span className="text-sm font-bold text-[#434E54]">
                {template.channel.toUpperCase()}
              </span>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-[#9CA3AF] mt-0.5">
              Channel
            </div>
          </div>
          <div className="w-px h-8 bg-[#F0EAE0]" />
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-[#434E54]">
              {template.version}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-[#9CA3AF] mt-0.5">
              Version
            </div>
          </div>
          <div className="w-px h-8 bg-[#F0EAE0]" />
          <div className="flex-1 text-center">
            <div className="text-sm font-bold text-[#434E54]">
              {formatDate(template.updated_at)}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-[#9CA3AF] mt-0.5">
              Updated
            </div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="border-t border-[#F0EAE0]">
        <div className="flex">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-[#434E54] hover:bg-[#F8EEE5] transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <div className="w-px bg-[#F0EAE0]" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleActive(template.id, template.is_active);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              template.is_active
                ? 'text-amber-500 hover:bg-amber-50'
                : 'text-emerald-500 hover:bg-emerald-50'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {template.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    </motion.div>
  );
});
