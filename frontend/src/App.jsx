import { Route, Routes, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';


import Sidebar from "./components/common/Sidebar";

import OverviewPage from "./pages/OverviewPage";
import UsersPage from "./pages/UsersPage";
import OrdersPage from "./pages/OrdersPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import MarketplacesPage from './pages/MarketplacesPage';
import QuestionsPage from './pages/QuestionsPage';
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";


function App() {
	const location = useLocation();
	const navigate = useNavigate();
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	
	// Kimlik doğrulama sayfalarını kontrol et
	const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
	
	useEffect(() => {
		// LocalStorage'dan token kontrolü
		const token = localStorage.getItem('token');
		const isAuth = !!token;
		setIsAuthenticated(isAuth);
		setIsLoading(false);
		
		// Kullanıcı giriş yapmışsa ve login/register sayfalarına gitmeye çalışıyorsa ana sayfaya yönlendir
		if (isAuth && isAuthPage) {
			navigate('/', { replace: true });
		}
		
		// Kullanıcı giriş yapmamışsa ve korumalı bir sayfaya gitmeye çalışıyorsa login sayfasına yönlendir
		if (!isAuth && !isAuthPage) {
			navigate('/login', { replace: true });
		}
		
		// Tarayıcı geçmişi kontrolü
		const handlePopState = () => {
			const currentToken = localStorage.getItem('token');
			// Giriş yapmış kullanıcı geri tuşuna basarsa ve login sayfasına dönmeye çalışırsa
			if (currentToken && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
				navigate('/', { replace: true });
			}
		};
		
		// Geri tuşu olayını dinle
		window.addEventListener('popstate', handlePopState);
		
		// Temizleme fonksiyonu
		return () => {
			window.removeEventListener('popstate', handlePopState);
		};
	}, [location.pathname, isAuthPage, navigate]);

	// Yükleme durumunda bir yükleme göstergesi göster
	if (isLoading) {
		return <div className="flex items-center justify-center h-screen bg-gray-900">
			<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
		</div>;
	}

	// Korumalı rota bileşeni
	const ProtectedRoute = ({ children }) => {
		if (!isAuthenticated) {
			return <Navigate to="/login" replace />;
		}
		return children;
	};

	return (
		<div className='flex h-screen bg-gray-900 text-gray-100 overflow-hidden'>
			{/* BG */}
			<div className='fixed inset-0 z-0'>
				<div className='absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-80' />
				<div className='absolute inset-0 backdrop-blur-sm' />
			</div>

			{isAuthenticated && !isAuthPage && <Sidebar />}
			<Routes>
				<Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
				<Route path="/register" element={<RegisterPage />} />
				
				<Route path="/" element={
					<ProtectedRoute>
						<OverviewPage />
					</ProtectedRoute>
				} />
				<Route path="/dashboard" element={
					<ProtectedRoute>
						<OverviewPage />
					</ProtectedRoute>
				} />
				<Route path="/users" element={
					<ProtectedRoute>
						<UsersPage />
					</ProtectedRoute>
				} />
				
			
				<Route path='/analytics' element={
					<ProtectedRoute>
						<AnalyticsPage />
					</ProtectedRoute>
				} />
				<Route path='/settings' element={
					<ProtectedRoute>
						<SettingsPage />
					</ProtectedRoute>
				} />
				<Route path='/marketplaces' element={
					<ProtectedRoute>
						<MarketplacesPage />
					</ProtectedRoute>
				} />
				<Route path='/questions' element={
					<ProtectedRoute>
						<QuestionsPage />
					</ProtectedRoute>
				} />
				<Route path="/marketplace/:marketplaceId/orders" element={<OrdersPage />} />
				<Route path="*" element={<Navigate to="/" />} />
			</Routes>
		</div>
	);
}

export default App;
