const {RedisClient} = require('../../config/redisConfig')

const invalidateUserCache = async (userID) =>{
    await RedisClient.del(`auth:user:${userID}`)
}

module.exports = {invalidateUserCache}