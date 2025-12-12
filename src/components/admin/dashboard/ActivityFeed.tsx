/**
 * Activity Feed Component
 * Displays recent notifications and activities
 */

'use client';

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import {
  Calendar,
  XCircle,
  AlertTriangle,
  UserPlus,
  DollarSign,
  Activity,
} from 'lucide-react';
import type { NotificationLog } from '@/types/database';

interface ActivityFeedProps {
  initialActivities: NotificationLog[];
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'appointment_created':
    case 'appointment_confirmed':
      return Calendar;
    case 'appointment_cancelled':
      return XCircle;
    case 'appointment_reminder':
      return AlertTriangle;
    case 'customer_registered':
      return UserPlus;
    case 'payment_received':
      return DollarSign;
    default:
      return Activity;
  }
}

function getActivityLink(activity: NotificationLog): string | null {
  // Link to customer profile if customer_id is available
  if (activity.customer_id) {
    return `/admin/customers/${activity.customer_id}`;
  }
  return null;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

  if (diffInMinutes < 5) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function ActivityItem({ activity }: { activity: NotificationLog }) {
  const Icon = getActivityIcon(activity.type);
  const link = getActivityLink(activity);
  const timestamp = formatTimestamp(activity.created_at);

  const content = (
    <div
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F8EEE5] transition-colors"
      style={{
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      <div className="w-10 h-10 bg-[#EAE0D5] rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-[#434E54]" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#434E54] leading-relaxed">
          {activity.subject || activity.content || 'Notification sent'}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-[#434E54]/50">{timestamp}</p>
          {activity.status === 'failed' && (
            <span className="text-xs text-red-600">Failed</span>
          )}
        </div>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export function ActivityFeed({ initialActivities }: ActivityFeedProps) {
  const activities = initialActivities;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-[#434E54] mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5" />
        Recent Activity
      </h2>

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-[#EAE0D5] mx-auto mb-4" />
          <p className="text-[#434E54]/60">No recent activity</p>
          <p className="text-sm text-[#434E54]/40 mt-1">
            Activity will appear here as events occur
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}
