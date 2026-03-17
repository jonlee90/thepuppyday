'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { CampaignTypeSelector } from './campaign-creation/CampaignTypeSelector';
import { SegmentBuilder } from './campaign-creation/SegmentBuilder';
import { MessageComposer } from './campaign-creation/MessageComposer';
import { ScheduleSection } from './campaign-creation/ScheduleSection';
import { TemplateSelector } from './campaign-creation/TemplateSelector';
import { validateCompleteCampaign } from '@/lib/campaign-validation';
import { useCreateCampaign } from '@/hooks/use-create-campaign';
import { toast } from '@/hooks/use-toast';
import type {
  CampaignType,
  CampaignChannel,
  SegmentCriteria,
  MessageContent,
  ABTestConfig,
} from '@/types/marketing';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'template' | 'type' | 'segment' | 'message' | 'schedule';

/**
 * CreateCampaignModal - Multi-step campaign creation flow
 */
export function CreateCampaignModal({ isOpen, onClose, onSuccess }: CreateCampaignModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('template');

  // Form state
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [campaignType, setCampaignType] = useState<CampaignType | null>(null);
  const [channel, setChannel] = useState<CampaignChannel>('both');
  const [segmentCriteria, setSegmentCriteria] = useState<SegmentCriteria>({});
  const [messageContent, setMessageContent] = useState<MessageContent>({});
  const [abTestConfig, setAbTestConfig] = useState<ABTestConfig | null>(null);
  const [sendNow, setSendNow] = useState(true);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);

  const { isSubmitting, error, createCampaign, reset } = useCreateCampaign();

  // Handle dialog close
  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  // Reset form to initial state
  const resetForm = () => {
    setCurrentStep('template');
    setCampaignName('');
    setCampaignDescription('');
    setCampaignType(null);
    setChannel('both');
    setSegmentCriteria({});
    setMessageContent({});
    setAbTestConfig(null);
    setSendNow(true);
    setScheduledAt(null);
    reset();
  };

  // Handle template selection
  const handleTemplateSelect = (template: any) => {
    setCampaignName(template.name);
    setCampaignDescription(template.description);
    setChannel(template.channel);
    setMessageContent(template.message_content);
    setSegmentCriteria(template.suggested_criteria);
    setCurrentStep('type');
  };

  // Handle "Start from Scratch"
  const handleStartFromScratch = () => {
    setCurrentStep('type');
  };

  // Navigate to next step
  const handleNext = () => {
    const steps: Step[] = ['template', 'type', 'segment', 'message', 'schedule'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  // Navigate to previous step
  const handleBack = () => {
    const steps: Step[] = ['template', 'type', 'segment', 'message', 'schedule'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate complete campaign
    const validation = validateCompleteCampaign({
      name: campaignName,
      type: campaignType || '',
      channel,
      segment_criteria: segmentCriteria,
      message_content: messageContent,
      ab_test_config: abTestConfig,
      send_now: sendNow,
      scheduled_at: scheduledAt,
    });

    if (!validation.isValid) {
      toast.error('Validation Failed', {
        description: validation.errors[0]?.message || 'Please check your inputs',
      });
      return;
    }

    // Create campaign
    const result = await createCampaign({
      name: campaignName,
      description: campaignDescription,
      type: campaignType!,
      channel,
      segment_criteria: segmentCriteria,
      message_content: messageContent,
      ab_test_config: abTestConfig || undefined,
      scheduled_at: sendNow ? undefined : scheduledAt || undefined,
    });

    if (result) {
      toast.success('Campaign Created', {
        description: sendNow
          ? 'Your campaign is being sent now'
          : 'Your campaign has been scheduled successfully',
      });
      handleClose();
      onSuccess?.();
    } else {
      toast.error('Failed to Create Campaign', {
        description: error || 'Please try again',
      });
    }
  };

  // Get step progress
  const getStepProgress = () => {
    const steps: Step[] = ['template', 'type', 'segment', 'message', 'schedule'];
    return steps.indexOf(currentStep) + 1;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && handleClose()}
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-semibold text-[#434E54]">Create Campaign</h3>
                  <AdminButton
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="btn-circle"
                  >
                    <X className="w-5 h-5" />
                  </AdminButton>
                </div>

                {/* Progress Steps */}
                {currentStep !== 'template' && (
                  <ul className="steps w-full">
                    <li className={`step ${getStepProgress() >= 1 ? 'step-primary' : ''}`}>
                      Type
                    </li>
                    <li className={`step ${getStepProgress() >= 2 ? 'step-primary' : ''}`}>
                      Audience
                    </li>
                    <li className={`step ${getStepProgress() >= 3 ? 'step-primary' : ''}`}>
                      Message
                    </li>
                    <li className={`step ${getStepProgress() >= 4 ? 'step-primary' : ''}`}>
                      Schedule
                    </li>
                  </ul>
                )}
              </div>

              {/* Content */}
              <div className="px-6 py-6 overflow-y-auto flex-1">
                {currentStep === 'template' && (
                  <TemplateSelector
                    onSelectTemplate={handleTemplateSelect}
                    onStartFromScratch={handleStartFromScratch}
                  />
                )}

                {currentStep === 'type' && (
                  <CampaignTypeSelector
                    selectedType={campaignType}
                    onSelectType={setCampaignType}
                    campaignName={campaignName}
                    onNameChange={setCampaignName}
                    campaignDescription={campaignDescription}
                    onDescriptionChange={setCampaignDescription}
                  />
                )}

                {currentStep === 'segment' && (
                  <SegmentBuilder
                    criteria={segmentCriteria}
                    onCriteriaChange={setSegmentCriteria}
                  />
                )}

                {currentStep === 'message' && (
                  <MessageComposer
                    channel={channel}
                    onChannelChange={setChannel}
                    messageContent={messageContent}
                    onMessageChange={setMessageContent}
                    abTestConfig={abTestConfig}
                    onAbTestChange={setAbTestConfig}
                  />
                )}

                {currentStep === 'schedule' && (
                  <ScheduleSection
                    campaignType={campaignType!}
                    sendNow={sendNow}
                    onSendNowChange={setSendNow}
                    scheduledAt={scheduledAt}
                    onScheduledAtChange={setScheduledAt}
                  />
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between">
                <AdminButton
                  variant="ghost"
                  onClick={currentStep === 'template' ? handleClose : handleBack}
                  disabled={isSubmitting}
                >
                  {currentStep === 'template' ? 'Cancel' : 'Back'}
                </AdminButton>

                {currentStep !== 'template' && currentStep !== 'schedule' && (
                  <AdminButton variant="primary" onClick={handleNext} disabled={!campaignType}>
                    Next
                  </AdminButton>
                )}

                {currentStep === 'schedule' && (
                  <AdminButton
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !campaignType}
                    isLoading={isSubmitting}
                    loadingText="Creating..."
                  >
                    {sendNow ? 'Send Now' : 'Schedule Campaign'}
                  </AdminButton>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
