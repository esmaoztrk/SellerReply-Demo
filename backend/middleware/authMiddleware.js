const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Token'ı al (önce cookie'den, yoksa Authorization header'dan)
    let token = req.cookies.auth_token;
    
    if (!token && req.headers.authorization) {
      // Bearer token formatı: "Bearer [token]"
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Erişim reddedildi. Kimlik doğrulama gerekli' 
      });
    }

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Kullanıcıyı kontrol et
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz token' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Hesabınız devre dışı bırakılmış' 
      });
    }

    // Kullanıcı ID'sini request nesnesine ekle
    req.userId = decoded.id;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Oturum süresi doldu. Lütfen tekrar giriş yapın' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz token' 
      });
    }
    
    console.error('Auth middleware hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası' 
    });
  }
}; 