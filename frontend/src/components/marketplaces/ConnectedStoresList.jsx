import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Store, ExternalLink, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import ApiService from '../../services/ApiService';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const ConnectedStoresList = forwardRef((props, ref) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Dışarıdan erişilebilir fonksiyonları tanımla
  useImperativeHandle(ref, () => ({
    refresh: fetchConnectedStores
  }));

  useEffect(() => {
    fetchConnectedStores();
  }, []);

  const fetchConnectedStores = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const connectedMarketplaces = await ApiService.getConnectedMarketplaces();
      
      // Mağazaları düzenle
      const storesList = connectedMarketplaces.map(connection => ({
        id: connection.id,
        marketplaceId: connection.marketplaceId,
        storeName: connection.storeName,
        marketplaceName: getMarketplaceName(connection.marketplaceId),
        logo: `/images/marketplaces/${connection.marketplaceId}.png`,
        lastUpdated: connection.lastUpdated
      }));
      
      setStores(storesList);
    } catch (err) {
      console.error('Bağlı mağazalar getirme hatası:', err);
      setError('Bağlı mağazalar yüklenemedi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMarketplaceName = (marketplaceId) => {
    const marketplaceNames = {
      'trendyol': 'Trendyol',
      'hepsiburada': 'Hepsiburada',
      'n11': 'n11',
      'ciceksepeti': 'Çiçek Sepeti',
      'amazon': 'Amazon'
    };
    
    return marketplaceNames[marketplaceId] || marketplaceId;
  };

  const handleDisconnect = async (storeId) => {
    try {
      await ApiService.disconnectMarketplace(storeId);
      
      // Mağaza listesini güncelle
      setStores(prevStores => prevStores.filter(store => store.id !== storeId));
      
      setConfirmDelete(null);
      toast.success('Mağaza bağlantısı başarıyla silindi');
    } catch (err) {
      console.error('Bağlantı silme hatası:', err);
      setError('Bağlantı silinemedi: ' + err.message);
      toast.error('Bağlantı silinemedi');
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 backdrop-blur-sm border border-red-700/50 rounded-xl p-4">
        <div className="flex items-center text-red-400 mb-2">
          <AlertCircle size={18} className="mr-2" />
          <span className="font-medium">Hata</span>
        </div>
        <p className="text-sm text-red-300">{error}</p>
        <button 
          onClick={fetchConnectedStores}
          className="mt-3 flex items-center text-sm text-blue-400 hover:text-blue-300"
        >
          <RefreshCw size={14} className="mr-1" />
          Yeniden Dene
        </button>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700 text-center">
        <Store className="mx-auto text-gray-500 mb-3" size={32} />
        <p className="text-gray-400">Henüz bağlı mağaza bulunmuyor.</p>
        <p className="text-sm text-gray-500 mt-1">Pazaryeri bağlantıları kurmak için yukarıdaki kartları kullanabilirsiniz.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700 relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Store className="text-green-500 mr-3" size={24} />
          <h2 className="text-xl font-semibold text-gray-100">Bağlı Mağazalar</h2>
        </div>
        
        <button 
          onClick={fetchConnectedStores}
          className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700"
          title="Yenile"
        >
          <RefreshCw size={18} />
        </button>
      </div>
      
      <div className="space-y-3">
        {stores.map(store => (
          <div 
            key={store.id}
            className="bg-gray-700 bg-opacity-50 rounded-lg p-3 border border-gray-600 flex justify-between items-center"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center p-2 mr-3">
                <img 
                  src={store.logo} 
                  alt={store.marketplaceName} 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/marketplace-logos/default.png';
                  }}
                />
              </div>
              <div>
                <div className="text-blue-300 font-medium">
                  {store.storeName || `${store.marketplaceName} Mağazası`}
                </div>
                <div className="text-xs text-gray-400 flex items-center">
                  <span className="mr-2">{store.marketplaceName}</span>
                  <span>•</span>
                  <span className="ml-2">
                    Son güncelleme: {new Date(store.lastUpdated).toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <a 
                href={`https://${store.marketplaceId}.com/seller/${store.storeName}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 p-1.5 rounded-full hover:bg-blue-900/30"
                title="Mağazayı Görüntüle"
              >
                <ExternalLink size={18} />
              </a>
              
              <div className="flex space-x-2">
                <Link 
                  to={`/marketplace/${store.id}/orders`}
                  className="text-blue-500 hover:text-blue-700"
                >
                  Siparişler
                </Link>
                <button
                  onClick={() => setConfirmDelete(store.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Bağlantıyı Kes
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Mağaza Bağlantısını Sil</h3>
            <p className="text-gray-300 mb-4">Bu mağaza bağlantısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                onClick={() => handleDisconnect(confirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ConnectedStoresList; 