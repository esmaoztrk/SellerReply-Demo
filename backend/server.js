const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const sequelize = require('./config/database');
const http = require('http');

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL'iniz
  credentials: true // Çerezleri frontend'e göndermek için
}));

// Routes
app.use('/api/auth', require('./routes/auth'));

let server;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Veritabanı bağlantısı başarılı.');

    const PORT = process.env.PORT || 5000;
    server = http.createServer(app);
    
    server.timeout = 120000;
    server.keepAliveTimeout = 65000;
    
    server.listen(PORT, () => {
      console.log(`Server ${PORT} portunda çalışıyor (${process.env.NODE_ENV || 'development'} modu)`);
    });
    
    server.on('error', (error) => {
      console.error('Server hatası:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} zaten kullanımda`);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Başlatma hatası:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  console.log(`${signal} sinyali alındı, uygulama kapatılıyor...`);
  
  if (server) {
    server.close(async () => {
      console.log('HTTP sunucusu kapatıldı');
      
      try {
        await sequelize.close();
        console.log('Veritabanı bağlantısı kapatıldı');
        process.exit(0);
      } catch (error) {
        console.error('Veritabanı kapatma hatası:', error);
        process.exit(1);
      }
    });
    
    setTimeout(() => {
      console.error('Graceful shutdown zaman aşımı, zorla kapatılıyor');
      process.exit(1);
    }, 30000);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  console.error('Yakalanmamış istisna:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('İşlenmeyen promise reddi:', reason);
});

startServer(); 