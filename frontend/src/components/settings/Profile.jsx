import { User } from "lucide-react";
import SettingSection from "./SettingSection";

const Profile = () => {
	return (
		<SettingSection icon={User} title={"Profil"}>
			<div className='flex flex-col sm:flex-row items-center mb-6'>
				<div className='w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center mr-4'>
					<User size={40} className="text-gray-400" />
				</div>

				<div>
					<h3 className='text-lg font-semibold text-gray-100'>Esma Öztürk</h3>
					<p className='text-gray-400'>esmaozturk@gamil.com</p>
				</div>
			</div>

			<button className='bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition duration-200 w-full sm:w-auto'>
				Profili Düzenle
			</button>
		</SettingSection>
	);
};
export default Profile;
