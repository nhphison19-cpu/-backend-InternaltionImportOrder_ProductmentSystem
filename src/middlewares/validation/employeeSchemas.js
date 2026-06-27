const { z } = require('zod');

const createEmployeeSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  department: z.string().optional(),
  role: z.enum(['ADMIN', 'APPROVER', 'STAFF']).optional(),
});

const updateEmployeeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  department: z.string().optional(),
  role: z.enum(['ADMIN', 'APPROVER', 'STAFF']).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  department: z.string().optional(),
  role: z.enum(['ADMIN', 'APPROVER', 'STAFF']).optional(),
  search: z.string().optional(),
});

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
  changePasswordSchema,
  listEmployeesQuerySchema,
};