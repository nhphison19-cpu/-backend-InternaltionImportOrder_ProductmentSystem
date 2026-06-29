const prisma = require('../config/prisma')
const { AppError } = require('../middlewares/errorHandler')
const { getOrSetCache, deleteCache, deleteCacheByPattern } = require('../utils/helpers/cacheHelper')

const TTL = 300
const detailKey = (id) => `importDocument:${id}`
const byOrderKey = (orderId) => `importDocument:order:${orderId}`

class ImportDocumentService {
    static async uploadDocument(orderId , data) {
        const order = await prisma.importOrder.findUnique({ where : { id : orderId } })
        if(!order) {
            throw new AppError('Import order is not found' , 404)
        }
        const created = await prisma.importDocument.create({
            data : {
                orderId ,
                type : data.type ,
                fileUrl : data.fileUrl ,
                issuedDate : data.issuedDate ,
            }
        })
        await deleteCache(byOrderKey(orderId))
        await deleteCacheByPattern('importDocument:list:*')
        return created
    }
    static async getDetail(id) {
        return getOrSetCache(detailKey(id), async () => {
            const document = await prisma.importDocument.findUnique({
                where : { id } ,
                include : { order : true }
            })
            if(!document) {
                throw new AppError('Import document is not found' , 404)
            }
            return document
        }, TTL)
    }
    static async getByOrder(orderId) {
        return getOrSetCache(byOrderKey(orderId), async () => {
            return await prisma.importDocument.findMany({
                where : { orderId } ,
                orderBy : { uploadedAt : 'desc' }
            })
        }, TTL)
    }
    static async getAll({page = 1 , limit = 10 , type}) {
        const p = parseInt(page)
        const l = parseInt(limit)
        return getOrSetCache(`importDocument:list:${p}:${l}:${type || ''}`, async () => {
            const skip = (p-1)*l
            const where = { ...(type ? { type } : {}) }
            const [data , total] = await Promise.all([
                prisma.importDocument.findMany({
                    where ,
                    skip ,
                    take : l ,
                    orderBy : { uploadedAt : 'desc' } ,
                    include : { order : true }
                }) ,
                prisma.importDocument.count({ where })
            ])
            return { data , total , page : p , limit : l }
        }, TTL)
    }
    static async deleteDocument(id) {
        const document = await prisma.importDocument.findUnique({ where : { id } })
        if(!document) {
            throw new AppError('Import document is not found' , 404)
        }
        const deleted = await prisma.importDocument.delete({ where : { id } })
        await deleteCache(detailKey(id))
        await deleteCache(byOrderKey(document.orderId))
        await deleteCacheByPattern('importDocument:list:*')
        return deleted
    }
}

module.exports = ImportDocumentService
