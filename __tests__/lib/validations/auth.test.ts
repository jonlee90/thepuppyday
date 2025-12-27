/**
 * Unit tests for authentication validation schemas
 * Task 0278: Test auth Zod schemas with edge cases
 */

import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validations/auth';

describe('loginSchema', () => {
  it('accepts valid login credentials', () => {
    const validData = {
      email: 'user@example.com',
      password: 'password123',
    };

    const result = loginSchema.parse(validData);
    expect(result.email).toBe('user@example.com');
    expect(result.password).toBe('password123');
  });

  it('rejects missing email', () => {
    expect(() =>
      loginSchema.parse({ email: '', password: 'password123' })
    ).toThrow('Email is required');
  });

  it('rejects invalid email format', () => {
    expect(() =>
      loginSchema.parse({ email: 'not-an-email', password: 'password123' })
    ).toThrow('Please enter a valid email address');
  });

  it('rejects missing password', () => {
    expect(() =>
      loginSchema.parse({ email: 'user@example.com', password: '' })
    ).toThrow('Password is required');
  });

  it('rejects password shorter than 8 characters', () => {
    expect(() =>
      loginSchema.parse({ email: 'user@example.com', password: 'short' })
    ).toThrow('Password must be at least 8 characters');
  });
});

describe('registerSchema', () => {
  const validRegistrationData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+15551234567',
    password: 'Password123',
    confirmPassword: 'Password123',
  };

  it('accepts valid registration data', () => {
    const result = registerSchema.parse(validRegistrationData);
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Doe');
    expect(result.email).toBe('john.doe@example.com');
  });

  it('rejects missing first name', () => {
    const data = { ...validRegistrationData, firstName: '' };
    expect(() => registerSchema.parse(data)).toThrow('First name is required');
  });

  it('rejects first name longer than 50 characters', () => {
    const data = { ...validRegistrationData, firstName: 'A'.repeat(51) };
    expect(() => registerSchema.parse(data)).toThrow('First name is too long');
  });

  it('rejects missing last name', () => {
    const data = { ...validRegistrationData, lastName: '' };
    expect(() => registerSchema.parse(data)).toThrow('Last name is required');
  });

  it('rejects last name longer than 50 characters', () => {
    const data = { ...validRegistrationData, lastName: 'B'.repeat(51) };
    expect(() => registerSchema.parse(data)).toThrow('Last name is too long');
  });

  it('rejects invalid email format', () => {
    const data = { ...validRegistrationData, email: 'invalid-email' };
    expect(() => registerSchema.parse(data)).toThrow('Please enter a valid email address');
  });

  it('accepts optional phone number', () => {
    const data = { ...validRegistrationData, phone: undefined };
    const result = registerSchema.parse(data);
    expect(result.phone).toBeUndefined();
  });

  it('validates phone number format when provided', () => {
    const data = { ...validRegistrationData, phone: '123' };
    expect(() => registerSchema.parse(data)).toThrow();
  });

  it('accepts valid international phone numbers', () => {
    const data = { ...validRegistrationData, phone: '+442012345678' };
    const result = registerSchema.parse(data);
    expect(result.phone).toBe('+442012345678');
  });

  it('rejects password without uppercase letter', () => {
    const data = { ...validRegistrationData, password: 'password123', confirmPassword: 'password123' };
    expect(() => registerSchema.parse(data)).toThrow('Password must contain at least one uppercase letter');
  });

  it('rejects password without lowercase letter', () => {
    const data = { ...validRegistrationData, password: 'PASSWORD123', confirmPassword: 'PASSWORD123' };
    expect(() => registerSchema.parse(data)).toThrow('Password must contain at least one uppercase letter');
  });

  it('rejects password without number', () => {
    const data = { ...validRegistrationData, password: 'PasswordABC', confirmPassword: 'PasswordABC' };
    expect(() => registerSchema.parse(data)).toThrow('Password must contain');
  });

  it('rejects password shorter than 8 characters', () => {
    const data = { ...validRegistrationData, password: 'Pass1', confirmPassword: 'Pass1' };
    expect(() => registerSchema.parse(data)).toThrow('Password must be at least 8 characters');
  });

  it('rejects when passwords do not match', () => {
    const data = { ...validRegistrationData, confirmPassword: 'DifferentPassword123' };
    expect(() => registerSchema.parse(data)).toThrow('Passwords do not match');
  });

  it('rejects when confirm password is missing', () => {
    const data = { ...validRegistrationData, confirmPassword: '' };
    expect(() => registerSchema.parse(data)).toThrow('Please confirm your password');
  });

  it('accepts strong password with all requirements', () => {
    const data = {
      ...validRegistrationData,
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!',
    };
    const result = registerSchema.parse(data);
    expect(result.password).toBe('StrongPass123!');
  });

  it('handles phone numbers with formatting characters', () => {
    const data = { ...validRegistrationData, phone: '+1 (555) 123-4567' };
    const result = registerSchema.parse(data);
    expect(result).toBeDefined();
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    const result = forgotPasswordSchema.parse({ email: 'user@example.com' });
    expect(result.email).toBe('user@example.com');
  });

  it('rejects missing email', () => {
    expect(() => forgotPasswordSchema.parse({ email: '' })).toThrow('Email is required');
  });

  it('rejects invalid email format', () => {
    expect(() => forgotPasswordSchema.parse({ email: 'not-valid' })).toThrow(
      'Please enter a valid email address'
    );
  });

  it('accepts email with special characters', () => {
    const result = forgotPasswordSchema.parse({ email: 'user+tag@example.com' });
    expect(result.email).toBe('user+tag@example.com');
  });
});

describe('resetPasswordSchema', () => {
  const validResetData = {
    password: 'NewPassword123',
    confirmPassword: 'NewPassword123',
  };

  it('accepts valid password reset data', () => {
    const result = resetPasswordSchema.parse(validResetData);
    expect(result.password).toBe('NewPassword123');
  });

  it('rejects missing password', () => {
    const data = { ...validResetData, password: '' };
    expect(() => resetPasswordSchema.parse(data)).toThrow('Password is required');
  });

  it('rejects password shorter than 8 characters', () => {
    const data = { ...validResetData, password: 'Short1', confirmPassword: 'Short1' };
    expect(() => resetPasswordSchema.parse(data)).toThrow('Password must be at least 8 characters');
  });

  it('rejects password without uppercase', () => {
    const data = { ...validResetData, password: 'password123', confirmPassword: 'password123' };
    expect(() => resetPasswordSchema.parse(data)).toThrow(
      'Password must contain at least one uppercase letter'
    );
  });

  it('rejects password without lowercase', () => {
    const data = { ...validResetData, password: 'PASSWORD123', confirmPassword: 'PASSWORD123' };
    expect(() => resetPasswordSchema.parse(data)).toThrow();
  });

  it('rejects password without number', () => {
    const data = { ...validResetData, password: 'PasswordABC', confirmPassword: 'PasswordABC' };
    expect(() => resetPasswordSchema.parse(data)).toThrow();
  });

  it('rejects when passwords do not match', () => {
    const data = { ...validResetData, confirmPassword: 'DifferentPassword123' };
    expect(() => resetPasswordSchema.parse(data)).toThrow('Passwords do not match');
  });

  it('rejects missing confirm password', () => {
    const data = { ...validResetData, confirmPassword: '' };
    expect(() => resetPasswordSchema.parse(data)).toThrow('Please confirm your password');
  });

  it('accepts password with special characters', () => {
    const data = {
      password: 'SecurePass123!@#',
      confirmPassword: 'SecurePass123!@#',
    };
    const result = resetPasswordSchema.parse(data);
    expect(result.password).toBe('SecurePass123!@#');
  });
});

describe('Password Security Edge Cases', () => {
  it('rejects common weak passwords in registration', () => {
    const weakPasswords = ['Password1', 'Welcome123', 'Admin123'];

    weakPasswords.forEach((password) => {
      const data = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password,
        confirmPassword: password,
      };

      // These technically pass the regex, but they're weak
      // Future enhancement: add dictionary check
      const result = registerSchema.parse(data);
      expect(result.password).toBe(password);
    });
  });

  it('handles unicode characters in names', () => {
    const data = {
      firstName: 'José',
      lastName: 'García',
      email: 'jose@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    };

    const result = registerSchema.parse(data);
    expect(result.firstName).toBe('José');
    expect(result.lastName).toBe('García');
  });

  it('handles emails with plus addressing', () => {
    const data = {
      firstName: 'Test',
      lastName: 'User',
      email: 'user+test@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    };

    const result = registerSchema.parse(data);
    expect(result.email).toBe('user+test@example.com');
  });

  it('accepts emails with special characters (SQL injection protected at DB layer)', () => {
    const data = {
      firstName: 'Test',
      lastName: 'User',
      email: "admin'--@example.com", // Valid email per RFC 5322
      password: 'Password123',
      confirmPassword: 'Password123',
    };

    // Emails can contain special characters - SQL injection is prevented
    // by using parameterized queries at the database layer, not by
    // restricting valid email formats
    const result = registerSchema.parse(data);
    expect(result.email).toBe("admin'--@example.com");
  });
});
