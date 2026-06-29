const prisma = require('../config/prisma')
const { AppError } = require('../middlewares/errorHandler')
const { getOrSetCache, deleteCache, deleteCacheByPattern } = require('../utils/helpers/cacheHelper')

const WAREHOUSE_TTL = 300
const warehouseKey = (id) => `warehouse:${id}`
const PUBLIC_FIELDS = {
    code : true ,
    name :true ,
    address : true ,
    country  : true ,
    isActive : true ,
}

class WarehouseService {

    static async createWarehouse(data) {
        const exists = await prisma.warehouse.findUnique({
            where : {
                OR : [
                    {name : data.name } ,
                    {code : data.code}
                ]
            }
        })
        if(exists) {
            throw new AppError('Warehouse name or code đã tồn tại ' , 400 )

        }
        const warehouse = await prisma.warehouse.create({
            data : {
                code : data.code ,
                name :data.name ,
                address : data.address ,
                country  : data.country,
             }
        })
        await deleteCacheByPattern('warehouse:list:*')
        return warehouse
    } 
    static async updateWarehouse(id , data) {
        const warehouse = await prisma.warehouse.findUnique({
            where : {
                id : id
            }
        })
        if(warehouse == null ){
            throw new AppError('Warehouse is not found ' , 404)
        }
        if(data.code ||data.name){
            const duplicate = await prisma.warehouse.findFirst({
                where : {
                    AND : [
                        {OR : [{name : data.name } , {code : data.code}]} ,
                        {id : { NOT : id }}
                    ]
                }
                
            })
            if (duplicate) {
                throw new AppError('Warehouse name or code already taken by another record', 400);
            }
        }
        const updated = await prisma.warehouse.update({
            where : {
                id : id
            } ,
           data : {
                code : data.code ,
                name :data.name ,
                address : data.address ,
                country  : data.country,
            }
        })
        await deleteCache(warehouseKey(id))
        await deleteCacheByPattern('warehouse:list:*')
        return updated
    }
    static async getDetails(id) {
    return getOrSetCache(warehouseKey(id), async () => {
        const warehouse = await prisma.warehouse.findUnique({ where: { id } });
        if (!warehouse) throw new AppError('Warehouse not found', 404);
        return warehouse;
    }, WAREHOUSE_TTL)
    }   
    static async getAll({ page, limit, search }) {
    return getOrSetCache(`warehouse:list:${page}:${limit}:${search || ''}`, async () => {
        const skip = (page - 1) * limit;
        const where = search ? {
            OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }]
        } : {};

        const [data, total] = await Promise.all([
            prisma.warehouse.findMany({ where, skip, take: parseInt(limit) }),
            prisma.warehouse.count({ where })
        ]);

        return { data, page, limit, total };
    }, WAREHOUSE_TTL)
    }
    static async softDelete(id) {
        const warehouse = await prisma.warehouse.findUnique({
            where : {id : id }
        })
        if(warehouse == null ){
            throw new AppError('Warehouse is not found' , 404)
        }
        const updated = await prisma.warehouse.update({
            where: { id },
            data: { isActive: false }
        });
        await deleteCache(warehouseKey(id))
        await deleteCacheByPattern('warehouse:list:*')
        return updated;
    }
    static async restore(id) {
        const warehouse = await prisma.warehouse.findUnique({ where: { id } });
        if (!warehouse) throw new AppError('Warehouse not found', 404);

        const updated = await prisma.warehouse.update({
            where: { id },
            data: { isActive: true }
        });
        await deleteCache(warehouseKey(id))
        await deleteCacheByPattern('warehouse:list:*')
        return updated;
    }
    static async deleteWare (id) {
        const warehouse = await prisma.warehouse.findUnique({ where: { id } });
        if (!warehouse) throw new AppError('Warehouse not found', 404);
        const hasOrders = await prisma.importOrder.findFirst({
            where : {
                warehouseId : id
            }

        })
        if(hasOrders) {
            throw new AppError('Cannot delete  : this warehouse has associated orders')
        }
        const deleted = await prisma.warehouse.delete({
            where : {id : id}
        })
        await deleteCache(warehouseKey(id))
        await deleteCacheByPattern('warehouse:list:*')
        return deleted
    }
}
module.exports = WarehouseService