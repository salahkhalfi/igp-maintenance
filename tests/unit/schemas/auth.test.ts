import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from '../../../src/schemas/auth';

describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept rememberMe option', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true
      };
      
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123'
      };
      
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email invalide');
      }
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: ''
      };
      
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Mot de passe requis');
      }
    });

    it('should reject missing email', () => {
      const invalidData = {
        password: 'password123'
      };
      
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'newuser@example.com',
        password: 'securepass123',
        first_name: 'Jean',
        role: 'technician'
      };
      
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept optional last_name', () => {
      const validData = {
        email: 'newuser@example.com',
        password: 'securepass123',
        first_name: 'Jean',
        last_name: 'Dupont',
        role: 'operator'
      };
      
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        email: 'newuser@example.com',
        password: 'short',
        first_name: 'Jean',
        role: 'technician'
      };
      
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('8 caractères');
      }
    });

    it('should reject first_name shorter than 2 characters', () => {
      const invalidData = {
        email: 'newuser@example.com',
        password: 'securepass123',
        first_name: 'J',
        role: 'technician'
      };
      
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Prénom trop court');
      }
    });

    it('should reject missing role', () => {
      const invalidData = {
        email: 'newuser@example.com',
        password: 'securepass123',
        first_name: 'Jean'
      };
      
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
