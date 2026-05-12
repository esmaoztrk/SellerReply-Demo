import { motion } from "framer-motion";
import { TrendingUp, Users, ShoppingBag, DollarSign } from "lucide-react";

const INSIGHTS = [
	{
		icon: TrendingUp,
		color: "text-green-500",
		insight: "Gelir, son ayla karşılaştırıldığında %15 artış gösteriyor, başarılı bir e-posta kampanyasıyla ilgilidir.",
	},
	{
		icon: Users,
		color: "text-blue-500",
		insight: "Müşteri tutumu, yeni loyallik programının başlatılmasından sonra %8 artış gösteriyor.",
	},
	{
		icon: ShoppingBag,
		color: "text-purple-500",
		insight: 'Ürün kategorisi "Electronics" en yüksek büyüme potansiyeline sahip, son pazar trendlerine göre.',
	},
	{
		icon: DollarSign,
		color: "text-yellow-500",
		insight: "Fiyatlandırma stratejisini optimize etmek, genel karlılığı %5-7 artırabilir.",
	},
];

const AIPoweredInsights = () => {
	return (
		<motion.div
			className='bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg shadow-lg rounded-xl p-6 border border-gray-700'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 1.0 }}
		>
			<h2 className='text-xl font-semibold text-gray-100 mb-4'>AI-Destekli İstatistikler</h2>
			<div className='space-y-4'>
				{INSIGHTS.map((item, index) => (
					<div key={index} className='flex items-center space-x-3'>
						<div className={`p-2 rounded-full ${item.color} bg-opacity-20`}>
							<item.icon className={`size-6 ${item.color}`} />
						</div>
						<p className='text-gray-300'>{item.insight}</p>
					</div>
				))}
			</div>
		</motion.div>
	);
};
export default AIPoweredInsights;
