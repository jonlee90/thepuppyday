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
  const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
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
        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          SMS Preview
        </h4>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              isOverLimit ? 'text-error' : 'text-gray-600'
            }`}
          >
            {charCount} / {maxChars}
          </span>
          {isOverLimit && (
            <AlertCircle className="h-4 w-4 text-error" />
          )}
        </div>
      </div>

      {/* Message Preview Card */}
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body p-4">
          <div className="mockup-phone scale-90 origin-top">
            <div className="camera"></div>
            <div className="display">
              <div className="artboard artboard-demo phone-1 bg-white p-4">
                <div className="chat chat-start">
                  <div className="chat-bubble bg-base-300 text-gray-900 text-sm whitespace-pre-wrap">
                    {message}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning for long messages */}
      {isOverLimit && (
        <div className="alert alert-warning">
          <AlertCircle className="h-5 w-5" />
          <span>
            Message exceeds 160 characters and will be sent as multiple SMS segments.
            Consider shortening the message to reduce costs.
          </span>
        </div>
      )}

      {/* Preview Details */}
      <div className="text-xs text-gray-500 space-y-1">
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
