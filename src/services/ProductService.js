const prisma = require('../config/prisma')
const { AppError } = require('../middlewares/errorHandler');

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
        return await prisma.product.update({
            where : {
                id : id
            },
            data : data
        })
    }
    static async getdetail(id ){
        const product = await prisma.product.findUnique({
            where : {id  : id}
        })
        if(product === null ) {
            throw new AppError('Product is not found' , 404)
        }
        return product
    }
    static async getall({page = 1 , limit = 10 , search =''}) {
        const P = parseInt(page)
        const L = parseInt(limit)
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
        return await prisma.product.delete({
            where :{ 
                id : id
            } ,
            data : {
                deleteAt : new Date()
            }
        })
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
        return await prisma.product.update({
            where :{ 
                id : id
            } ,
            data : {
                isActive : false 
            }
        })
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
        return await prisma.product.update({
            where :{ 
                id : id
            } ,
            data : {
                isActive : true 
            }
        })
    }
}