const ImportDocumentService = require('../services/ImportDocumentService')
const { asyncHandler } = require('../middlewares/asyncHandler')
const { success, created, paginated } = require('../utils/helpers/responseHelper')

class ImportDocumentController {

    uploadDocument = asyncHandler(async(req , res) => {
        const result = await ImportDocumentService.uploadDocument(req.params.orderId , req.body)
        return created(res , {message : 'upload success import document' , data : result})
    })
    getDetail = asyncHandler(async(req , res) => {
        const result = await ImportDocumentService.getDetail(req.params.id)
        return success(res , {message : 'import document information detail' , data : result})
    })
    getByOrder = asyncHandler(async(req , res) => {
        const result = await ImportDocumentService.getByOrder(req.params.orderId)
        return success(res , {message : 'import document information by order' , data : result})
    })
    getAll = asyncHandler(async(req , res) => {
        const { page = 1 , limit = 10 , type } = req.query
        const result = await ImportDocumentService.getAll({page , limit , type})
        return paginated(res , {
            message : 'import document information all' ,
            data : result.data ,
            page : result.page ,
            limit : result.limit ,
            total : result.total
        })
    })
    deleteDocument = asyncHandler(async(req , res) => {
        await ImportDocumentService.deleteDocument(req.params.id)
        return success(res , {message : 'import document delete success'})
    })
}

module.exports = new ImportDocumentController()
