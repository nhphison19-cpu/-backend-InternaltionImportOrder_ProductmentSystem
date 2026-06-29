const prisma = require('../config/prisma')
const { AppError } = require('../middlewares/errorHandler');
const { getOrSetCache, deleteCache, deleteCacheByPattern } = require('../utils/helpers/cacheHelper')

const PRODUCT_TTL = 300
const productKey = (id) => `product:${id}`
const productListKey = (page, limit, search) => `product:list:${page}:${limit}:${search}`

class ProductService {
    static async createProduct(data) {
        const exists = await prisma.product.findUnique({
            where : {
                OR : [
                    { name : data.name},
                    {sku  : data.sku}
                ]
            }
        })
        if(exists) {
            throw new AppError('Product name or sku đã tồn tại ' , 401)
        }
        const product = await prisma.product.create({
            data : data
        })
        await deleteCacheByPattern('product:list:*')
        return product
    }
    static async updateProduct( id,data) {
        const product = await prisma.product.findUnique({
            where : {
                id : id
            }
        })
        if(product===null) {
            throw new AppError('Product is not found ',404)
        }
        const updated = await prisma.product.update({
            where : {
                id : id
            },
            data : data
        })
        await deleteCache(productKey(id))
        await deleteCacheByPattern('product:list:*')
        return updated
    }
    static async getdetail(id ){
        return getOrSetCache(productKey(id), async () => {
            const product = await prisma.product.findUnique({
                where : {id  : id}
            })
            if(product === null ) {
                throw new AppError('Product is not found' , 404)
            }
            return product
        }, PRODUCT_TTL)
    }
    static async getall({page = 1 , limit = 10 , search =''}) {
        const P = parseInt(page)
        const L = parseInt(limit)
        return getOrSetCache(productListKey(P, L, search), async () => {
            const skip = (P-1)*L
            const Where = { 
                deleteAt : null ,
                ...(search? {
                    OR: [ {name : {contains : search , mode : 'insensitive'} } ,
                        {sku : {contains : search , mode : 'insensitive'}}
                     ]
                } : {} )

            }
            const [data , total ] = await  Promise.all([
                prisma.product.findMany({
                    Where , 
                    take : L ,
                    skip ,
                    orderBy : { createdAt : 'desc'}
                }) ,
                prisma.product.count({Where})
            ])

            return {data , total  , page : P , limit :L  }
        }, PRODUCT_TTL)
    }
    static async deleteProduct(id) {
        const product = await prisma.product.findUnique({
            where : {
                id : id
            }
        })
        if(product === null) {
            throw new AppError('product is not found' , 404)
        }
        const deleted = await prisma.product.delete({
            where :{ 
                id : id
            } ,
            data : {
                deleteAt : new Date()
            }
        })
        await deleteCache(productKey(id))
        await deleteCacheByPattern('product:list:*')
        return deleted
    }
    static async deleteSort(id) {
         const product = await prisma.product.findUnique({
            where : {
                id : id
            }
        })
        if(product === null) {
            throw new AppError('product is not found' , 404)
        }
        const updated = await prisma.product.update({
            where :{ 
                id : id
            } ,
            data : {
                isActive : false 
            }
        })
        await deleteCache(productKey(id))
        await deleteCacheByPattern('product:list:*')
        return updated
    }
    static async restore(id) {
         const product = await prisma.product.findUnique({
            where : {
                id : id
            }
        })
        if(product === null) {
            throw new AppError('product is not found' , 404)
        }
        const updated = await prisma.product.update({
            where :{ 
                id : id
            } ,
            data : {
                isActive : true 
            }
        })
        await deleteCache(productKey(id))
        await deleteCacheByPattern('product:list:*')
        return updated
    }
}
module.exports = ProductService
