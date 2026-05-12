import { BarChart2, Inbox, Rotate3D, RotateCcw, ShoppingBag, Users, X, Zap } from "lucide-react";
import { motion } from "framer-motion";

import Header from "../components/common/Header";
import StatCard from "../components/common/StatCard";
import SalesOverviewChart from "../components/overview/SalesOverviewChart";
import CategoryDistributionChart from "../components/overview/CategoryDistributionChart";
import SalesChannelChart from "../components/overview/SalesChannelChart";
import MarketplacesPanel from '../components/marketplaces/MarketplacesPanel';

const OverviewPage = () => {
	return (
		<div className='flex-1 overflow-auto relative z-10'>
			<Header title='Ana Sayfa' />

			<main className='max-w-7xl mx-auto py-6 px-4 lg:px-8'>
				{/* STATS */}
				<motion.div
					className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 1 }}
				>
					<StatCard name='Bugünkü Siparişler' icon={ShoppingBag} value='567' color='#3B82F6' />
					<StatCard name='Mesajlar' icon={Inbox} value='234' color='#10B981' />
					<StatCard name='Hatalı Ürünler' icon={X} value='10' color='#EF4444' />
					<StatCard name='İade Talepleri' icon={RotateCcw} value='12.5%' color='#F59E0B' />
				</motion.div>

				{/* CHARTS */}

				<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
					<SalesOverviewChart />
					<CategoryDistributionChart />
					<SalesChannelChart />
				</div>
			</main>
			<MarketplacesPanel />
		</div>
	);
};
export default OverviewPage;
