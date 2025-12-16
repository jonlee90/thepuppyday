'use client';

import { Mail, MessageSquare } from 'lucide-react';
import type { NotificationsByChannel } from '@/types/notifications-dashboard';

interface ChannelBreakdownProps {
  data: NotificationsByChannel;
}

export function ChannelBreakdown({ data }: ChannelBreakdownProps) {
  const channels = [
    {
      name: 'Email',
      icon: Mail,
      stats: data.email,
      color: '#434E54',
      bgColor: '#EAE0D5',
    },
    {
      name: 'SMS',
      icon: MessageSquare,
      stats: data.sms,
      color: '#5A6670',
      bgColor: '#D1D5DB',
    },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#434E54]">Channel Breakdown</h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Performance by delivery channel
        </p>
      </div>

      <div className="space-y-4">
        {channels.map((channel) => {
          const Icon = channel.icon;
          const deliveryRateIsLow = channel.stats.delivery_rate < 90;

          return (
            <div
              key={channel.name}
              className="p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2.5 rounded-lg"
                    style={{ backgroundColor: channel.bgColor }}
                  >
                    <Icon className="w-5 h-5" style={{ color: channel.color }} />
                  </div>
                  <h3 className="text-lg font-semibold text-[#434E54]">{channel.name}</h3>
                </div>
                <div className="text-right">
                  <p
                    className={`text-2xl font-bold ${
                      deliveryRateIsLow ? 'text-orange-600' : 'text-[#434E54]'
                    }`}
                  >
                    {channel.stats.delivery_rate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-[#9CA3AF]">Delivery Rate</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-[#6B7280] mb-1">Sent</p>
                  <p className="text-lg font-semibold text-[#434E54]">
                    {channel.stats.sent.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#6B7280] mb-1">Delivered</p>
                  <p className="text-lg font-semibold text-green-600">
                    {channel.stats.delivered.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#6B7280] mb-1">Failed</p>
                  <p className="text-lg font-semibold text-red-600">
                    {channel.stats.failed.toLocaleString()}
                  </p>
                </div>
              </div>

              {deliveryRateIsLow && (
                <div className="mt-3 p-2 bg-orange-50 rounded-lg">
                  <p className="text-xs text-orange-700">
                    Delivery rate below 90% - investigate failures
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
