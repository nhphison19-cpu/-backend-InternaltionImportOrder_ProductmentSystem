const InventoryService = require('../services/InventoryService')
const { asyncHandler } = require('../middlewares/asyncHandler')
const { success, paginated } = require('../utils/helpers/responseHelper')

class InventoryController {

    getAll = asyncHandler(async(req , res) => {
        const { page = 1 , limit = 10 , warehouseId , productId } = req.query
        const result = await InventoryService.getAll({page , limit , warehouseId , productId})
        return paginated(res , {
            message : 'inventory information all' ,
            data : result.data ,
            page : result.page ,
            limit : result.limit ,
            total : result.total
        })
    })
    getByWarehouse = asyncHandler(async(req , res) => {
        const result = await InventoryService.getByWarehouse(req.params.warehouseId)
        return success(res , {message : 'inventory information by warehouse' , data : result})
    })
    getByProduct = asyncHandler(async(req , res) => {
        const result = await InventoryService.getByProduct(req.params.productId)
        return success(res , {message : 'inventory information by product' , data : result})
    })
    getOne = asyncHandler(async(req , res) => {
        const result = await InventoryService.getOne(req.params.warehouseId , req.params.productId)
        return success(res , {message : 'inventory information detail' , data : result})
    })
}

module.exports = new InventoryController()
