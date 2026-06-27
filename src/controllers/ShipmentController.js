const ShipmentService = require('../services/ShipmentService')
const { asyncHandler } = require('../middlewares/asyncHandler')
const { success, created, paginated } = require('../utils/helpers/responseHelper')

class ShipmentController {

    createShipment = asyncHandler(async(req , res) => {
        const result = await ShipmentService.createShipment(req.params.orderId , req.body)
        return created(res , {message : 'create success shipment' , data : result})
    })
    updateShipment = asyncHandler(async(req , res) => {
        const result = await ShipmentService.updateShipment(req.params.id , req.body)
        return success(res , {message : 'update success shipment' , data : result})
    })
    getDetail = asyncHandler(async(req , res) => {
        const result = await ShipmentService.getDetail(req.params.id)
        return success(res , {message : 'shipment information detail' , data : result})
    })
    getByOrder = asyncHandler(async(req , res) => {
        const result = await ShipmentService.getByOrder(req.params.orderId)
        return success(res , {message : 'shipment information by order' , data : result})
    })
    getAll = asyncHandler(async(req , res) => {
        const { page = 1 , limit = 10 , status } = req.query
        const result = await ShipmentService.getAll({page , limit , status})
        return paginated(res , {
            message : 'shipment information all' ,
            data : result.data ,
            page : result.page ,
            limit : result.limit ,
            total : result.total
        })
    })
    deleteShipment = asyncHandler(async(req , res) => {
        await ShipmentService.deleteShipment(req.params.id)
        return success(res , {message : 'shipment delete success'})
    })
}

module.exports = new ShipmentController()
