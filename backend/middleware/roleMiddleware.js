// Belirli rollere sahip kullanıcıların erişimini kontrol eden middleware
module.exports = (roles = []) => {
  // Tek bir rol string olarak geçilebilir
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    // Auth middleware'den gelen kullanıcı rolünü kontrol et
    if (!req.userId || !req.userRole) {
      return res.status(401).json({ 
        success: false, 
        message: 'Erişim reddedildi. Kimlik doğrulama gerekli' 
      });
    }

    // Rol kontrolü (boş dizi tüm rollere izin verir)
    if (roles.length && !roles.includes(req.userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bu işlemi gerçekleştirmek için yetkiniz yok' 
      });
    }

    next();
  };
}; 