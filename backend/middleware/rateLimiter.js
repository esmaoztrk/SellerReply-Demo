const rateLimit = require('express-rate-limit');

// Genel API rate limiter
exports.apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 dakika
  max: 100, // IP başına 15 dakikada maksimum 100 istek
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin'
  }
});

// Giriş işlemleri için rate limiter - Geliştirme için daha gevşek ayarlar
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika (1 saat yerine)
  max: 10, // IP başına 15 dakikada maksimum 10 başarısız giriş denemesi (5 yerine)
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Başarılı istekleri sayma
  message: {
    success: false,
    message: 'Çok fazla başarısız giriş denemesi, lütfen daha sonra tekrar deneyin'
  }
});

// Kayıt işlemleri için rate limiter - Geliştirme için daha gevşek ayarlar
exports.registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat (24 saat yerine)
  max: 5, // IP başına 1 saatte maksimum 5 kayıt (3 yerine)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Çok fazla kayıt denemesi, lütfen daha sonra tekrar deneyin'
  }
}); 