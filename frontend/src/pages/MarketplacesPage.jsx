import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useRef } from 'react';
import Header from "../components/common/Header";
import StatCard from "../components/common/StatCard";
import MarketplacesPanel from '../components/marketplaces/MarketplacesPanel';
import ConnectedStoresList from '../components/marketplaces/ConnectedStoresList';

const MarketplacesPage = () => {
  const connectedStoresRef = useRef();

  const handleStoreConnected = () => {
    if (connectedStoresRef.current) {
        connectedStoresRef.current.refresh(); // Bu, ConnectedStoresList'teki fetchConnectedStores'u çağırır
    }
  };

  return (
    <div className='flex-1 overflow-auto relative z-10'>
      <Header title='Pazaryeri Yönetimi' />

      <main className='max-w-7xl mx-auto py-6 px-4 lg:px-8 overflow-visible'>
        <motion.div
          className='grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard 
            name='Toplam Pazaryeri'
            icon={ShoppingBag}
            value='4'
            description='Aktif pazaryeri sayısı'
            color='#3B82F6'
          />
          <StatCard
            name='Toplam Ürün'
            icon={ShoppingBag}
            value='1,234'
            description='Pazaryerlerindeki toplam ürün'
            color='#10B981'
          />
          <StatCard
            name='Aktif Listingler'
            icon={ShoppingBag}
            value='890'
            description='Satışta olan ürünler'
            color='#EF4444'
          />
          <StatCard
            name='Son Güncelleme'
            icon={ShoppingBag}
            value='2 saat önce'
            description='Son stok senkronizasyonu'
            color='#F59E0B'
          />
        </motion.div>

        <MarketplacesPanel onStoreConnected={handleStoreConnected} />
        
        <ConnectedStoresList ref={connectedStoresRef} />
      </main>
    </div>
  );
};

export default MarketplacesPage; 