const prisma = require('../config/prisma')
const { AppError } = require('../middlewares/errorHandler')
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
        return await prisma.warehouse.update({
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
    }
    static async getDetails(id) {
    const warehouse = await prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) throw new AppError('Warehouse not found', 404);
    return warehouse;
    }   
    static async getAll({ page, limit, search }) {
    const skip = (page - 1) * limit;
    const where = search ? {
        OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }]
    } : {};

    const [data, total] = await Promise.all([
        prisma.warehouse.findMany({ where, skip, take: parseInt(limit) }),
        prisma.warehouse.count({ where })
    ]);

    return { data, page, limit, total };
    }
    static async softDelete(id) {
        const warehouse = await prisma.warehouse.findUnique({
            where : {id : id }
        })
        if(warehouse == null ){
            throw new AppError('Warehouse is not found' , 404)
        }
        return await prisma.warehouse.update({
            where: { id },
            data: { isActive: false }
        });
    }
    static async restore(id) {
        const warehouse = await prisma.warehouse.findUnique({ where: { id } });
        if (!warehouse) throw new AppError('Warehouse not found', 404);

        return await prisma.warehouse.update({
            where: { id },
            data: { isActive: true }
        });
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
        return await prisma.warehouse.delete({
            where : {id : id}
        })
    }
}
module.exports = WarehouseService