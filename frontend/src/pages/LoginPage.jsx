import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import AuthService from '../services/AuthService';

const LoginPage = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
    if (AuthService.isAuthenticated()) {
      navigate('/', { replace: true });
      return;
    }
    
    // Register sayfasından gelen başarı mesajını kontrol et
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // URL geçmişinden state'i temizle
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Geri tuşu dinleyicisini kaldır (login sayfasında geri tuşu çalışabilir)
    AuthService.removeHistoryListener();
  }, [navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form doğrulama
    if (!email || !password) {
      setError('Lütfen e-posta ve şifrenizi girin');
      return;
    }
    
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    
    try {
      await AuthService.login(email, password);
      
      // Başarılı giriş
      setSuccessMessage('Giriş başarılı! Yönlendiriliyorsunuz...');
      
      // Kimlik doğrulama durumunu güncelle
      setIsAuthenticated(true);
      
      // Ana sayfaya yönlendir
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Giriş hatası:', err);
      
      // Özel hata mesajları
      if (err.response) {
        if (err.response.status === 429) {
          setError('Çok fazla giriş denemesi yaptınız. Lütfen bir süre bekleyip tekrar deneyin.');
        } else if (err.response.status === 401) {
          setError('Geçersiz e-posta veya şifre');
        } else {
          setError(err.response.data?.message || 'Giriş yapılırken bir hata oluştu');
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Sunucuya bağlanırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      }
    } finally {
      setIsLoading(false);
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
          <h1 className="text-3xl font-bold text-white">Giriş Yap</h1>
          <p className="mt-2 text-gray-400">Hesabınıza erişmek için giriş yapın</p>
        </div>
        
        {error && (
          <div className="p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-md text-red-300">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="p-3 bg-green-500 bg-opacity-20 border border-green-500 rounded-md text-green-300">
            {successMessage}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              E-posta Adresi
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="ornek@email.com"
            />
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 bg-gray-700 border-gray-600 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Beni hatırla
              </label>
            </div>
            
            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300">
                Şifrenizi mi unuttunuz?
              </a>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Giriş yapılıyor...
                </span>
              ) : (
                <span className="flex items-center">
                  <LogIn className="h-5 w-5 mr-2" />
                  Giriş Yap
                </span>
              )}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-400">
            Hesabınız yok mu?{' '}
            <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300">
              Kayıt olun
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage; 