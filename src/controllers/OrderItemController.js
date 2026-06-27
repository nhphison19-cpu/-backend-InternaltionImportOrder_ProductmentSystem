const OrderItemService = require('../services/OrderItemService')
const { asyncHandler } = require('../middlewares/asyncHandler')
const { success, created } = require('../utils/helpers/responseHelper')

class OrderItemController {

    addItem = asyncHandler(async(req , res) => {
        const result = await OrderItemService.addItem(req.params.orderId , req.body)
        return created(res , {message : 'create success order item' , data : result})
    })
    updateItem = asyncHandler(async(req , res) => {
        const result = await OrderItemService.updateItem(req.params.id , req.body)
        return success(res , {message : 'update success order item' , data : result})
    })
    removeItem = asyncHandler(async(req , res) => {
        await OrderItemService.removeItem(req.params.id)
        return success(res , {message : 'order item delete success'})
    })
    getByOrder = asyncHandler(async(req , res) => {
        const result = await OrderItemService.getByOrder(req.params.orderId)
        return success(res , {message : 'order item information all' , data : result})
    })
    receiveQty = asyncHandler(async(req , res) => {
        const result = await OrderItemService.receiveQty(req.params.id , req.body.receivedQty)
        return success(res , {message : 'order item received qty updated' , data : result})
    })
}

module.exports = new OrderItemController()
