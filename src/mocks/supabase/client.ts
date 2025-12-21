/**
 * Mock Supabase client that mimics the real Supabase client API
 */

import { getMockStore } from './store';
import { generateId } from '@/lib/utils';
import type { User } from '@/types/database';

// Types for query builder
interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

interface QueryResultMany<T> {
  data: T[] | null;
  error: Error | null;
  count?: number;
}

// Mock auth user type
interface MockAuthUser {
  id: string;
  email: string;
  user_metadata: {
    first_name: string;
    last_name: string;
  };
}

interface MockSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: MockAuthUser;
}

// Storage keys
const AUTH_STORAGE_KEY = 'thepuppyday_mock_auth';

/**
 * Query builder class that mimics Supabase's query builder
 */
class MockQueryBuilder<T> {
  private table: string;
  private filters: { column: string; operator: string; value: unknown }[] = [];
  private orderOptions: { column: string; ascending: boolean } | null = null;
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private selectColumns: string[] = [];
  private isSingle = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = '*'): this {
    // Handle joins in select (e.g., "*, customer_loyalty!inner(customer_id)")
    if (columns.includes('!inner') || columns.includes('!left')) {
      // Store the full select string for join processing
      this.selectColumns = columns === '*' ? [] : [columns];
    } else {
      this.selectColumns = columns === '*' ? [] : columns.split(',').map((c) => c.trim());
    }
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  gt(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'gt', value });
    return this;
  }

  gte(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'gte', value });
    return this;
  }

  lt(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'lt', value });
    return this;
  }

  lte(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'lte', value });
    return this;
  }

  in(column: string, values: unknown[]): this {
    this.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  ilike(column: string, pattern: string): this {
    this.filters.push({ column, operator: 'ilike', value: pattern });
    return this;
  }

  like(column: string, pattern: string): this {
    this.filters.push({ column, operator: 'like', value: pattern });
    return this;
  }

  not(column: string, operator: string, value: unknown): this {
    // Handle .not('status', 'in', '(cancelled,no_show)')
    // The value is a string like '(cancelled,no_show)' which needs to be parsed
    if (operator === 'in' && typeof value === 'string') {
      // Parse the string format: '(value1,value2,value3)'
      const values = value.replace(/^\(/, '').replace(/\)$/, '').split(',').map(v => v.trim());
      this.filters.push({ column, operator: 'not_in', value: values });
    } else {
      // For other operators, negate them
      this.filters.push({ column, operator: `not_${operator}`, value });
    }
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orderOptions = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  range(from: number, to: number): this {
    this.offsetValue = from;
    this.limitValue = to - from + 1;
    return this;
  }

  single(): this {
    this.isSingle = true;
    this.limitValue = 1;
    return this;
  }

  maybeSingle(): this {
    this.isSingle = true;
    this.limitValue = 1;
    return this;
  }

  async then<TResult>(
    onfulfilled?: ((value: QueryResultMany<T> | QueryResult<T>) => TResult | PromiseLike<TResult>) | null
  ): Promise<TResult> {
    const result = await this.execute();
    return onfulfilled ? onfulfilled(result) : (result as unknown as TResult);
  }

  private async execute(): Promise<QueryResultMany<T> | QueryResult<T>> {
    const store = getMockStore();

    try {
      let records = store.select<Record<string, unknown>>(this.table);

      // Handle joins in select (e.g., "*, customer_loyalty!inner(customer_id)")
      // For joins, we need to filter based on related table
      const hasJoin = this.selectColumns.length > 0 &&
                      (this.selectColumns[0].includes('!inner') || this.selectColumns[0].includes('!left'));

      if (hasJoin) {
        // Parse join syntax: "*, customer_loyalty!inner(customer_id)"
        const joinMatch = this.selectColumns[0].match(/(\w+)!inner\((\w+)\)/);
        if (joinMatch) {
          const [, joinTable, joinColumn] = joinMatch;
          // Get the related table data
          const relatedRecords = store.select<Record<string, unknown>>(joinTable);

          // For each filter on the join table, resolve it
          const joinFilters = this.filters.filter(f => f.column.startsWith(`${joinTable}.`));
          for (const filter of joinFilters) {
            const actualColumn = filter.column.replace(`${joinTable}.`, '');
            const matchingRelated = relatedRecords.filter(r => r[actualColumn] === filter.value);
            const relatedIds = matchingRelated.map(r => r.id);

            // Filter main table by foreign key matching related IDs
            records = records.filter((r) => {
              const fkValue = r[`${joinTable}_id`];
              return relatedIds.includes(fkValue);
            });
          }
        }
      }

      // Apply direct filters (not join filters)
      for (const filter of this.filters) {
        // Skip join table filters (already handled above)
        if (filter.column.includes('.')) continue;

        records = records.filter((r) => {
          const value = r[filter.column];
          switch (filter.operator) {
            case 'eq':
              return value === filter.value;
            case 'neq':
              return value !== filter.value;
            case 'gt':
              return (value as number) > (filter.value as number);
            case 'gte':
              return (value as number) >= (filter.value as number);
            case 'lt':
              return (value as number) < (filter.value as number);
            case 'lte':
              return (value as number) <= (filter.value as number);
            case 'in':
              return (filter.value as unknown[]).includes(value);
            case 'not_in':
              return !(filter.value as unknown[]).includes(value);
            case 'ilike': {
              // Case-insensitive LIKE - convert SQL pattern to regex
              const pattern = (filter.value as string)
                .toLowerCase()
                .replace(/%/g, '.*')
                .replace(/_/g, '.');
              const regex = new RegExp(`^${pattern}$`, 'i');
              return typeof value === 'string' && regex.test(value);
            }
            case 'like': {
              // Case-sensitive LIKE - convert SQL pattern to regex
              const pattern = (filter.value as string)
                .replace(/%/g, '.*')
                .replace(/_/g, '.');
              const regex = new RegExp(`^${pattern}$`);
              return typeof value === 'string' && regex.test(value);
            }
            default:
              return true;
          }
        });
      }

      // Apply ordering
      if (this.orderOptions) {
        const { column, ascending } = this.orderOptions;
        records.sort((a, b) => {
          const aVal = a[column] as any;
          const bVal = b[column] as any;
          if (aVal < bVal) return ascending ? -1 : 1;
          if (aVal > bVal) return ascending ? 1 : -1;
          return 0;
        });
      }

      // Apply offset and limit
      if (this.offsetValue) {
        records = records.slice(this.offsetValue);
      }
      if (this.limitValue) {
        records = records.slice(0, this.limitValue);
      }

      // Project columns if specified
      if (this.selectColumns.length > 0) {
        records = records.map((r) => {
          const projected: Record<string, unknown> = {};
          for (const col of this.selectColumns) {
            projected[col] = r[col];
          }
          return projected;
        });
      }

      if (this.isSingle) {
        return {
          data: (records[0] as T) || null,
          error: null,
        };
      }

      return {
        data: records as T[],
        error: null,
        count: records.length,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }
}

/**
 * Insert builder class
 */
class MockInsertBuilder<T> {
  private table: string;
  private data: Partial<T> | Partial<T>[];
  private shouldSelect = false;
  private isSingle = false;

  constructor(table: string, data: Partial<T> | Partial<T>[]) {
    this.table = table;
    this.data = data;
  }

  select(): this {
    this.shouldSelect = true;
    return this;
  }

  single(): this {
    this.isSingle = true;
    return this;
  }

  async then<TResult>(
    onfulfilled?: ((value: QueryResultMany<T> | QueryResult<T>) => TResult | PromiseLike<TResult>) | null
  ): Promise<TResult> {
    const result = await this.execute();
    return onfulfilled ? onfulfilled(result) : (result as unknown as TResult);
  }

  private async execute(): Promise<QueryResultMany<T> | QueryResult<T>> {
    const store = getMockStore();

    try {
      const dataArray = Array.isArray(this.data) ? this.data : [this.data];
      const inserted = store.insertMany<Record<string, unknown>>(this.table, dataArray);

      if (this.isSingle || !Array.isArray(this.data)) {
        return {
          data: (inserted[0] as T) || null,
          error: null,
        };
      }

      return {
        data: inserted as T[],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }
}

/**
 * Update builder class
 */
class MockUpdateBuilder<T> {
  private table: string;
  private data: Partial<T>;
  private filters: { column: string; value: unknown }[] = [];
  private isSingle = false;

  constructor(table: string, data: Partial<T>) {
    this.table = table;
    this.data = data;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, value });
    return this;
  }

  select(): this {
    return this;
  }

  single(): this {
    this.isSingle = true;
    return this;
  }

  async then<TResult>(
    onfulfilled?: ((value: QueryResultMany<T> | QueryResult<T>) => TResult | PromiseLike<TResult>) | null
  ): Promise<TResult> {
    const result = await this.execute();
    return onfulfilled ? onfulfilled(result) : (result as unknown as TResult);
  }

  private async execute(): Promise<QueryResultMany<T> | QueryResult<T>> {
    const store = getMockStore();

    try {
      // Find matching records
      let records = store.select<Record<string, unknown>>(this.table);
      for (const filter of this.filters) {
        records = records.filter((r) => r[filter.column] === filter.value);
      }

      // Update each matching record
      const updated: Record<string, unknown>[] = [];
      for (const record of records) {
        const result = store.update(this.table, record.id as string, this.data as Record<string, unknown>);
        if (result) updated.push(result);
      }

      if (this.isSingle) {
        return {
          data: (updated[0] as T) || null,
          error: null,
        };
      }

      return {
        data: updated as T[],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }
}

/**
 * Delete builder class
 */
class MockDeleteBuilder {
  private table: string;
  private filters: { column: string; value: unknown }[] = [];

  constructor(table: string) {
    this.table = table;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, value });
    return this;
  }

  async then<TResult>(
    onfulfilled?: ((value: { error: Error | null }) => TResult | PromiseLike<TResult>) | null
  ): Promise<TResult> {
    const result = await this.execute();
    return onfulfilled ? onfulfilled(result) : (result as unknown as TResult);
  }

  private async execute(): Promise<{ error: Error | null }> {
    const store = getMockStore();

    try {
      for (const filter of this.filters) {
        store.deleteWhere(this.table, filter.column, filter.value);
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }
}

/**
 * Mock Auth class
 */
class MockAuth {
  private currentSession: MockSession | null = null;
  private currentUser: MockAuthUser | null = null;

  constructor() {
    this.loadSession();
  }

  private loadSession(): void {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const { session, user } = JSON.parse(stored);
        this.currentSession = session;
        this.currentUser = user;
      } catch {
        // Ignore parse errors
      }
    }
  }

  private saveSession(): void {
    if (typeof window === 'undefined') return;
    if (this.currentSession && this.currentUser) {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ session: this.currentSession, user: this.currentUser })
      );
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  async signUp(credentials: {
    email: string;
    password: string;
    options?: { data?: { first_name?: string; last_name?: string; phone?: string } };
  }): Promise<{ data: { user: MockAuthUser | null; session: MockSession | null }; error: Error | null }> {
    const store = getMockStore();

    // Check if user already exists
    const existing = store.select<Record<string, any>>('users', { column: 'email', value: credentials.email });
    if (existing.length > 0) {
      return {
        data: { user: null, session: null },
        error: new Error('User already exists'),
      };
    }

    // Create user in store
    const firstName = credentials.options?.data?.first_name || 'New';
    const lastName = credentials.options?.data?.last_name || 'User';
    const phone = credentials.options?.data?.phone || null;

    const newUser = store.insert<Record<string, any>>('users', {
      email: credentials.email,
      first_name: firstName,
      last_name: lastName,
      role: 'customer',
      phone: phone,
      avatar_url: null,
      preferences: {},
    });

    const authUser: MockAuthUser = {
      id: newUser.id,
      email: newUser.email,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    };

    const session: MockSession = {
      access_token: `mock_token_${generateId()}`,
      refresh_token: `mock_refresh_${generateId()}`,
      expires_at: Date.now() + 3600000,
      user: authUser,
    };

    this.currentUser = authUser;
    this.currentSession = session;
    this.saveSession();

    return {
      data: { user: authUser, session },
      error: null,
    };
  }

  async signInWithPassword(credentials: {
    email: string;
    password: string;
  }): Promise<{ data: { user: MockAuthUser | null; session: MockSession | null }; error: Error | null }> {
    const store = getMockStore();

    // Find user
    const users = store.select<Record<string, any>>('users', { column: 'email', value: credentials.email });
    if (users.length === 0) {
      return {
        data: { user: null, session: null },
        error: new Error('Invalid login credentials'),
      };
    }

    const user = users[0];

    // In mock mode, accept any password
    const authUser: MockAuthUser = {
      id: user.id,
      email: user.email,
      user_metadata: {
        first_name: user.first_name,
        last_name: user.last_name,
      },
    };

    const session: MockSession = {
      access_token: `mock_token_${generateId()}`,
      refresh_token: `mock_refresh_${generateId()}`,
      expires_at: Date.now() + 3600000,
      user: authUser,
    };

    this.currentUser = authUser;
    this.currentSession = session;
    this.saveSession();

    return {
      data: { user: authUser, session },
      error: null,
    };
  }

  async signOut(): Promise<{ error: Error | null }> {
    this.currentUser = null;
    this.currentSession = null;
    this.saveSession();
    return { error: null };
  }

  async getSession(): Promise<{ data: { session: MockSession | null }; error: Error | null }> {
    return {
      data: { session: this.currentSession },
      error: null,
    };
  }

  async getUser(): Promise<{ data: { user: MockAuthUser | null }; error: Error | null }> {
    return {
      data: { user: this.currentUser },
      error: null,
    };
  }

  async resetPasswordForEmail(email: string, options?: { redirectTo?: string }): Promise<{ error: Error | null }> {
    console.log(`[Mock] Password reset email sent to: ${email}`);
    if (options?.redirectTo) {
      console.log(`[Mock] Reset link would redirect to: ${options.redirectTo}`);
    }
    return { error: null };
  }

  async updateUser(attributes: { password?: string; email?: string; data?: Record<string, any> }): Promise<{ data: { user: MockAuthUser | null }; error: Error | null }> {
    if (!this.currentUser) {
      return {
        data: { user: null },
        error: new Error('Not authenticated'),
      };
    }

    // In mock mode, just update the session (password updates don't persist)
    console.log(`[Mock] User update requested:`, attributes);

    // Update user metadata if provided
    if (attributes.data) {
      this.currentUser.user_metadata = {
        ...this.currentUser.user_metadata,
        ...attributes.data,
      };
    }

    // Update email if provided
    if (attributes.email) {
      this.currentUser.email = attributes.email;
    }

    // Password updates are logged but not stored in mock mode
    if (attributes.password) {
      console.log(`[Mock] Password would be updated for user: ${this.currentUser.email}`);
    }

    this.saveSession();

    return {
      data: { user: this.currentUser },
      error: null,
    };
  }

  onAuthStateChange(
    callback: (event: string, session: MockSession | null) => void
  ): { data: { subscription: { unsubscribe: () => void } } } {
    // Initial callback
    callback(this.currentSession ? 'SIGNED_IN' : 'SIGNED_OUT', this.currentSession);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            // No-op for mock
          },
        },
      },
    };
  }
}

/**
 * Create mock Supabase client
 */
export function createMockClient() {
  const auth = new MockAuth();

  return {
    auth,

    from<T>(table: string) {
      return {
        select(columns = '*') {
          const builder = new MockQueryBuilder<T>(table);
          return builder.select(columns);
        },
        insert(data: Partial<T> | Partial<T>[]) {
          return new MockInsertBuilder<T>(table, data);
        },
        update(data: Partial<T>) {
          return new MockUpdateBuilder<T>(table, data);
        },
        delete() {
          return new MockDeleteBuilder(table);
        },
        upsert(data: Partial<T> | Partial<T>[]) {
          // For simplicity, upsert acts like insert in mock
          return new MockInsertBuilder<T>(table, data);
        },
      };
    },

    // Storage mock (basic implementation)
    storage: {
      from(bucket: string) {
        return {
          async upload(path: string, file: File) {
            console.log(`[Mock Storage] Uploading to ${bucket}/${path}`);
            return {
              data: { path: `${bucket}/${path}` },
              error: null,
            };
          },
          getPublicUrl(path: string) {
            return {
              data: { publicUrl: `/mock-storage/${bucket}/${path}` },
            };
          },
          async remove(paths: string[]) {
            console.log(`[Mock Storage] Removing from ${bucket}:`, paths);
            return { data: paths, error: null };
          },
        };
      },
    },

    // RPC (Remote Procedure Call) mock
    async rpc(
      functionName: string,
      params: Record<string, unknown> = {}
    ): Promise<{ data: unknown; error: Error | null }> {
      const store = getMockStore();

      // Handle increment_banner_clicks RPC function
      if (functionName === 'increment_banner_clicks') {
        const bannerId = params.banner_id as string;

        // Find the banner
        const banner = store.promoBanners.find((b) => b.id === bannerId);

        if (!banner) {
          return {
            data: null,
            error: new Error('Banner not found or not active'),
          };
        }

        if (!banner.is_active) {
          return {
            data: null,
            error: new Error('Banner not found or not active'),
          };
        }

        // Atomically increment click_count
        banner.click_count += 1;
        banner.updated_at = new Date().toISOString();

        console.log(
          `[Mock RPC] Incremented click count for banner ${bannerId} to ${banner.click_count}`
        );

        return {
          data: banner.click_count,
          error: null,
        };
      }

      // Unknown RPC function
      return {
        data: null,
        error: new Error(`RPC function '${functionName}' not implemented in mock`),
      };
    },
  };
}

export type MockSupabaseClient = ReturnType<typeof createMockClient>;
