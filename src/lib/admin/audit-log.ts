/**
 * Settings Audit Log Utility
 * Task 0167: Audit logging for settings changes
 *
 * Provides utilities to log admin settings changes with fire-and-forget pattern.
 * Logs are stored in settings_audit_log table with old/new value comparison.
 */

import type { AppSupabaseClient } from '@/lib/supabase/server';

/**
 * Setting type categories
 */
export type SettingType =
  | 'booking'
  | 'loyalty'
  | 'site_content'
  | 'banner'
  | 'staff'
  | 'referral'
  | 'notification'
  | 'other';

/**
 * Settings audit log entry
 */
export interface SettingsAuditLogEntry {
  id: string;
  admin_id: string | null;
  setting_type: SettingType;
  setting_key: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Admin user info for audit log display
 */
export interface AdminInfo {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

/**
 * Audit log entry with admin details
 */
export interface AuditLogEntryWithAdmin extends SettingsAuditLogEntry {
  admin?: AdminInfo;
}

/**
 * Filter options for getting audit log
 */
export interface AuditLogFilters {
  setting_type?: SettingType;
  admin_id?: string;
  date_from?: Date;
  date_to?: Date;
  limit?: number;
}

/**
 * Log a settings change to the audit log
 *
 * Fire-and-forget pattern: Does not block main operation on failure.
 * Compares old and new values - only logs if actually changed.
 *
 * @param supabase - Supabase client
 * @param adminId - ID of admin making the change
 * @param settingType - Category of setting (booking, loyalty, etc.)
 * @param settingKey - Specific setting identifier (e.g., "min_advance_hours", "hero.headline")
 * @param oldValue - Previous value (any JSON-serializable type)
 * @param newValue - New value (any JSON-serializable type)
 */
export async function logSettingsChange(
  supabase: AppSupabaseClient,
  adminId: string,
  settingType: SettingType,
  settingKey: string,
  oldValue: unknown,
  newValue: unknown
): Promise<void> {
  try {
    // Serialize values to JSON for comparison
    const oldJson = oldValue !== null && oldValue !== undefined
      ? (typeof oldValue === 'object' ? oldValue : { value: oldValue })
      : null;
    const newJson = newValue !== null && newValue !== undefined
      ? (typeof newValue === 'object' ? newValue : { value: newValue })
      : null;

    // Compare old and new values - only log if actually changed
    if (JSON.stringify(oldJson) === JSON.stringify(newJson)) {
      console.log('[Audit Log] Values unchanged, skipping log entry');
      return;
    }

    // Insert audit log entry (fire-and-forget)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('settings_audit_log')
      .insert({
        admin_id: adminId,
        setting_type: settingType,
        setting_key: settingKey,
        old_value: oldJson,
        new_value: newJson,
        created_at: new Date().toISOString(),
      });

    if (error) {
      // Log error but don't throw - fire-and-forget pattern
      console.error('[Audit Log] Failed to log settings change:', error);
    } else {
      console.log(
        `[Audit Log] Logged change: ${settingType}.${settingKey} by admin ${adminId}`
      );
    }
  } catch (error) {
    // Catch any errors to prevent blocking main operation
    console.error('[Audit Log] Error in logSettingsChange:', error);
  }
}

/**
 * Get audit log entries with optional filtering
 *
 * @param supabase - Supabase client
 * @param filters - Optional filters for audit log query
 * @returns Array of audit log entries with admin details
 */
export async function getAuditLog(
  supabase: AppSupabaseClient,
  filters?: AuditLogFilters
): Promise<AuditLogEntryWithAdmin[]> {
  try {
    // Start building query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('settings_audit_log')
      .select(`
        *,
        admin:users!admin_id(
          id,
          email,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.setting_type) {
      query = query.eq('setting_type', filters.setting_type);
    }

    if (filters?.admin_id) {
      query = query.eq('admin_id', filters.admin_id);
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from.toISOString());
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to.toISOString());
    }

    // Apply limit (default: 100)
    const limit = filters?.limit || 100;
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Transform data to include admin info
    const entries: AuditLogEntryWithAdmin[] = (data || []).map((entry: Record<string, unknown>) => ({
      id: entry.id as string,
      admin_id: entry.admin_id as string | null,
      setting_type: entry.setting_type as SettingType,
      setting_key: entry.setting_key as string,
      old_value: entry.old_value as Record<string, unknown> | null,
      new_value: entry.new_value as Record<string, unknown> | null,
      created_at: entry.created_at as string,
      admin: entry.admin ? {
        id: (entry.admin as Record<string, unknown>).id as string,
        email: (entry.admin as Record<string, unknown>).email as string,
        first_name: (entry.admin as Record<string, unknown>).first_name as string,
        last_name: (entry.admin as Record<string, unknown>).last_name as string,
      } : undefined,
    }));

    return entries;
  } catch (error) {
    console.error('[Audit Log] Error fetching audit log:', error);
    throw error;
  }
}

/**
 * Get audit log entries for a specific setting key
 *
 * @param supabase - Supabase client
 * @param settingKey - Setting key to filter by
 * @param limit - Maximum number of entries to return
 * @returns Array of audit log entries with admin details
 */
export async function getAuditLogByKey(
  supabase: AppSupabaseClient,
  settingKey: string,
  limit = 50
): Promise<AuditLogEntryWithAdmin[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('settings_audit_log')
      .select(`
        *,
        admin:users!admin_id(
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('setting_key', settingKey)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Transform data to include admin info
    const entries: AuditLogEntryWithAdmin[] = (data || []).map((entry: Record<string, unknown>) => ({
      id: entry.id as string,
      admin_id: entry.admin_id as string | null,
      setting_type: entry.setting_type as SettingType,
      setting_key: entry.setting_key as string,
      old_value: entry.old_value as Record<string, unknown> | null,
      new_value: entry.new_value as Record<string, unknown> | null,
      created_at: entry.created_at as string,
      admin: entry.admin ? {
        id: (entry.admin as Record<string, unknown>).id as string,
        email: (entry.admin as Record<string, unknown>).email as string,
        first_name: (entry.admin as Record<string, unknown>).first_name as string,
        last_name: (entry.admin as Record<string, unknown>).last_name as string,
      } : undefined,
    }));

    return entries;
  } catch (error) {
    console.error('[Audit Log] Error fetching audit log by key:', error);
    throw error;
  }
}

/**
 * Get recent audit log entries for dashboard display
 *
 * @param supabase - Supabase client
 * @param limit - Maximum number of entries to return (default: 20)
 * @returns Array of recent audit log entries with admin details
 */
export async function getRecentAuditLog(
  supabase: AppSupabaseClient,
  limit = 20
): Promise<AuditLogEntryWithAdmin[]> {
  return getAuditLog(supabase, { limit });
}

/**
 * Get audit log statistics
 *
 * @param supabase - Supabase client
 * @param dateFrom - Start date for statistics
 * @param dateTo - End date for statistics
 * @returns Statistics about audit log entries
 */
export async function getAuditLogStats(
  supabase: AppSupabaseClient,
  dateFrom: Date,
  dateTo: Date
): Promise<{
  total_changes: number;
  by_setting_type: Record<SettingType, number>;
  by_admin: Record<string, number>;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('settings_audit_log')
      .select('admin_id, setting_type')
      .gte('created_at', dateFrom.toISOString())
      .lte('created_at', dateTo.toISOString());

    if (error) {
      throw error;
    }

    const entries = data || [];
    const total_changes = entries.length;

    // Count by setting type
    const by_setting_type: Record<string, number> = {};
    const by_admin: Record<string, number> = {};

    entries.forEach((entry: Record<string, unknown>) => {
      // Count by setting type
      if (entry.setting_type) {
        const settingType = entry.setting_type as string;
        by_setting_type[settingType] =
          (by_setting_type[settingType] || 0) + 1;
      }

      // Count by admin
      if (entry.admin_id) {
        const adminId = entry.admin_id as string;
        by_admin[adminId] = (by_admin[adminId] || 0) + 1;
      }
    });

    return {
      total_changes,
      by_setting_type: by_setting_type as Record<SettingType, number>,
      by_admin,
    };
  } catch (error) {
    console.error('[Audit Log] Error getting audit log stats:', error);
    throw error;
  }
}
