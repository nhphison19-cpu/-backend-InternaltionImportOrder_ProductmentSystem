const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const hashPassword = (password) => {
    return bcrypt.hashSync(password, SALT_ROUNDS);
};

const comparePassword = (password, hashedPassword) => {
    return bcrypt.compareSync(password, hashedPassword);
};

const excludeFields = (obj, keysToExclude) => {
    return Object.fromEntries(
        Object.entries(obj).filter(([key]) => !keysToExclude.includes(key))
    );
};

module.exports = { hashPassword, comparePassword, excludeFields };