'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, DollarSign, Percent, AlertCircle, Calculator, X } from 'lucide-react';
import type { CommissionSettingsData, CommissionPreviewCalculation } from '@/types/staff';
import type { Service, StaffCommission } from '@/types/database';

// ============================================
// Validation Schema
// ============================================

const commissionSchema = z.object({
  rate_type: z.enum(['percentage', 'flat_rate']),
  rate: z.number().min(0, 'Rate must be non-negative'),
  include_addons: z.boolean(),
  service_overrides: z.array(
    z.object({
      service_id: z.string(),
      rate: z.number().min(0),
    })
  ),
}).refine((data) => {
  if (data.rate_type === 'percentage' && data.rate > 100) {
    return false;
  }
  return true;
}, {
  message: 'Percentage rate cannot exceed 100',
  path: ['rate'],
});

// ============================================
// Main Component
// ============================================

interface CommissionSettingsProps {
  staffId: string;
  staffName: string;
}

export function CommissionSettings({ staffId, staffName }: CommissionSettingsProps) {
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [initialSettings, setInitialSettings] = useState<StaffCommission | null>(null);

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
    reset,
    control,
  } = useForm<CommissionSettingsData>({
    resolver: zodResolver(commissionSchema),
    defaultValues: {
      rate_type: 'percentage',
      rate: 0,
      include_addons: false,
      service_overrides: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'service_overrides',
  });

  const watchRateType = watch('rate_type');
  const watchRate = watch('rate');
  const watchIncludeAddons = watch('include_addons');
  const watchOverrides = watch('service_overrides');

  // Load data
  useEffect(() => {
    loadData();
  }, [staffId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load commission settings
      const commissionRes = await fetch(`/api/admin/settings/staff/${staffId}/commission`);
      const commissionData = await commissionRes.json();

      if (commissionRes.ok) {
        const settings = commissionData.data;
        setInitialSettings(settings);
        reset({
          rate_type: settings.rate_type,
          rate: settings.rate,
          include_addons: settings.include_addons,
          service_overrides: settings.service_overrides || [],
        });
      }

      // Load services
      const servicesRes = await fetch('/api/admin/services');
      const servicesData = await servicesRes.json();

      if (servicesRes.ok) {
        setServices(servicesData.data.filter((s: Service) => s.is_active));
      }
    } catch (error) {
      console.error('Failed to load commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Submit handler
  const onSubmit = async (data: CommissionSettingsData) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/settings/staff/${staffId}/commission`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccessToast('Commission settings saved');
        setInitialSettings(result.data);
        reset(data); // Reset form to mark as not dirty
      } else {
        showErrorToast(result.error || 'Failed to save commission settings');
      }
    } catch (error) {
      console.error('Failed to save commission:', error);
      showErrorToast('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Preview calculation
  const previewCalculation = useMemo((): CommissionPreviewCalculation => {
    // Sample appointment data
    const sampleService = services[0];
    const serviceName = sampleService?.name || 'Basic Grooming';
    const servicePrice = 70; // Medium dog price
    const addonsTotal = 25; // $10 teeth brushing + $15 pawdicure

    const baseAmount = watchIncludeAddons ? servicePrice + addonsTotal : servicePrice;

    // Check for service override
    let commissionRate = watchRate;
    if (sampleService && watchOverrides) {
      const override = watchOverrides.find((o) => o.service_id === sampleService.id);
      if (override) {
        commissionRate = override.rate;
      }
    }

    const commissionAmount = watchRateType === 'percentage'
      ? (baseAmount * commissionRate) / 100
      : commissionRate;

    const notes: string[] = [];
    if (watchIncludeAddons) {
      notes.push('Add-ons included in commission');
    }
    if (watchRateType === 'flat_rate') {
      notes.push('Flat rate per service');
    }

    return {
      service_name: serviceName,
      service_price: servicePrice,
      addons_total: addonsTotal,
      base_amount: baseAmount,
      commission_rate: commissionRate,
      commission_amount: Math.round(commissionAmount * 100) / 100,
      notes,
    };
  }, [services, watchRateType, watchRate, watchIncludeAddons, watchOverrides]);

  // Service override handlers
  const handleAddOverride = (serviceId: string) => {
    const existing = watchOverrides?.find((o) => o.service_id === serviceId);
    if (!existing) {
      append({ service_id: serviceId, rate: watchRate });
    }
  };

  const handleRemoveOverride = (serviceId: string) => {
    const index = watchOverrides?.findIndex((o) => o.service_id === serviceId);
    if (index !== undefined && index >= 0) {
      remove(index);
    }
  };

  const handleUpdateOverride = (serviceId: string, rate: number) => {
    const index = watchOverrides?.findIndex((o) => o.service_id === serviceId);
    if (index !== undefined && index >= 0) {
      update(index, { service_id: serviceId, rate });
    }
  };

  const getServiceOverride = (serviceId: string) => {
    return watchOverrides?.find((o) => o.service_id === serviceId);
  };

  // Toast helpers
  const showSuccessToast = (message: string) => {
    console.log('Success:', message);
  };

  const showErrorToast = (message: string) => {
    console.error('Error:', message);
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#434E54] mx-auto mb-3" />
        <p className="text-sm text-[#6B7280]">Loading commission settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#434E54]">Commission Settings</h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Configure commission rates for {staffName}
        </p>
      </div>

      {/* Unsaved Changes Warning */}
      {isDirty && (
        <div className="alert alert-warning bg-[#FFB347]/10 border-[#FFB347]/20">
          <AlertCircle className="w-5 h-5 text-[#FFB347]" />
          <span className="text-sm text-[#434E54]">You have unsaved changes</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Base Settings Card */}
        <div className="card bg-white shadow-sm border border-[#434E54]/10">
          <div className="card-body p-6">
            <h3 className="text-lg font-semibold text-[#434E54] mb-4">Base Commission Rate</h3>

            {/* Rate Type Selector */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium text-[#434E54]">Rate Type</span>
              </label>
              <div className="flex gap-4">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="radio"
                    {...register('rate_type')}
                    value="percentage"
                    className="radio radio-primary"
                  />
                  <span className="label-text flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    Percentage
                  </span>
                </label>
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="radio"
                    {...register('rate_type')}
                    value="flat_rate"
                    className="radio radio-primary"
                  />
                  <span className="label-text flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Flat Rate per Service
                  </span>
                </label>
              </div>
            </div>

            {/* Rate Input */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium text-[#434E54]">
                  Base Rate {watchRateType === 'percentage' ? '(%)' : '($)'}
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  {...register('rate', { valueAsNumber: true })}
                  className={`input input-bordered bg-white w-full ${
                    watchRateType === 'percentage' ? 'pr-8' : 'pl-8'
                  } ${
                    errors.rate ? 'input-error' : 'border-[#E5E5E5] focus:border-[#434E54]'
                  }`}
                  placeholder={watchRateType === 'percentage' ? '15' : '10.00'}
                />
                {watchRateType === 'percentage' ? (
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                ) : (
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                )}
              </div>
              {errors.rate && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.rate.message}</span>
                </label>
              )}
            </div>

            {/* Include Add-ons Toggle */}
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  {...register('include_addons')}
                  className="toggle toggle-success"
                />
                <span className="label-text font-medium text-[#434E54]">
                  Include add-ons in commission calculation
                </span>
              </label>
              <label className="label">
                <span className="label-text-alt text-[#9CA3AF]">
                  When enabled, commission is calculated on service price + add-ons total
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Service Overrides Card */}
        <div className="card bg-white shadow-sm border border-[#434E54]/10">
          <div className="card-body p-6">
            <h3 className="text-lg font-semibold text-[#434E54] mb-2">Per-Service Overrides</h3>
            <p className="text-sm text-[#6B7280] mb-4">
              Set custom commission rates for specific services (optional)
            </p>

            {/* Services Table */}
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="bg-[#EAE0D5]">
                  <tr>
                    <th className="text-[#434E54]">Service</th>
                    <th className="text-[#434E54]">Custom Rate</th>
                    <th className="text-[#434E54]"></th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => {
                    const override = getServiceOverride(service.id);
                    const hasOverride = !!override;

                    return (
                      <tr key={service.id} className="hover:bg-[#F8EEE5]/50">
                        <td className="font-medium text-[#434E54]">{service.name}</td>
                        <td>
                          {hasOverride ? (
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={override.rate}
                                  onChange={(e) =>
                                    handleUpdateOverride(service.id, parseFloat(e.target.value))
                                  }
                                  className={`input input-bordered input-sm bg-white w-32 ${
                                    watchRateType === 'percentage' ? 'pr-8' : 'pl-8'
                                  }`}
                                />
                                {watchRateType === 'percentage' ? (
                                  <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                                ) : (
                                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-[#9CA3AF]">Using base rate</span>
                          )}
                        </td>
                        <td>
                          {hasOverride ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveOverride(service.id)}
                              className="btn btn-ghost btn-sm text-error"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddOverride(service.id)}
                              className="btn btn-ghost btn-sm"
                            >
                              Set Override
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Preview Calculation Card */}
        <div className="card bg-[#F8EEE5] border border-[#434E54]/10">
          <div className="card-body p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-[#434E54]" />
              </div>
              <h3 className="text-lg font-semibold text-[#434E54]">Preview Calculation</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Service:</span>
                <span className="font-medium text-[#434E54]">{previewCalculation.service_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Service Price:</span>
                <span className="font-medium text-[#434E54]">
                  ${previewCalculation.service_price.toFixed(2)}
                </span>
              </div>
              {watchIncludeAddons && (
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Add-ons Total:</span>
                  <span className="font-medium text-[#434E54]">
                    ${previewCalculation.addons_total.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="divider my-2"></div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Commission Base:</span>
                <span className="font-medium text-[#434E54]">
                  ${previewCalculation.base_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Commission Rate:</span>
                <span className="font-medium text-[#434E54]">
                  {watchRateType === 'percentage'
                    ? `${previewCalculation.commission_rate}%`
                    : `$${previewCalculation.commission_rate.toFixed(2)}`}
                </span>
              </div>
              <div className="divider my-2"></div>
              <div className="flex justify-between text-base">
                <span className="font-semibold text-[#434E54]">Commission Amount:</span>
                <span className="font-bold text-[#434E54]">
                  ${previewCalculation.commission_amount.toFixed(2)}
                </span>
              </div>
              {previewCalculation.notes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#434E54]/10">
                  {previewCalculation.notes.map((note, i) => (
                    <p key={i} className="text-xs text-[#6B7280]">• {note}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="alert bg-blue-50 border-blue-200">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-[#434E54]">
            Commission settings are for reporting purposes only. They do not affect payment processing.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => reset(initialSettings as any)}
            className="btn btn-ghost"
            disabled={!isDirty || saving}
          >
            Reset Changes
          </button>
          <button
            type="submit"
            className="btn bg-[#434E54] hover:bg-[#363F44] text-white border-none"
            disabled={!isDirty || saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Commission Settings'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
