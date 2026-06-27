const { validationResult } = require('express-validator');

// Đặt cuối mỗi chain validator (sau các body()/param()...).
// Đọc kết quả các rule phía trước, nếu có lỗi thì trả 400 kèm danh sách lỗi
// theo từng field; nếu hợp lệ thì next() để chạy tiếp controller.
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

// Custom validator tái sử dụng: kiểm tra field hiện tại (ngày) phải SAU
// một field ngày khác trong cùng request body.
// Dùng trong .custom(): body('expectedDelivery').custom(isAfterField('expectedDelivery', 'orderDate'))
function isAfterField(currentField, earlierField) {
  return (value, { req }) => {
    const earlierValue = req.body[earlierField];
    if (!value || !earlierValue) return true; // để @notEmpty/@optional ở field đó tự xử lý bắt buộc
    if (new Date(value).getTime() <= new Date(earlierValue).getTime()) {
      throw new Error(`${currentField} phải sau ${earlierField}`);
    }
    return true;
  };
}

module.exports = { handleValidationErrors, isAfterField };
