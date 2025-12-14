'use client';

/**
 * ReportCardForm Component
 * Main report card form with all sections and auto-save
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useReportCardForm } from '@/hooks/admin/use-report-card-form';
import { PhotoUploadSection } from './PhotoUploadSection';
import { AssessmentSection } from './AssessmentSection';
import { HealthObservationsSection } from './HealthObservationsSection';
import { GroomerNotesSection } from './GroomerNotesSection';
import { SubmitActions } from './SubmitActions';

interface ReportCardFormProps {
  appointmentId: string;
  petName: string;
  serviceName: string;
  customerName: string;
  appointmentDate: string;
}

export function ReportCardForm({
  appointmentId,
  petName,
  serviceName,
  customerName,
  appointmentDate,
}: ReportCardFormProps) {
  const router = useRouter();
  const [criticalIssueDetected, setCriticalIssueDetected] = useState(false);

  const {
    formState,
    dontSend,
    setDontSend,
    saveStatus,
    setMood,
    setCoatCondition,
    setBehavior,
    setHealthObservations,
    setGroomerNotes,
    setBeforePhoto,
    setAfterPhoto,
    submit,
  } = useReportCardForm({
    appointmentId,
    onSuccess: () => {
      router.push(`/admin/appointments`);
    },
    onError: (error) => {
      console.error('Form error:', error);
    },
  });

  // Upload photo handler
  const handlePhotoUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/admin/report-cards/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return data.url;
  };

  // Submit handlers
  const handleSaveDraft = async () => {
    return await submit(true);
  };

  const handleSubmit = async () => {
    return await submit(false);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#434E54] hover:text-[#363F44] mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Appointments
        </button>

        <h1 className="text-3xl font-bold text-[#434E54] mb-2">
          Report Card
        </h1>
        <div className="text-[#6B7280]">
          <p className="text-lg font-medium">{petName} - {serviceName}</p>
          <p className="text-sm">
            {customerName} • {new Date(appointmentDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Critical Issue Alert */}
      {criticalIssueDetected && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-800 mb-1">
              Critical Health Issue Detected
            </h3>
            <p className="text-sm text-red-700">
              This appointment will be flagged for follow-up. Consider enabling "Don't Send"
              to contact the customer directly before sending this report card.
            </p>
          </div>
        </div>
      )}

      {/* Form Sections */}
      <div className="space-y-6">
        {/* Photos */}
        <PhotoUploadSection
          beforePhotoUrl={formState.before_photo_url}
          afterPhotoUrl={formState.after_photo_url}
          onBeforePhotoChange={setBeforePhoto}
          onAfterPhotoChange={setAfterPhoto}
          onUpload={handlePhotoUpload}
        />

        {/* Assessment */}
        <AssessmentSection
          mood={formState.mood}
          coatCondition={formState.coat_condition}
          behavior={formState.behavior}
          onMoodChange={setMood}
          onCoatConditionChange={setCoatCondition}
          onBehaviorChange={setBehavior}
        />

        {/* Health Observations */}
        <HealthObservationsSection
          value={formState.health_observations}
          onChange={setHealthObservations}
          onCriticalIssueDetected={setCriticalIssueDetected}
        />

        {/* Groomer Notes */}
        <GroomerNotesSection
          notes={formState.groomer_notes}
          dontSend={dontSend}
          onNotesChange={setGroomerNotes}
          onDontSendChange={setDontSend}
        />

        {/* Submit Actions */}
        <SubmitActions
          formState={formState}
          isSaving={saveStatus.isSaving}
          lastSaved={saveStatus.lastSaved}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
