const CustomsDeclarationService = require('../services/CustomsDeclarationService')
const { asyncHandler } = require('../middlewares/asyncHandler')
const { success, created, paginated } = require('../utils/helpers/responseHelper')

class CustomsDeclarationController {

    createDeclaration = asyncHandler(async(req , res) => {
        const result = await CustomsDeclarationService.createDeclaration(req.params.orderId , req.body)
        return created(res , {message : 'create success customs declaration' , data : result})
    })
    updateDeclaration = asyncHandler(async(req , res) => {
        const result = await CustomsDeclarationService.updateDeclaration(req.params.id , req.body)
        return success(res , {message : 'update success customs declaration' , data : result})
    })
    getDetail = asyncHandler(async(req , res) => {
        const result = await CustomsDeclarationService.getDetail(req.params.id)
        return success(res , {message : 'customs declaration information detail' , data : result})
    })
    getByOrder = asyncHandler(async(req , res) => {
        const result = await CustomsDeclarationService.getByOrder(req.params.orderId)
        return success(res , {message : 'customs declaration information by order' , data : result})
    })
    getAll = asyncHandler(async(req , res) => {
        const { page = 1 , limit = 10 , status , search = '' } = req.query
        const result = await CustomsDeclarationService.getAll({page , limit , status , search})
        return paginated(res , {
            message : 'customs declaration information all' ,
            data : result.data ,
            page : result.page ,
            limit : result.limit ,
            total : result.total
        })
    })
}

module.exports = new CustomsDeclarationController()
