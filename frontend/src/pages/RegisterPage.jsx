import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, UserPlus, AlertCircle } from 'lucide-react';
import AuthService from '../services/AuthService';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({}); // Çoklu hata mesajları için obje
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCodeSent, setVerificationCodeSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
    if (AuthService.isAuthenticated()) {
      navigate('/', { replace: true });
      return;
    }
    
    // Geri tuşu dinleyicisini kaldır (register sayfasında geri tuşu çalışabilir)
    AuthService.removeHistoryListener();
    
  }, [navigate]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Kullanıcı veri girdiğinde ilgili hata mesajını temizle
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Form validasyonu
  const validateForm = () => {
    const newErrors = {};
    
    // İsim validasyonu
    if (!formData.name.trim()) {
      newErrors.name = 'İsim alanı boş bırakılamaz';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'İsim en az 2 karakter olmalıdır';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'İsim en fazla 50 karakter olmalıdır';
    }
    
    // E-posta validasyonu
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'E-posta alanı boş bırakılamaz';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }
    
    // Şifre validasyonu
    if (!formData.password) {
      newErrors.password = 'Şifre alanı boş bırakılamaz';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Şifre en az 8 karakter olmalıdır';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Şifre en az bir küçük harf içermelidir';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Şifre en az bir büyük harf içermelidir';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Şifre en az bir rakam içermelidir';
    }
    
    // Şifre onay validasyonu
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Hata yoksa true döner
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await AuthService.register(
        formData.name,
        formData.email,
        formData.password
      );
      
      setRegisteredEmail(formData.email);
      setVerificationCodeSent(true);
    } catch (err) {
      console.error('Kayıt hatası:', err);
      
      // Sunucudan gelen validasyon hatalarını işle
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const serverErrors = {};
        
        // Sunucudan gelen hataları field bazlı olarak grupla
        err.response.data.errors.forEach(error => {
          serverErrors[error.param] = error.msg;
        });
        
        setErrors(serverErrors);
      } else {
        // Genel hata mesajı
        setErrors({ general: err.response?.data?.message || 'Kayıt sırasında bir hata oluştu' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Doğrulama kodunu kontrol eden fonksiyon
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setErrors({
        verificationCode: 'Lütfen 6 haneli doğrulama kodunu girin'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Parametreleri ayrı ayrı gönder
      await AuthService.verifyEmail(
        registeredEmail,
        verificationCode
      );
      
      // Başarılı doğrulama sonrası login sayfasına yönlendir
      navigate('/login', {
        replace: true,
        state: { 
          message: 'Kayıt başarılı! Lütfen giriş yapın.',
          type: 'success'
        }
      });
    } catch (err) {
      console.error('Doğrulama hatası:', err);
      // Hata mesajını daha detaylı göster
      const errorMessage = err.response?.data?.message || 'Geçersiz doğrulama kodu';
      setErrors({
        verificationCode: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Doğrulama kodu input alanı için onChange handler
  const handleVerificationCodeChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setVerificationCode(value);
    if (errors.verificationCode) {
      setErrors(prev => ({ ...prev, verificationCode: '' }));
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 space-y-8 bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Hesap Oluştur</h1>
          <p className="mt-2 text-gray-400">Yeni bir hesap oluşturun</p>
        </div>
        
        {/* Genel hata mesajı */}
        {errors.general && (
          <div className="p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-md text-red-300 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{errors.general}</span>
          </div>
        )}
        
        <AnimatePresence>
          {verificationCodeSent ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-4 space-y-6"
            >
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-300">
                  Doğrulama Kodu
                </label>
                <input
                  id="verificationCode"
                  name="verificationCode"
                  type="text"
                  required
                  value={verificationCode}
                  onChange={handleVerificationCodeChange}
                  className={`mt-1 block w-full px-3 py-2 bg-gray-700 border ${
                    errors.verificationCode ? 'border-red-500' : 'border-gray-600'
                  } rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl tracking-wider`}
                  placeholder="000000"
                  maxLength={6}
                />
                {errors.verificationCode && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.verificationCode}
                  </p>
                )}
              </div>
              
              <div>
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Doğrula'
                  )}
                </button>

                <p className="mt-4 text-sm text-gray-400 text-center">
                  Kod gelmedi mi?{' '}
                  {resendCountdown > 0 ? (
                    <span className="text-gray-500">
                      {resendCountdown} saniye sonra tekrar deneyin
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          console.log('Tekrar gönder butonuna tıklandı:', registeredEmail);
                          await AuthService.resendVerificationCode(registeredEmail);
                          setErrors({
                            resend: 'Yeni doğrulama kodu gönderildi'
                          });
                          setResendCountdown(60);
                        } catch (err) {
                          console.error('Tekrar gönderme hatası:', {
                            message: err.message,
                            response: err.response?.data,
                            status: err.response?.status
                          });
                          setErrors({
                            resend: err.response?.data?.message || 'Kod gönderilirken bir hata oluştu'
                          });
                        }
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Tekrar Gönder
                    </button>
                  )}
                </p>
                {errors.resend && (
                  <p className={`mt-2 text-sm text-center ${
                    errors.resend.includes('hata') ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {errors.resend}
                  </p>
                )}
              </div>
            </motion.div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                  İsim
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 bg-gray-700 border ${errors.name ? 'border-red-500' : 'border-gray-600'} rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="Adınız Soyadınız"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  E-posta Adresi
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 bg-gray-700 border ${errors.email ? 'border-red-500' : 'border-gray-600'} rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="ornek@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Şifre
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`block w-full px-3 py-2 bg-gray-700 border ${errors.password ? 'border-red-500' : 'border-gray-600'} rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="En az 8 karakter"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.password}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                  Şifre Tekrar
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`block w-full px-3 py-2 bg-gray-700 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-600'} rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="Şifrenizi tekrar girin"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <UserPlus className="h-5 w-5 mr-2" />
                  )}
                  {isLoading ? 'Kaydediliyor...' : 'Hesap Oluştur'}
                </button>
              </div>
              
              <div className="text-center text-sm">
                <p className="text-gray-400">
                  Zaten hesabınız var mı?{' '}
                  <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
                    Giriş Yap
                  </Link>
                </p>
              </div>
            </form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default RegisterPage; 