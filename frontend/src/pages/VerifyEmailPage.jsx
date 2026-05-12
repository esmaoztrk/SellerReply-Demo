import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import AuthService from '../services/AuthService';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Geçersiz doğrulama bağlantısı');
        return;
      }

      try {
        const response = await AuthService.verifyEmail(token);
        setStatus('success');
        setMessage(response.message);
        
        // 3 saniye sonra login sayfasına yönlendir
        setTimeout(() => {
          navigate('/login', {
            state: { message: 'E-posta doğrulandı! Şimdi giriş yapabilirsiniz.' }
          });
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Doğrulama sırasında bir hata oluştu');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 space-y-8 bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700"
      >
        {status === 'verifying' && (
          <div className="text-center">
            <div className="animate-spin h-12 w-12 mx-auto border-4 border-indigo-500 border-t-transparent rounded-full"></div>
            <p className="mt-4 text-gray-300">E-posta adresi doğrulanıyor...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center text-green-400">
            <CheckCircle className="h-12 w-12 mx-auto" />
            <h2 className="mt-4 text-xl font-semibold">Doğrulama Başarılı!</h2>
            <p className="mt-2">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center text-red-400">
            <XCircle className="h-12 w-12 mx-auto" />
            <h2 className="mt-4 text-xl font-semibold">Doğrulama Başarısız</h2>
            <p className="mt-2">{message}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage; 