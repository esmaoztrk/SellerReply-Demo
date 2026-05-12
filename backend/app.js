require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
var path = require('path');
const logger = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const sequelize = require('./config/database');
const User = require('./models/User');
const authRoutes = require('./routes/auth');
const { apiLimiter, loginLimiter, registerLimiter } = require('./middleware/rateLimiter');
const marketplaceRoutes = require('./routes/marketplaces');
const aiRoutes = require('./routes/ai');

// Veritabanı bağlantısı
require('./models/index');

const app = express();

// CORS ayarları - Çevresel değişkenlerden frontend URL'sini al
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Güvenlik middleware'leri
app.use(helmet()); // Güvenlik başlıkları
app.use(compression()); // Yanıt sıkıştırma
app.use(express.static(path.join(__dirname, 'public')));
// Middleware
app.use(cors({
  origin: FRONTEND_URL, // 1. Wildcard (*) KULLANILAMAZ, spesifik bir origin belirtilmeli
  credentials: true,    // 2. Bu ayar mutlaka true olmalı
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(logger('dev'));
app.use(express.json({ limit: '1mb' })); // JSON body boyut limiti
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());

// Rate limiter'ları önce tanımla
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth', apiLimiter);

// Sonra auth rotalarını ekle
app.use('/api/auth', authRoutes);

// Diğer rotalar
app.use('/api/marketplaces', apiLimiter);
app.use('/api/marketplaces', marketplaceRoutes);
app.use('/api/ai', apiLimiter);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Kaynak bulunamadı'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Sunucu hatası' 
      : err.message
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Veritabanı senkronizasyonu
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true }); // alter: true, tabloları günceller
    console.log('Veritabanı senkronize edildi');
  } catch (error) {
    console.error('Veritabanı senkronizasyon hatası:', error);
    process.exit(1);
  }
};

syncDatabase();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM sinyali alındı. Server kapatılıyor...');
  server.close(() => {
    console.log('Server kapatıldı');
    sequelize.close();
    process.exit(0);
  });
});

module.exports = app; 