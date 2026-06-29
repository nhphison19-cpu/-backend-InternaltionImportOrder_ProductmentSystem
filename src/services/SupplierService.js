const prisma = require('../config/prisma');
const { AppError } = require('../middlewares/errorHandler');
const { getOrSetCache, deleteCache, deleteCacheByPattern } = require('../utils/helpers/cacheHelper')

const TTL = 300
const supplierKey = (id) => `supplier:${id}`

const PUBLIC_FIELDS = {
    code : true , 
    name : true ,
    country : true ,
    address : true , 
    taxId        : true,
    contactName  : true,
    contactEmail : true,
    contactPhone : true,
    bankAccount  : true,
    bankName     : true,
    swiftCode    : true,
    rating       : true,
}

class SupplierService {
    static async createSupplier(data) {
        const exists = await prisma.supplier.findFirst({
           where: {
                    OR: [
                    { code: data.code },
                    { name: data.name }
                    ]
                }
        })
        if(exists) {
                throw new AppError(
                'Supplier code hoặc supplier name đã tồn tại',
                 400
             );
        } 
        const supplierNew = await prisma.supplier.create({
            data : {
                code : data.code , 
                name : data.name ,
                country : data.country ,
                address : data.address , 
                taxId        : data.taxId ,
                contactName  : data.contactName,
                contactEmail : data.contactEmail,
                contactPhone : data.contactPhone,
                bankAccount  : data.bankAccount,
                bankName     : data.bankName,
                swiftCode    : data.swiftCode,
                rating       : data.rating,
            }
        })
        await deleteCacheByPattern('supplier:list:*')
        return supplierNew
    }
    static async updateSupplier(id , data) {
        const supplier = await prisma.supplier.findUnique({
            where : {
                id : id
            }
        })
        if(supplier === null){
            throw new AppError('Supplier is not found ' , 401)
        }
        const updated = await prisma.supplier.update({
            where : {
                id 
            } ,
            data : {
                 code : data.code , 
                name : data.name ,
                country : data.country ,
                address : data.address , 
                taxId        : data.taxId ,
                contactName  : data.contactName,
                contactEmail : data.contactEmail,
                contactPhone : data.contactPhone,
                bankAccount  : data.bankAccount,
                bankName     : data.bankName,
                swiftCode    : data.swiftCode,
                rating       : data.rating,
            }
        })
        await deleteCache(supplierKey(id))
        await deleteCacheByPattern('supplier:list:*')
        return updated
    }
    static async getDetails(id) {
        return getOrSetCache(supplierKey(id), async () => {
            const supplier = await prisma.supplier.findUnique({
                where : {id : id }
            })
            if(supplier == null){
                throw new AppError('Supplier is not found ' , 404)
            }
            return supplier
        }, TTL)
    }
    static async getAll({page = 1 , limit = 10 , search = ''}){
        const p = parseInt(page)
        const l = parseInt(limit)
        return getOrSetCache(`supplier:list:${p}:${l}:${search}`, async () => {
            const skip = (p-1)*l
            const where = {
                 deleteAt :  null ,
                    ...(search ? {
                OR : [
                    { name : { contains : search , mode : 'insensitive'} } , 
                    { code : {contains : search , mode : 'insensitive'}}
                ]
                }: {})
            } 
            const [data  , total] = await Promise.all([
                prisma.supplier.findMany({
                    where , 
                    skip ,
                    take : l ,
                    orderBy : { createdAt : 'desc'}
                }) , 
                prisma.supplier.count({where})
            ])
            return {data , total , page : p , limit : l}
        }, TTL)
    }
    static async deleteSupplier(id) {
        const supplier = await prisma.supplier.findUnique({
            where : {id : id }
        })
        if(supplier == null) {
            throw new AppError('Supplier is not found' , 401)
        }
        const updated = await prisma.supplier.update({
            where : {
                id : id
            } ,
            data : {
                deleteAt : new Date()
            }
        })
        await deleteCache(supplierKey(id))
        await deleteCacheByPattern('supplier:list:*')
        return updated
    }
    static async restore(id) {
         const supplier = await prisma.supplier.findUnique({
            where : {id : id }
        })
        if(supplier == null ){
            throw new AppError('supplier is not found' , 404)
        }
        const updated = await prisma.supplier.update({
            where: { id },
            data: { isActive : true }
        });
        await deleteCache(supplierKey(id))
        await deleteCacheByPattern('supplier:list:*')
        return updated;
    }
    static async deleteSoft(id) {
        const supplier = await prisma.supplier.findUnique({
            where : {id : id }
        })
        if(supplier == null ){
            throw new AppError('supplier is not found' , 404)
        }
        const updated = await prisma.supplier.update({
            where: { id },
            data: { isActive : false }
        });
        await deleteCache(supplierKey(id))
        await deleteCacheByPattern('supplier:list:*')
        return updated;
    }
}

module.exports = SupplierService

