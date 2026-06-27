const ImportOrderService = require('../services/ImportOrderService')
const { asyncHandler } = require('../middlewares/asyncHandler');
const { success, created, paginated } = require('../utils/helpers/responseHelper');

class ImportOrderController {

    createIO = asyncHandler(async(req , res ) => {
        const result = await ImportOrderService.createIO(req.body , req.user.id)
        return created(res , {message  : 'create success import order ' , data : result})
    })
    updateIO = asyncHandler(async(req , res) => {
        const result = await ImportOrderService.updateIO(req.params.id , req.body)
        return success(res , {message : 'update success import order' , data : result})
    })
    getById = asyncHandler(async (req, res) => {
        const result = await ImportOrderService.getById(req.params.id);
        return success(res, { message : 'success import order information' , data: result });
    });
    getAll = asyncHandler(async (req, res) => {
        const {page = 1 , limit = 10 , search = '' , status , supplierId} = req.query
        const result = await ImportOrderService.getAll({page , limit , search , status , supplierId});
        return paginated(res, {
            message : 'import order information all' ,
            data : result.data ,
            page : result.page ,
            limit : result.limit ,
            total : result.total
        });
    });
    updateStatus = asyncHandler(async (req, res) => {
        const result = await ImportOrderService.updateStatus(req.params.id, req.body.status , req.user.id);
        return success(res, { message: 'Status updated successfully', data: result });
    });
    recalculateTotals = asyncHandler(async(req , res) => {
        const result = await ImportOrderService.recalculateTotals(req.params.id)
        return success(res, { message: 'Totals recalculated successfully', data: result });
    })
}

module.exports = new ImportOrderController()
