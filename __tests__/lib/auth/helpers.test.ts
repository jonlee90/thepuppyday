/**
 * Unit tests for auth helper functions
 * Task 0280: Test authentication utilities with edge cases
 */

import {
  isAdminOrStaff,
  isOwner,
  isStaff,
} from '@/lib/admin/auth';

import type { UserRole } from '@/types/database';

describe('isAdminOrStaff', () => {
  it('returns true for admin role', () => {
    expect(isAdminOrStaff('admin')).toBe(true);
  });

  it('returns true for groomer role', () => {
    expect(isAdminOrStaff('groomer')).toBe(true);
  });

  it('returns false for customer role', () => {
    expect(isAdminOrStaff('customer')).toBe(false);
  });

  it('handles all valid roles', () => {
    const roles: UserRole[] = ['admin', 'groomer', 'customer'];

    const results = roles.map((role) => isAdminOrStaff(role));

    expect(results).toEqual([true, true, false]);
  });
});

describe('isOwner', () => {
  it('returns true for admin role', () => {
    expect(isOwner('admin')).toBe(true);
  });

  it('returns false for groomer role', () => {
    expect(isOwner('groomer')).toBe(false);
  });

  it('returns false for customer role', () => {
    expect(isOwner('customer')).toBe(false);
  });

  it('only admin has owner privileges', () => {
    const roles: UserRole[] = ['admin', 'groomer', 'customer'];

    const results = roles.map((role) => isOwner(role));

    expect(results).toEqual([true, false, false]);
  });
});

describe('isStaff', () => {
  it('returns true for groomer role', () => {
    expect(isStaff('groomer')).toBe(true);
  });

  it('returns false for admin role', () => {
    expect(isStaff('admin')).toBe(false);
  });

  it('returns false for customer role', () => {
    expect(isStaff('customer')).toBe(false);
  });

  it('only groomer is considered staff', () => {
    const roles: UserRole[] = ['admin', 'groomer', 'customer'];

    const results = roles.map((role) => isStaff(role));

    expect(results).toEqual([false, true, false]);
  });
});

describe('Role Authorization Matrix', () => {
  it('defines clear authorization levels', () => {
    // Admin has highest privileges
    expect(isAdminOrStaff('admin')).toBe(true);
    expect(isOwner('admin')).toBe(true);
    expect(isStaff('admin')).toBe(false);

    // Groomer has staff privileges
    expect(isAdminOrStaff('groomer')).toBe(true);
    expect(isOwner('groomer')).toBe(false);
    expect(isStaff('groomer')).toBe(true);

    // Customer has no admin privileges
    expect(isAdminOrStaff('customer')).toBe(false);
    expect(isOwner('customer')).toBe(false);
    expect(isStaff('customer')).toBe(false);
  });

  it('provides mutually exclusive role checks', () => {
    // A user can only be one role at a time
    const roles: UserRole[] = ['admin', 'groomer', 'customer'];

    roles.forEach((role) => {
      const checks = [isOwner(role), isStaff(role)];
      const trueCount = checks.filter((c) => c === true).length;

      // Only one or zero checks should be true
      expect(trueCount).toBeLessThanOrEqual(1);
    });
  });
});

describe('Edge Cases', () => {
  it('handles role checks consistently', () => {
    // Verify that role checks are deterministic
    expect(isAdminOrStaff('admin')).toBe(isAdminOrStaff('admin'));
    expect(isOwner('groomer')).toBe(isOwner('groomer'));
    expect(isStaff('customer')).toBe(isStaff('customer'));
  });

  it('role functions are pure (no side effects)', () => {
    // Call functions multiple times, should return same result
    const role: UserRole = 'admin';

    expect(isAdminOrStaff(role)).toBe(true);
    expect(isAdminOrStaff(role)).toBe(true);
    expect(isAdminOrStaff(role)).toBe(true);
  });
});

describe('Security Implications', () => {
  it('prevents privilege escalation via role check bypass', () => {
    // Customer should never pass admin checks
    expect(isAdminOrStaff('customer')).toBe(false);
    expect(isOwner('customer')).toBe(false);

    // Groomer should not have owner access
    expect(isOwner('groomer')).toBe(false);
  });

  it('enforces strict role boundaries', () => {
    // Verify there's no overlap where customer could be mistaken for staff
    const customerRole: UserRole = 'customer';

    expect(isAdminOrStaff(customerRole)).toBe(false);
    expect(isOwner(customerRole)).toBe(false);
    expect(isStaff(customerRole)).toBe(false);
  });

  it('validates owner-only operations are protected', () => {
    // Only admin should pass owner check
    const roles: UserRole[] = ['admin', 'groomer', 'customer'];

    const ownerAccess = roles.filter((role) => isOwner(role));

    expect(ownerAccess).toEqual(['admin']);
    expect(ownerAccess).toHaveLength(1);
  });
});

describe('Role-Based Access Control (RBAC)', () => {
  it('implements hierarchical access levels', () => {
    // Admin > Groomer > Customer (in terms of privileges)

    // Admin has all staff privileges
    expect(isAdminOrStaff('admin')).toBe(true);

    // Groomer has staff privileges but not owner
    expect(isAdminOrStaff('groomer')).toBe(true);
    expect(isOwner('groomer')).toBe(false);

    // Customer has no elevated privileges
    expect(isAdminOrStaff('customer')).toBe(false);
  });

  it('supports different access patterns', () => {
    // Pattern 1: Allow admin and staff (appointments, report cards)
    const canAccessAppointments = (role: UserRole) => isAdminOrStaff(role);

    expect(canAccessAppointments('admin')).toBe(true);
    expect(canAccessAppointments('groomer')).toBe(true);
    expect(canAccessAppointments('customer')).toBe(false);

    // Pattern 2: Owner only (analytics, settings)
    const canAccessSettings = (role: UserRole) => isOwner(role);

    expect(canAccessSettings('admin')).toBe(true);
    expect(canAccessSettings('groomer')).toBe(false);
    expect(canAccessSettings('customer')).toBe(false);

    // Pattern 3: Staff only (report card creation)
    const canCreateReportCard = (role: UserRole) => isStaff(role);

    expect(canCreateReportCard('admin')).toBe(false); // Admin might not create reports
    expect(canCreateReportCard('groomer')).toBe(true);
    expect(canCreateReportCard('customer')).toBe(false);
  });
});

describe('Type Safety', () => {
  it('accepts all valid UserRole values', () => {
    const validRoles: UserRole[] = ['admin', 'groomer', 'customer'];

    // All should execute without type errors
    validRoles.forEach((role) => {
      expect(() => isAdminOrStaff(role)).not.toThrow();
      expect(() => isOwner(role)).not.toThrow();
      expect(() => isStaff(role)).not.toThrow();
    });
  });

  it('returns boolean for all inputs', () => {
    const roles: UserRole[] = ['admin', 'groomer', 'customer'];

    roles.forEach((role) => {
      expect(typeof isAdminOrStaff(role)).toBe('boolean');
      expect(typeof isOwner(role)).toBe('boolean');
      expect(typeof isStaff(role)).toBe('boolean');
    });
  });
});

describe('Performance', () => {
  it('executes role checks efficiently', () => {
    const iterations = 10000;
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      isAdminOrStaff('admin');
      isOwner('groomer');
      isStaff('customer');
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete very quickly (< 10ms for 10000 iterations)
    expect(duration).toBeLessThan(10);
  });

  it('has constant time complexity', () => {
    // All role checks should be simple comparisons
    const roles: UserRole[] = ['admin', 'groomer', 'customer'];

    roles.forEach((role) => {
      const start = performance.now();
      isAdminOrStaff(role);
      const end = performance.now();

      // Each check should be nearly instantaneous
      expect(end - start).toBeLessThan(1);
    });
  });
});

describe('Documentation and Intent', () => {
  it('clearly defines admin/staff boundary', () => {
    // Admin and groomer are both "staff" in broader sense
    expect(isAdminOrStaff('admin')).toBe(true);
    expect(isAdminOrStaff('groomer')).toBe(true);

    // But admin is specifically "owner"
    expect(isOwner('admin')).toBe(true);
    expect(isOwner('groomer')).toBe(false);
  });

  it('distinguishes between operational and administrative roles', () => {
    // Groomer = operational staff (performs grooming, creates reports)
    expect(isStaff('groomer')).toBe(true);

    // Admin = administrative role (manages settings, analytics)
    expect(isOwner('admin')).toBe(true);

    // Customer = end user
    expect(isAdminOrStaff('customer')).toBe(false);
  });
});

describe('Real-World Authorization Scenarios', () => {
  it('scenario: viewing appointments list', () => {
    // Both admin and groomers can view appointments
    const canViewAppointments = (role: UserRole) => isAdminOrStaff(role);

    expect(canViewAppointments('admin')).toBe(true);
    expect(canViewAppointments('groomer')).toBe(true);
    expect(canViewAppointments('customer')).toBe(false);
  });

  it('scenario: modifying business settings', () => {
    // Only owner can modify settings
    const canModifySettings = (role: UserRole) => isOwner(role);

    expect(canModifySettings('admin')).toBe(true);
    expect(canModifySettings('groomer')).toBe(false);
    expect(canModifySettings('customer')).toBe(false);
  });

  it('scenario: creating report cards', () => {
    // Groomers create report cards, admin might not
    const canCreateReportCard = (role: UserRole) => isStaff(role);

    expect(canCreateReportCard('admin')).toBe(false);
    expect(canCreateReportCard('groomer')).toBe(true);
    expect(canCreateReportCard('customer')).toBe(false);
  });

  it('scenario: viewing analytics dashboard', () => {
    // Only owner can view analytics
    const canViewAnalytics = (role: UserRole) => isOwner(role);

    expect(canViewAnalytics('admin')).toBe(true);
    expect(canViewAnalytics('groomer')).toBe(false);
    expect(canViewAnalytics('customer')).toBe(false);
  });

  it('scenario: managing customer accounts', () => {
    // Both admin and staff can manage customers
    const canManageCustomers = (role: UserRole) => isAdminOrStaff(role);

    expect(canManageCustomers('admin')).toBe(true);
    expect(canManageCustomers('groomer')).toBe(true);
    expect(canManageCustomers('customer')).toBe(false);
  });
});
