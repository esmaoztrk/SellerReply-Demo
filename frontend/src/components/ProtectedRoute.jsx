import { Navigate, Outlet } from 'react-router-dom';
import authService from '../services/authService';

const ProtectedRoute = () => {
  // Kullanıcının giriş yapmış olup olmadığını kontrol et
  const isAuthenticated = authService.isAuthenticated();
  console.log('Yetkilendirme durumu:', isAuthenticated);
  
  // Giriş yapmamışsa login sayfasına yönlendir
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Giriş yapmışsa içeriği göster
  return <Outlet />;
};

export default ProtectedRoute; 