const PaymentService = require('../services/PaymentService')
const { asyncHandler } = require('../middlewares/asyncHandler')
const { success, created, paginated } = require('../utils/helpers/responseHelper')

class PaymentController {

    createPayment = asyncHandler(async(req , res) => {
        const result = await PaymentService.createPayment(req.params.orderId , req.body)
        return created(res , {message : 'create success payment' , data : result})
    })
    updatePayment = asyncHandler(async(req , res) => {
        const result = await PaymentService.updatePayment(req.params.id , req.body)
        return success(res , {message : 'update success payment' , data : result})
    })
    markPaid = asyncHandler(async(req , res) => {
        const result = await PaymentService.markPaid(req.params.id , req.body.paidAt)
        return success(res , {message : 'payment marked as paid' , data : result})
    })
    getDetail = asyncHandler(async(req , res) => {
        const result = await PaymentService.getDetail(req.params.id)
        return success(res , {message : 'payment information detail' , data : result})
    })
    getByOrder = asyncHandler(async(req , res) => {
        const result = await PaymentService.getByOrder(req.params.orderId)
        return success(res , {message : 'payment information by order' , data : result})
    })
    getAll = asyncHandler(async(req , res) => {
        const { page = 1 , limit = 10 , status } = req.query
        const result = await PaymentService.getAll({page , limit , status})
        return paginated(res , {
            message : 'payment information all' ,
            data : result.data ,
            page : result.page ,
            limit : result.limit ,
            total : result.total
        })
    })
}

module.exports = new PaymentController()
