'use client';

import { MessageSquare, AlertCircle } from 'lucide-react';

interface NotificationPreviewProps {
  customerName: string;
  petName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  discountPercentage: number;
  responseWindowHours: number;
}

/**
 * NotificationPreview - SMS message preview with variable substitution
 * Shows the actual message that will be sent to customers
 */
export function NotificationPreview({
  customerName,
  petName,
  serviceName,
  appointmentDate,
  appointmentTime,
  discountPercentage,
  responseWindowHours,
}: NotificationPreviewProps) {
  // Format the date nicely
  const formattedDate = new Date(appointmentDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Generate the SMS message
  const message = generateWaitlistSMS({
    customerName,
    petName,
    serviceName,
    appointmentDate: formattedDate,
    appointmentTime,
    discountPercentage,
    responseWindowHours,
  });

  // Character count
  const charCount = message.length;
  const maxChars = 160;
  const isOverLimit = charCount > maxChars;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-[#434E54] flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          SMS Preview
        </h4>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              isOverLimit ? 'text-red-500' : 'text-[#434E54]/50'
            }`}
          >
            {charCount} / {maxChars}
          </span>
          {isOverLimit && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
        </div>
      </div>

      {/* Message Preview Card */}
      <div className="bg-[#F8EEE5] rounded-xl p-4">
        <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm px-4 py-3 max-w-xs">
          <p className="text-sm text-[#434E54] whitespace-pre-wrap">{message}</p>
        </div>
        <p className="text-xs text-[#434E54]/40 mt-2 pl-1">The Puppy Day</p>
      </div>

      {/* Warning for long messages */}
      {isOverLimit && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>
            Message exceeds 160 characters and will be sent as multiple SMS segments.
            Consider shortening the message to reduce costs.
          </span>
        </div>
      )}

      {/* Preview Details */}
      <div className="text-xs text-[#434E54]/50 space-y-1">
        <div>
          <span className="font-medium">From:</span> The Puppy Day
        </div>
        <div>
          <span className="font-medium">To:</span> {customerName}
        </div>
        <div>
          <span className="font-medium">Type:</span> Waitlist Slot Offer
        </div>
      </div>
    </div>
  );
}

/**
 * Generate the waitlist SMS message
 * Template matches the format that will be sent via Twilio
 */
function generateWaitlistSMS(params: {
  customerName: string;
  petName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  discountPercentage: number;
  responseWindowHours: number;
}): string {
  const {
    customerName,
    petName,
    serviceName,
    appointmentDate,
    appointmentTime,
    discountPercentage,
    responseWindowHours,
  } = params;

  return (
    `Hi ${customerName}! ` +
    `A ${serviceName} slot for ${petName} opened up on ${appointmentDate} at ${appointmentTime}. ` +
    `${discountPercentage}% off if you book now! ` +
    `Reply YES within ${responseWindowHours}h to claim. - The Puppy Day`
  );
}

// Export the function so it can be used in SMS sending
export { generateWaitlistSMS };
