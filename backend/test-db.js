require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: console.log
    }
);

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Veritabanı bağlantısı başarılı!');
        
        // Veritabanı sürümünü kontrol et
        const [results] = await sequelize.query('SELECT version()');
        console.log('PostgreSQL sürümü:', results[0].version);
        
    } catch (error) {
        console.error('Bağlantı hatası:', error);
    } finally {
        await sequelize.close();
    }
}

testConnection(); 