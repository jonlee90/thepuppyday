/**
 * In-memory mock store for Supabase with localStorage persistence
 */

import type { TableName } from '@/types/database';
import { generateId } from '@/lib/utils';
import {
  seedServices,
  generateServicePrices,
  seedAddons,
  seedBreeds,
  seedSettings,
  seedUsers,
  seedPets,
  seedAppointments,
  seedBeforeAfterPairs,
  seedGalleryImages,
  seedSiteContent,
  seedLoyaltySettings,
  seedCustomerLoyalty,
  seedLoyaltyPunches,
  seedLoyaltyRedemptions,
  seedReportCards,
} from './seed';

const STORAGE_KEY = 'thepuppyday_mock_db';

type TableData = Record<string, unknown>;

interface QueryOptions {
  column?: string;
  value?: unknown;
  order?: { column: string; ascending: boolean };
  limit?: number;
  offset?: number;
}

class MockStore {
  private tables: Map<string, TableData[]> = new Map();
  private initialized = false;

  constructor() {
    this.initializeTables();
  }

  private initializeTables(): void {
    if (this.initialized) return;

    // Try to load from localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          for (const [table, data] of Object.entries(parsed)) {
            this.tables.set(table, data as TableData[]);
          }
          this.initialized = true;
          return;
        } catch {
          // Ignore parse errors, seed fresh data
        }
      }
    }

    // Initialize with empty tables
    const tableNames: TableName[] = [
      'users',
      'breeds',
      'pets',
      'services',
      'service_prices',
      'addons',
      'appointments',
      'appointment_addons',
      'waitlist',
      'report_cards',
      'memberships',
      'customer_memberships',
      'loyalty_points',
      'loyalty_transactions',
      'loyalty_settings',
      'customer_loyalty',
      'loyalty_punches',
      'loyalty_redemptions',
      'customer_flags',
      'payments',
      'site_content',
      'promo_banners',
      'gallery_images',
      'before_after_pairs',
      'settings',
      'notifications_log',
    ];

    for (const table of tableNames) {
      this.tables.set(table, []);
    }

    // Seed default data
    this.seed();
    this.initialized = true;
  }

  /**
   * Seed the store with default data
   */
  seed(): void {
    // Seed users
    this.tables.set('users', [...seedUsers] as unknown as TableData[]);

    // Seed services
    this.tables.set('services', [...seedServices] as unknown as TableData[]);
    this.tables.set('service_prices', generateServicePrices(seedServices) as unknown as TableData[]);

    // Seed addons
    this.tables.set('addons', [...seedAddons] as unknown as TableData[]);

    // Seed breeds
    this.tables.set('breeds', [...seedBreeds] as unknown as TableData[]);

    // Seed settings
    this.tables.set('settings', [...seedSettings] as unknown as TableData[]);

    // Seed pets and appointments
    this.tables.set('pets', [...seedPets] as unknown as TableData[]);
    this.tables.set('appointments', [...seedAppointments] as unknown as TableData[]);

    // Seed marketing content
    this.tables.set('before_after_pairs', [...seedBeforeAfterPairs] as unknown as TableData[]);
    this.tables.set('gallery_images', [...seedGalleryImages] as unknown as TableData[]);
    this.tables.set('site_content', [...seedSiteContent] as unknown as TableData[]);

    // Seed loyalty punch card system
    this.tables.set('loyalty_settings', [...seedLoyaltySettings] as unknown as TableData[]);
    this.tables.set('customer_loyalty', [...seedCustomerLoyalty] as unknown as TableData[]);
    this.tables.set('loyalty_punches', [...seedLoyaltyPunches] as unknown as TableData[]);
    this.tables.set('loyalty_redemptions', [...seedLoyaltyRedemptions] as unknown as TableData[]);

    // Seed report cards
    this.tables.set('report_cards', [...seedReportCards] as unknown as TableData[]);

    this.save();
  }

  /**
   * Save current state to localStorage
   */
  save(): void {
    if (typeof window === 'undefined') return;

    const data: Record<string, TableData[]> = {};
    for (const [table, records] of this.tables) {
      data[table] = records;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Reset the store to initial state
   */
  reset(): void {
    for (const table of this.tables.keys()) {
      this.tables.set(table, []);
    }
    this.seed();
  }

  /**
   * Select records from a table
   */
  select<T extends TableData>(
    table: string,
    options?: QueryOptions
  ): T[] {
    let records = [...(this.tables.get(table) || [])] as T[];

    // Filter by column value
    if (options?.column && options?.value !== undefined) {
      records = records.filter((r) => r[options.column!] === options.value);
    }

    // Order by column
    if (options?.order) {
      records.sort((a, b) => {
        const aVal = a[options.order!.column] as any;
        const bVal = b[options.order!.column] as any;
        if (aVal < bVal) return options.order!.ascending ? -1 : 1;
        if (aVal > bVal) return options.order!.ascending ? 1 : -1;
        return 0;
      });
    }

    // Offset and limit
    if (options?.offset) {
      records = records.slice(options.offset);
    }
    if (options?.limit) {
      records = records.slice(0, options.limit);
    }

    return records;
  }

  /**
   * Select a single record by ID
   */
  selectById<T extends TableData>(table: string, id: string): T | null {
    const records = this.tables.get(table) || [];
    return (records.find((r) => r.id === id) as T) || null;
  }

  /**
   * Insert a record into a table
   */
  insert<T extends TableData>(table: string, data: Partial<T>): T {
    const records = this.tables.get(table) || [];
    const newRecord = {
      id: generateId(),
      created_at: new Date().toISOString(),
      ...data,
    } as unknown as T;
    records.push(newRecord);
    this.tables.set(table, records);
    this.save();
    return newRecord;
  }

  /**
   * Insert multiple records into a table
   */
  insertMany<T extends TableData>(table: string, dataArray: Partial<T>[]): T[] {
    return dataArray.map((data) => this.insert<T>(table, data));
  }

  /**
   * Update a record by ID
   */
  update<T extends TableData>(
    table: string,
    id: string,
    data: Partial<T>
  ): T | null {
    const records = this.tables.get(table) || [];
    const index = records.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const updated = {
      ...records[index],
      ...data,
      updated_at: new Date().toISOString(),
    } as unknown as T;
    records[index] = updated;
    this.tables.set(table, records);
    this.save();
    return updated;
  }

  /**
   * Delete a record by ID
   */
  delete(table: string, id: string): boolean {
    const records = this.tables.get(table) || [];
    const index = records.findIndex((r) => r.id === id);
    if (index === -1) return false;

    records.splice(index, 1);
    this.tables.set(table, records);
    this.save();
    return true;
  }

  /**
   * Delete records matching a condition
   */
  deleteWhere(table: string, column: string, value: unknown): number {
    const records = this.tables.get(table) || [];
    const initialLength = records.length;
    const filtered = records.filter((r) => r[column] !== value);
    this.tables.set(table, filtered);
    this.save();
    return initialLength - filtered.length;
  }

  /**
   * Count records in a table
   */
  count(table: string, column?: string, value?: unknown): number {
    const records = this.tables.get(table) || [];
    if (column && value !== undefined) {
      return records.filter((r) => r[column] === value).length;
    }
    return records.length;
  }

  /**
   * Get all tables for debugging
   */
  getAllTables(): Record<string, TableData[]> {
    const result: Record<string, TableData[]> = {};
    for (const [table, records] of this.tables) {
      result[table] = records;
    }
    return result;
  }
}

// Singleton instance
let storeInstance: MockStore | null = null;

export function getMockStore(): MockStore {
  if (!storeInstance) {
    storeInstance = new MockStore();
  }
  return storeInstance;
}

export { MockStore };
