const { asyncHandler } = require('../middlewares/asyncHandler');
const { success, created, paginated } = require('../utils/helpers/responseHelper');
const employeeService = require('../services/EmployeeService');

const createEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.createEmployee(req.body , req.user || null);
  created(res, { message: 'Employee created successfully', data: employee });
});

const listEmployees = asyncHandler(async (req, res) => {
  const { page, limit, department, role, search } = req.query;
  const { employees, total } = await employeeService.listEmployees({ page, limit, department, role, search });
  paginated(res, { message: 'Employees retrieved', data: employees, page, limit, total });
});

const getEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.getEmployeeById(req.params.id);
  success(res, { message: 'Employee retrieved', data: employee });
});

const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.updateEmployee(req.params.id, req.body);
  success(res, { message: 'Employee updated', data: employee });
});

const changePassword = asyncHandler(async (req, res) => {
  await employeeService.changePassword(req.params.id, req.body);
  success(res, { message: 'Password changed. All sessions have been logged out.' });
});

const deleteEmployee = asyncHandler(async (req, res) => {
  await employeeService.deleteEmployee(req.params.id);
  success(res, { message: 'Employee deleted' });
});

module.exports = {
  createEmployee,
  listEmployees,
  getEmployee,
  updateEmployee,
  changePassword,
  deleteEmployee,
};