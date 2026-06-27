const ProductService = require('../services/ProductService')
const {asyncHandler} = require('../middlewares/asyncHandler')
const { success, created, paginated, sendError } = require('../utils/helpers/responseHelper'); 


class ProductController {

    createProduct = asyncHandler(async(req , res) =>{ 
        const result = await ProductService.createProduct(req.body)
        return created(res , {message : 'create success Product ' ,data : result})
    })
    updateProduct = asyncHandler(async(req  , res) => {
        const result = await ProductService.updateProduct(req.params.id , req.body)
        return success(res , {message : 'update success Product' , data : result})
    })
    getdetail = asyncHandler(async(req , res) => {
        const result = await ProductService.getdetail(req.params.id)
        return success(res , {message : 'detail success Product' , data : result})
    })
    getall = asyncHandler(async(req , res) =>{
        const { page = 1 , limit = 10 , search = ''} = req.query
        const result = await ProductService.getall({page , limit ,search })
        return paginated(res, {message : 'All Product Information Success ' ,
            data : result.data ,
            page : result.page ,
            limit : result.limit ,
            total : result.total
        })
    })
    deleteProduct = asyncHandler(async(req , res) =>{
        await ProductService.deleteProduct(req.params.id)
        return success(res , {message : 'delete Product success' })
    })  
    deleteSort = asyncHandler(async(req, res)=> {
        await ProductService.deleteSort(req.params.id)
        return success(res , {message : ' Product moved to trash' })
    })
    restore = asyncHandler(async(req, res)=>{
        await ProductService.restore(req.params.id)
        return success(res , {message : ' Product restored succeccfully' })

    })
    
}

module.exports = new ProductController()