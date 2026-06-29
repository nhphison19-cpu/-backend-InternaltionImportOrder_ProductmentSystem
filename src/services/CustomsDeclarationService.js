const prisma = require('../config/prisma')
const { AppError } = require('../middlewares/errorHandler')
const { getOrSetCache, deleteCache, deleteCacheByPattern } = require('../utils/helpers/cacheHelper')

const TTL = 300
const detailKey = (id) => `customsDeclaration:${id}`
const byOrderKey = (orderId) => `customsDeclaration:order:${orderId}`

class CustomsDeclarationService {
    static async createDeclaration(orderId , data) {
        const order = await prisma.importOrder.findUnique({ where : { id : orderId } })
        if(!order) {
            throw new AppError('Import order is not found' , 404)
        }
        const exists = await prisma.customsDeclaration.findUnique({ where : { declarationNo : data.declarationNo } })
        if(exists) {
            throw new AppError('Declaration No đã tồn tại' , 400)
        }
        const created = await prisma.customsDeclaration.create({
            data : {
                orderId ,
                declarationNo : data.declarationNo ,
                declaredValue : data.declaredValue ,
                dutyAmount : data.dutyAmount || 0 ,
                vatAmount : data.vatAmount || 0 ,
                customsOfficer : data.customsOfficer ,
            }
        })
        await deleteCache(byOrderKey(orderId))
        await deleteCacheByPattern('customsDeclaration:list:*')
        return created
    }
    static async updateDeclaration(id , data) {
        const declaration = await prisma.customsDeclaration.findUnique({ where : { id } })
        if(!declaration) {
            throw new AppError('Customs declaration is not found' , 404)
        }
        const updated = await prisma.customsDeclaration.update({
            where : { id } ,
            data : {
                declaredValue : data.declaredValue ,
                dutyAmount : data.dutyAmount ,
                vatAmount : data.vatAmount ,
                status : data.status ,
                clearanceDate : data.status === 'CLEARED' ? (data.clearanceDate || new Date()) : data.clearanceDate ,
                customsOfficer : data.customsOfficer ,
            }
        })
        await deleteCache(detailKey(id))
        await deleteCache(byOrderKey(declaration.orderId))
        await deleteCacheByPattern('customsDeclaration:list:*')
        return updated
    }
    static async getDetail(id) {
        return getOrSetCache(detailKey(id), async () => {
            const declaration = await prisma.customsDeclaration.findUnique({
                where : { id } ,
                include : { order : true }
            })
            if(!declaration) {
                throw new AppError('Customs declaration is not found' , 404)
            }
            return declaration
        }, TTL)
    }
    static async getByOrder(orderId) {
        return getOrSetCache(byOrderKey(orderId), async () => {
            return await prisma.customsDeclaration.findMany({
                where : { orderId } ,
                orderBy : { createdAt : 'desc' }
            })
        }, TTL)
    }
    static async getAll({page = 1 , limit = 10 , status , search = ''}) {
        const p = parseInt(page)
        const l = parseInt(limit)
        return getOrSetCache(`customsDeclaration:list:${p}:${l}:${status || ''}:${search}`, async () => {
            const skip = (p-1)*l
            const where = {
                ...(status ? { status } : {}) ,
                ...(search ? { declarationNo : { contains : search , mode : 'insensitive' } } : {})
            }
            const [data , total] = await Promise.all([
                prisma.customsDeclaration.findMany({
                    where ,
                    skip ,
                    take : l ,
                    orderBy : { createdAt : 'desc' } ,
                    include : { order : true }
                }) ,
                prisma.customsDeclaration.count({ where })
            ])
            return { data , total , page : p , limit : l }
        }, TTL)
    }
}

module.exports = CustomsDeclarationService
