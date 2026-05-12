import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../../services/AuthService';

const Header = ({ title }) => {
	const [user, setUser] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		// AuthService kullanarak kullanıcı bilgilerini al
		const currentUser = AuthService.getCurrentUser();
		if (currentUser) {
			setUser(currentUser);
		}
	}, []);

	const handleLogout = () => {
		// AuthService kullanarak çıkış yap
		AuthService.logout();
		
		// Kullanıcı state'ini temizle
		setUser(null);
		
		// Login sayfasına yönlendir
		navigate('/login', { replace: true });
	};

	return (
		<header className='bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg border-b border-gray-700'>
			<div className='max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center'>
				<h1 className='text-2xl font-semibold text-gray-100'>{title}</h1>
				
				<div className='flex items-center space-x-4'>
					{user ? (
						<>
							<span className='text-gray-200'>
								<span className='font-medium'>{user.name}</span>
							</span>
							<button
								onClick={handleLogout}
								className='bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 border border-indigo-500 shadow-sm hover:shadow-md'
							>
								Çıkış Yap
							</button>
						</>
					) : (
						<Link
							to='/login'
							className='bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200'
						>
							Giriş Yap
						</Link>
					)}
				</div>
			</div>
		</header>
	);
};

export default Header;
