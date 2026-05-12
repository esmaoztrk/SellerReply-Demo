import http from './http-common';


const AuthService = {
  login: async (email, password, retryCount = 0) => {
    try {
      const response = await http.post('/auth/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Giriş yapıldığında tarayıcı geçmişini tamamen temizle
        AuthService.clearHistory();
      }
      return response.data;
    } catch (error) {
      // 429 hatası (Too Many Requests) için retry mekanizması
      if (error.response && error.response.status === 429 && retryCount < 3) {
        const nextRetryCount = retryCount + 1;
        const delay = Math.pow(2, nextRetryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
        
        console.log(`Rate limit aşıldı. ${delay/1000} saniye sonra tekrar denenecek (${nextRetryCount}/3)`);
        
        // Belirtilen süre kadar bekle
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Tekrar dene
        return AuthService.login(email, password, nextRetryCount);
      }
      
      // Diğer hatalar veya maksimum retry sayısına ulaşıldıysa hatayı fırlat
      if (error.response && error.response.status === 429) {
        error.message = 'Çok fazla giriş denemesi yaptınız. Lütfen bir süre bekleyip tekrar deneyin.';
      }
      throw error;
    }
  },
  
  register: async (name, email, password) => {
    return await http.post('/auth/register', { name, email, password });
  },
  
  logout: () => {
    // Sunucuya çıkış isteği gönder
    http.post('/auth/logout')
      .catch(error => console.error('Çıkış hatası:', error));
      
    // Yerel depolamayı temizle
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Çıkış yapıldığında tarayıcı geçmişini temizle
    AuthService.clearHistory();
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  // Tarayıcı geçmişini tamamen temizleme
  clearHistory: () => {
    // Geçmişi tamamen temizle - bu en radikal çözüm
    if (window.history && window.history.pushState) {
      // Geçmişi sıfırla
      window.history.pushState(null, document.title, window.location.href);
      
      // Geri tuşunu devre dışı bırak
      window.addEventListener('popstate', function(event) {
        window.history.pushState(null, document.title, window.location.href);
      });
    }
  },
  
  // Geri tuşu dinleyicisini kaldır
  removeHistoryListener: () => {
    window.onpopstate = null;
  },
  
  verifyEmail: async (email, code) => {
    try {
      const response = await http.post('/auth/verify-email', {
        email: email,
        code: code.toString()
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  resendVerificationCode: async (email) => {
    try {
      console.log('Kod yeniden gönderme isteği başlatıldı:', email);
      const response = await http.post('/auth/resend-verification', { email });
      console.log('Sunucu yanıtı:', response.data);
      return response.data;
    } catch (error) {
      console.error('Kod yeniden gönderme hatası:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        email: email,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      throw error;
    }
  }
};

export default AuthService; 