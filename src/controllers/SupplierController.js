const SupplierService = require('../services/SupplierService')
const {asyncHandler} = require('../middlewares/asyncHandler')
const { success, created, paginated, sendError } = require('../utils/helpers/responseHelper'); 
const { supplier } = require('../config/prisma');

class SupplierController  {

    createSupplier = asyncHandler(async(req , res) => {
        const result = await SupplierService.createSupplier(req.body)
        return created(res, { message: 'Supplier  created successfully', data: result })
    })
    updateSupplier = asyncHandler(async(req , res) => {
        const idSupplier = req.params.id    
        const result = await SupplierService.updateSupplier( idSupplier, req.body)
        return success(res, { message: 'Supplier updated', data: result });

    })
    getDetail = asyncHandler(async(req , res) => {
        const idSupplier = req.params.id
        const result = await SupplierService.getDetail( idSupplier)
        return success(res , {message : 'success supplier information ' , data : result})
    })
    getAll = asyncHandler(async(req , res) => {
        const { page = 1, limit = 10, search } = req.query;
        const result  = await SupplierService.getAll({page , limit , search}) 
        return paginated(res , {
            message : 'Supplier infomation all ' ,
            data : result.data ,
            page : result.page ,
            limit : result.limit ,
            total : result.total
        })
    })
    deleteSupplier = asyncHandler(async(req, res) => {
        const idSupplier = req.params.id
        await SupplierService.deleteSupplier(idSupplier)
        return success(res , {message : 'supplier delete success ' })
    })
    deleteSort = asyncHandler(async(req , res) =>{
        await SupplierService.deleteSort(req.params.id)
        return success(res , {message : 'supplier  moved to trash' })
    })
    restore = asyncHandler(async(req, res)=>{
        await SupplierService.restore(req.params.id)
        return success(res , {message : 'supplier   restored successfully' })
       
    })
}

module.exports = new SupplierController()