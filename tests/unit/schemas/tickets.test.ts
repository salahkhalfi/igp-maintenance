import { describe, it, expect } from 'vitest';
import { createTicketSchema, updateTicketSchema, ticketIdParamSchema } from '../../../src/schemas/tickets';

describe('Ticket Schemas', () => {
  describe('createTicketSchema', () => {
    it('should validate correct ticket creation data', () => {
      const validData = {
        title: 'Machine en panne',
        description: 'La machine fait un bruit anormal',
        reporter_name: 'Jean Dupont',
        machine_id: 1,
        priority: 'high'
      };
      
      const result = createTicketSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept all priority levels', () => {
      const priorities = ['low', 'medium', 'high', 'critical'];
      
      for (const priority of priorities) {
        const validData = {
          title: 'Test ticket',
          reporter_name: 'Tester',
          machine_id: 1,
          priority
        };
        
        const result = createTicketSchema.safeParse(validData);
        expect(result.success).toBe(true);
      }
    });

    it('should accept optional assigned_to', () => {
      const validData = {
        title: 'Ticket assigné',
        reporter_name: 'Jean',
        machine_id: 1,
        priority: 'medium',
        assigned_to: 5
      };
      
      const result = createTicketSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept optional scheduled_date', () => {
      const validData = {
        title: 'Ticket planifié',
        reporter_name: 'Jean',
        machine_id: 1,
        priority: 'medium',
        scheduled_date: '2025-12-25T10:00:00'
      };
      
      const result = createTicketSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject title shorter than 3 characters', () => {
      const invalidData = {
        title: 'AB',
        reporter_name: 'Jean',
        machine_id: 1,
        priority: 'medium'
      };
      
      const result = createTicketSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('3 caractères');
      }
    });

    it('should reject title longer than 200 characters', () => {
      const invalidData = {
        title: 'A'.repeat(201),
        reporter_name: 'Jean',
        machine_id: 1,
        priority: 'medium'
      };
      
      const result = createTicketSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('trop long');
      }
    });

    it('should reject invalid priority', () => {
      const invalidData = {
        title: 'Test ticket',
        reporter_name: 'Jean',
        machine_id: 1,
        priority: 'invalid_priority'
      };
      
      const result = createTicketSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      // Zod returns error for invalid enum value
      if (!result.success) {
        const msg = result.error.issues[0].message;
        expect(msg.includes('Invalid') || msg.includes('invalide')).toBe(true);
      }
    });

    it('should reject missing machine_id', () => {
      const invalidData = {
        title: 'Test ticket',
        reporter_name: 'Jean',
        priority: 'medium'
      };
      
      const result = createTicketSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should coerce string machine_id to number', () => {
      const validData = {
        title: 'Test ticket',
        reporter_name: 'Jean',
        machine_id: '5',  // String instead of number
        priority: 'medium'
      };
      
      const result = createTicketSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.machine_id).toBe(5);
        expect(typeof result.data.machine_id).toBe('number');
      }
    });

    it('should default is_machine_down to false', () => {
      const validData = {
        title: 'Test ticket',
        reporter_name: 'Jean',
        machine_id: 1,
        priority: 'medium'
      };
      
      const result = createTicketSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_machine_down).toBe(false);
      }
    });
  });

  describe('updateTicketSchema', () => {
    it('should validate partial update data', () => {
      const validData = {
        status: 'in_progress'
      };
      
      const result = updateTicketSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept multiple fields update', () => {
      const validData = {
        title: 'Updated title',
        priority: 'critical',
        assigned_to: 3,
        comment: 'Updated by admin'
      };
      
      const result = updateTicketSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty object (no update)', () => {
      const validData = {};
      
      const result = updateTicketSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow nullable assigned_to (unassign)', () => {
      const validData = {
        assigned_to: null
      };
      
      const result = updateTicketSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('ticketIdParamSchema', () => {
    it('should validate positive integer ID', () => {
      const validData = { id: 123 };
      
      const result = ticketIdParamSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should coerce string ID to number', () => {
      const validData = { id: '456' };
      
      const result = ticketIdParamSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(456);
      }
    });

    it('should reject zero ID', () => {
      const invalidData = { id: 0 };
      
      const result = ticketIdParamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative ID', () => {
      const invalidData = { id: -5 };
      
      const result = ticketIdParamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer ID', () => {
      const invalidData = { id: 12.5 };
      
      const result = ticketIdParamSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
