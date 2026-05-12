const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const SecurityManager = require('../services/SecurityManager');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');

// JWT token oluşturma fonksiyonu
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Mail gönderici yapılandırması
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // veya kendi SMTP sunucunuz
  port: 465,
  secure: true,
  auth: {
    user: 'noreply@sellereply.com',
    pass: process.env.SMTP_PASSWORD // .env dosyasında güvenli bir şekilde saklanmalı
  }
});

// Doğrulama kodu oluşturma fonksiyonu
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 haneli kod
};

// Doğrulama e-postası gönderme fonksiyonu
const sendVerificationEmail = async (user, verificationCode) => {
  await transporter.sendMail({
    from: '"SellerReply" <noreply@sellereply.com>',
    to: user.email,
    subject: 'SellerReply - E-posta Doğrulama Kodunuz',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <img src="https://sellereply.com/logo.png" alt="SellerReply Logo" style="max-width: 200px; margin: 20px 0;">
        <h1 style="color: #333;">Hoş Geldiniz!</h1>
        <p style="color: #666; font-size: 16px;">SellerReply'a kayıt olduğunuz için teşekkür ederiz. E-posta adresinizi doğrulamak için aşağıdaki kodu kullanın:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #333;">
            ${verificationCode}
          </div>
        </div>
        <p style="color: #666; font-size: 14px;">Bu kod 30 dakika geçerlidir.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          Bu e-posta SellerReply tarafından otomatik olarak gönderilmiştir. 
          Lütfen bu e-postayı yanıtlamayın.
        </p>
      </div>
    `
  });
};

// Geçici kullanıcı bilgilerini ve son gönderim zamanlarını saklamak için
const tempUsers = new Map();
const lastResendTimes = new Map();

// Kullanıcı kaydı - İlk aşama
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('Yeni kayıt isteği:', email); // Debug log

    // Doğrulama kodu oluştur
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 30 * 60 * 1000);

    // Geçici kullanıcı bilgilerini sakla
    tempUsers.set(email, {
      name,
      email,
      password,
      verificationCode,
      verificationCodeExpires
    });

    console.log('Geçici kullanıcı kaydedildi:', email); // Debug log
    console.log('TempUsers içeriği:', Array.from(tempUsers.keys())); // Debug log

    // Doğrulama e-postası gönder
    try {
      await sendVerificationEmail({ email }, verificationCode);
    } catch (emailError) {
      console.error('E-posta gönderme hatası:', emailError);
      tempUsers.delete(email);
      return res.status(500).json({
        success: false,
        message: 'Doğrulama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin.'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Doğrulama kodu e-posta adresinize gönderildi.'
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin'
    });
  }
};

// Kullanıcı girişi
exports.login = async (req, res) => {
  try {
    // Validasyon hatalarını kontrol et
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validasyon hatası', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Kullanıcıyı bul
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz e-posta veya şifre' 
      });
    }

    // Şifreyi doğrula
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz e-posta veya şifre' 
      });
    }

    // Kullanıcı aktif mi kontrol et
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Hesabınız devre dışı bırakılmış' 
      });
    }

    // E-posta doğrulama kontrolü
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Lütfen önce e-posta adresinizi doğrulayın'
      });
    }

    // Son giriş zamanını güncelle
    await user.update({ lastLogin: new Date() });

    // JWT token oluştur
    const token = generateToken(user.id);

    // Hassas bilgileri çıkar
    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // HTTP-only cookie ile token gönder (CSRF koruması için)
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS üzerinden sadece
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 saat
    });

    // Yanıt gönder
    res.json({
      success: true,
      message: 'Giriş başarılı',
      token, // Client tarafında localStorage için (isteğe bağlı)
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin' 
    });
  }
};

// Kullanıcı çıkışı
exports.logout = (req, res) => {
  // Cookie'yi temizle
  res.clearCookie('auth_token');
  
  res.json({
    success: true,
    message: 'Başarıyla çıkış yapıldı'
  });
};

// Kullanıcı bilgilerini getir
exports.getProfile = async (req, res) => {
  try {
    // req.userId, auth middleware tarafından eklenir
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      });
    }

    // Hassas bilgileri çıkar
    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Profil getirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin' 
    });
  }
};

// Şifre değiştirme
exports.changePassword = async (req, res) => {
  try {
    // Validasyon hatalarını kontrol et
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validasyon hatası', 
        errors: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;
    
    // Kullanıcıyı bul
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      });
    }

    // Mevcut şifreyi doğrula
    const isPasswordValid = await user.validatePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Mevcut şifre yanlış' 
      });
    }

    // Şifreyi güncelle
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi'
    });
  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin' 
    });
  }
};

// E-posta doğrulama ve kayıt tamamlama
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    
    // E-posta adresini normalize et (tüm noktalama işaretlerini kaldır ve küçük harfe çevir)
    const normalizedEmail = email.toLowerCase().replace(/\./g, '');
    
    // Geçici kullanıcıları kontrol et ve normalize et
    const tempUser = Array.from(tempUsers.entries()).find(([key]) => 
      key.toLowerCase().replace(/\./g, '') === normalizedEmail
    );

    if (!tempUser) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz işlem. Lütfen tekrar kayıt olun.'
      });
    }

    // Kodları string olarak karşılaştır
    if (tempUser[1].verificationCode.toString() !== code.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz doğrulama kodu'
      });
    }

    // Kodun süresini kontrol et
    if (new Date() > new Date(tempUser[1].verificationCodeExpires)) {
      tempUsers.delete(tempUser[0]);
      return res.status(400).json({
        success: false,
        message: 'Doğrulama kodunun süresi dolmuş'
      });
    }

    // Kullanıcıyı oluştur
    const user = await User.create({
      name: tempUser[1].name,
      email: tempUser[1].email,
      password: tempUser[1].password,
      emailVerified: true
    });

    // Geçici kullanıcı bilgilerini temizle
    tempUsers.delete(tempUser[0]);

    res.json({
      success: true,
      message: 'E-posta doğrulandı ve kayıt tamamlandı'
    });
  } catch (error) {
    console.error('Doğrulama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin'
    });
  }
};

// Doğrulama kodunu yeniden gönderme
exports.resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Kod yeniden gönderme isteği alındı:', email);
    console.log('TempUsers içeriği:', Array.from(tempUsers.keys())); // Debug log

    // E-posta adresini normalize et
    const normalizedEmail = email.toLowerCase().replace(/\./g, '');
    
    // Geçici kullanıcıları kontrol et ve normalize et
    const tempUser = Array.from(tempUsers.entries()).find(([key]) => 
      key.toLowerCase().replace(/\./g, '') === normalizedEmail
    );

    if (!tempUser) {
      console.log('Geçici kullanıcı bulunamadı:', email); // Debug log
      return res.status(404).json({
        success: false,
        message: 'Geçersiz işlem. Lütfen tekrar kayıt olun.'
      });
    }

    // Yeni doğrulama kodu oluştur
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 30 * 60 * 1000);

    // Geçici kullanıcıyı güncelle
    tempUser[1].verificationCode = verificationCode;
    tempUser[1].verificationCodeExpires = verificationCodeExpires;
    tempUsers.set(tempUser[0], tempUser[1]);

    // Yeni kodu gönder
    await sendVerificationEmail({ email }, verificationCode);
    console.log('Yeni kod gönderildi:', email);

    res.json({
      success: true,
      message: 'Yeni doğrulama kodu e-posta adresinize gönderildi'
    });
  } catch (error) {
    console.error('Kod yeniden gönderme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası, lütfen daha sonra tekrar deneyin'
    });
  }
}; 