// services/employeeService.js
const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const { AppError } = require('../middlewares/errorHandler');
const { revokeAllForEmployee } = require('./tokenService');
const {RedisClient, RedisBullMQ} = require('../config/redisConfig')
const { getOrSetCache, deleteCache } = require('../utils/helpers/cacheHelper')

const EMPLOYEE_CACHE_TTL = 300 // 5 minutes
const employeeCacheKey = (id) => `employee:${id}`


const SALT_ROUNDS = 12;

const PUBLIC_FIELDS = {
  id: true,
  name: true,
  email: true,
  department: true,
  role: true,
};
class employeeService {
  static  async  createEmployee({ name, email, password, department, role }) {
          const existing = await prisma.employee.findUnique({ where: { email } });
          if (existing) throw new AppError('An employee with this email already exists', 409);

          const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

          const employee = await prisma.employee.create({
            data: { name,
                    email, 
                    password : passwordHash, 
                    department, 
                    role: role || 'STAFF' 
                  },
            select: PUBLIC_FIELDS,
          });

          return employee;
        }

       static async  listEmployees({ page = 1, limit = 20, department, role, search }) {
          const where = {
            ...(department ? { department } : {}),
            ...(role ? { role } : {}),
            ...(search
              ? {
                  OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                  ],
                }
              : {}),
          };

          const [employees, total] = await Promise.all([
            prisma.employee.findMany({
              where,
              select: PUBLIC_FIELDS,
              skip: (page - 1) * limit,
              take: limit,
              orderBy: { name: 'asc' },
            }),
            prisma.employee.count({ where }),
          ]);

          return { employees, total };
        }

       static async  getEmployeeById(id) {
          return getOrSetCache(
            employeeCacheKey(id),
            async () => {
              const employee = await prisma.employee.findUnique({
                where: { id }, select: PUBLIC_FIELDS
              });
              if (!employee) throw new AppError('Employee not found', 404);
              return employee;
            },
            EMPLOYEE_CACHE_TTL
          );
        }

      static  async  updateEmployee(id, { name, department, role }) {
          await this.getEmployeeById(id);

          const employee = await prisma.employee.update({
            where: { id },
            data: {
              ...(name !== undefined ? { name } : {}),
              ...(department !== undefined ? { department } : {}),
              ...(role !== undefined ? { role } : {}),
            },
            select: PUBLIC_FIELDS,
          });

          await deleteCache(employeeCacheKey(id));

          return employee;
        }

      static  async  changePassword(id, { currentPassword, newPassword }) {
          const employee = await prisma.employee.findUnique({ where: { id } });
          if (!employee) 
            throw new AppError('Employee not found', 404);

          const valid = await bcrypt.compare(currentPassword, employee.password);
          if (!valid) throw new AppError('Current password is incorrect', 401);

          const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
          await prisma.employee.update({ where: { id }, data: { password : passwordHash } });

          await deleteCache(employeeCacheKey(id));
          await revokeAllForEmployee(id);
        }

      static  async  deleteEmployee(id) {
          await this.getEmployeeById(id);
          await prisma.$transaction([
            prisma.refreshToken.deleteMany({ where: { employeeId: id } }),
            prisma.employee.delete({ where: { id } }),
          ]);
          await deleteCache(employeeCacheKey(id));
        }
      }

module.exports = employeeService