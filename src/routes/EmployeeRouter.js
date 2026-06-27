const express = require('express');
const router = express.Router();

const employeeController = require('../controllers/EmployeeController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validate, validateQuery } = require('../middlewares/validate'); // see note below
const {
  createEmployeeSchema,
  updateEmployeeSchema,
  changePasswordSchema,
  listEmployeesQuerySchema,
} = require('../middlewares/validation/employeeSchemas');



router.post('/create', validate(createEmployeeSchema), employeeController.createEmployee);
router.use(authenticate)
router.get('/list', authorize('ADMIN', 'APPROVER'), validateQuery(listEmployeesQuerySchema), employeeController.listEmployees);
router.get('/getdetail/:id', employeeController.getEmployee);
router.patch('/update/:id', authorize('ADMIN'), validate(updateEmployeeSchema), employeeController.updateEmployee);
router.patch('/change/:id/password', validate(changePasswordSchema), employeeController.changePassword);
router.delete('/delete/:id', authorize('ADMIN'), employeeController.deleteEmployee);

module.exports = router;