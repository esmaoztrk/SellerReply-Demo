import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, AlertCircle, Plus, RefreshCw } from 'lucide-react';
import MarketplaceConnectionModal from './MarketplaceConnectionModal';
import ApiService from '../../services/ApiService';
import ReactDOM from 'react-dom';

const MarketplacesPanel = ({ onStoreConnected }) => {
  const [marketplaceList, setMarketplaceList] = useState([]);
  const [selectedMarketplace, setSelectedMarketplace] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pazaryeri listesi
  const marketplaces = [
    {
      id: 'trendyol',
      name: 'Trendyol',
      logo: '/images/marketplaces/trendyol.png',
      description: 'Türkiye\'nin önde gelen e-ticaret platformu'
    },
    {
      id: 'hepsiburada',
      name: 'Hepsiburada',
      logo: '/images/marketplaces/hepsiburada.png',
      description: 'Türkiye\'nin en büyük online alışveriş sitesi'
    },
    {
      id: 'n11',
      name: 'n11',
      logo: '/images/marketplaces/n11.png',
      description: 'Alışverişin uğurlu adresi'
    },
    {
      id: 'ciceksepeti',
      name: 'Çiçek Sepeti',
      logo: '/images/marketplaces/ciceksepeti.png',
      description: 'Online hediye ve çiçek siparişi platformu'
    },
    {
      id: 'amazon',
      name: 'Amazon',
      logo: '/images/marketplaces/amazon.png',
      description: 'Dünyanın en büyük online alışveriş platformu'
    }
  ];

  // Pazaryerlerini getir
  const fetchMarketplaces = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Tüm pazaryerlerini göster, bağlantı durumunu işaretleme
      setMarketplaceList(marketplaces);
    } catch (err) {
      console.error('Pazaryerleri getirme hatası:', err);
      setError('Pazaryerleri yüklenemedi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplaces();
  }, []);

  const handleConnect = async (marketplaceId) => {
    setIsModalOpen(false);
    setSelectedMarketplace(null);
    
    // ConnectedStoresList bileşenini yenile
    if (onStoreConnected) {
      onStoreConnected();
    }
  };

  return (
    <>
      <motion.div
        className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <ShoppingBag className="text-indigo-500 mr-3" size={24} />
            <h2 className="text-xl font-semibold text-gray-100">Pazaryeri Bağlantıları</h2>
          </div>
          
          <button 
            onClick={fetchMarketplaces}
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700"
            title="Yenile"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketplaceList.map((marketplace) => (
              <div 
                key={marketplace.id}
                className="bg-gray-700 bg-opacity-50 rounded-lg p-4 border-2 border-gray-600 hover:border-blue-500/50 transition-all duration-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center p-2">
                    <img 
                      src={marketplace.logo} 
                      alt={marketplace.name} 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/marketplace-logos/default.png';
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-gray-100 font-medium">{marketplace.name}</h3>
                    <p className="text-xs text-gray-400">{marketplace.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedMarketplace(marketplace);
                    setIsModalOpen(true);
                  }}
                  className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                >
                  <Plus size={16} className="mr-1" />
                  Mağaza Ekle
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {selectedMarketplace && ReactDOM.createPortal(
        <MarketplaceConnectionModal
          marketplace={selectedMarketplace}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMarketplace(null);
          }}
          onConnect={handleConnect}
        />,
        document.getElementById('modal-root') || document.body
      )}
    </>
  );
};

export default MarketplacesPanel; 