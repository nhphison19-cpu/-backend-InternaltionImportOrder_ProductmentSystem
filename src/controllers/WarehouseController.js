const WarehouseService = require('../services/WarehouseService')
const {asyncHandler} = require('../middlewares/asyncHandler')
const { success, created, paginated, sendError } = require('../utils/helpers/responseHelper'); 


class WarehouseController {

     createWarehouse = asyncHandler(async(req , res) => {
        const result = await WarehouseService.createWarehouse(req.body)
        return created(res , {message : 'create success warehouse' , data : result})
     })
     updateWarehouse = asyncHandler(async(req,  res)=> {
        const WarehouseId = req.params.id 
        const result = await WarehouseService.updateWarehouse(WarehouseId , req.body)
        return success(res , {  message : 'update success Warehouser ' , data : result})
     })
     getDetails = asyncHandler(async (req , res)=> {
        const result = await WarehouseService.getDetails(req.params.id)
        return success(res , {message : 'information warehouse success' , data : result})
     })
     getAll = asyncHandler(async(req , res) =>{
        const {page = 1 , limit = 10 , search = ''} = req.query
        const result = await WarehouseService.getAll({page  , limit  , search})
        return paginated( res , { message : 'warehouse information all success' , 
            data : result.data , 
            page : result.page , 
            limit : result.limit  , 
            total : result.total})
     })
     deleteWare = asyncHandler( async(req, res)=>{
        const WarehouseId = req.params.id
        await WarehouseService.deleteWare(WarehouseId)
        return success(res ,{message : 'Delete Warehouse success' })
     })
    softDelete = asyncHandler(async(req, res) => {
    const { id } = req.params;
    await WarehouseService.softDelete(id);
    return success(res, { message: 'Warehouse moved to trash' });
    });
    restore = asyncHandler(async ( req, res) => {
        const { id} = req.params
        await WarehouseService.restore(id)
        return success(res, { message: 'Warehouse restored successfully' });
    })
}

module.exports = new WarehouseController()