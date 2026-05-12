const { Sequelize } = require('sequelize');
require('dotenv').config();

// Sequelize CLI için config nesnesi
const config = {
    development: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        dialectOptions: {
            ssl: false,
            statement_timeout: 10000,
            idle_in_transaction_session_timeout: 10000
        },
        timezone: '+03:00'
    }
};

// Mevcut sequelize bağlantısı
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        dialectOptions: {
            ssl: process.env.NODE_ENV === 'production' ? {
                require: true,
                rejectUnauthorized: false
            } : false,
            statement_timeout: 10000,
            idle_in_transaction_session_timeout: 10000
        },
        timezone: '+03:00'
    }
);

// Bağlantı testi
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Veritabanı bağlantısı başarılı.');
    } catch (error) {
        console.error('Veritabanı bağlantı hatası:', error);
        process.exit(1);
    }
};

testConnection();

module.exports = sequelize;
module.exports.config = config; // Sequelize CLI için config'i export ediyoruz 