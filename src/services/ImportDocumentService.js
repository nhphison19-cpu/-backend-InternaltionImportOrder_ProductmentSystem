const prisma = require('../config/prisma')
const { AppError } = require('../middlewares/errorHandler')

class ImportDocumentService {
    static async uploadDocument(orderId , data) {
        const order = await prisma.importOrder.findUnique({ where : { id : orderId } })
        if(!order) {
            throw new AppError('Import order is not found' , 404)
        }
        return await prisma.importDocument.create({
            data : {
                orderId ,
                type : data.type ,
                fileUrl : data.fileUrl ,
                issuedDate : data.issuedDate ,
            }
        })
    }
    static async getDetail(id) {
        const document = await prisma.importDocument.findUnique({
            where : { id } ,
            include : { order : true }
        })
        if(!document) {
            throw new AppError('Import document is not found' , 404)
        }
        return document
    }
    static async getByOrder(orderId) {
        return await prisma.importDocument.findMany({
            where : { orderId } ,
            orderBy : { uploadedAt : 'desc' }
        })
    }
    static async getAll({page = 1 , limit = 10 , type}) {
        const p = parseInt(page)
        const l = parseInt(limit)
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
    }
    static async deleteDocument(id) {
        const document = await prisma.importDocument.findUnique({ where : { id } })
        if(!document) {
            throw new AppError('Import document is not found' , 404)
        }
        return await prisma.importDocument.delete({ where : { id } })
    }
}

module.exports = ImportDocumentService
