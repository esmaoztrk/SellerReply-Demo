import { useState, useEffect } from 'react';
import { Store, ExternalLink, AlertCircle } from 'lucide-react';
import ApiService from '../../services/ApiService';

const StoreInfo = ({ marketplaceId }) => {
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStoreInfo = async () => {
      if (!marketplaceId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await ApiService.getBrands(marketplaceId);
        setStoreInfo(response.storeInfo);
      } catch (err) {
        console.error('Mağaza bilgileri getirme hatası:', err);
        setError('Mağaza bilgileri yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreInfo();
  }, [marketplaceId]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4">
        <div className="flex items-center text-red-400 mb-1">
          <AlertCircle size={16} className="mr-2" />
          <span className="font-medium">Hata</span>
        </div>
        <p className="text-sm text-red-300">{error}</p>
      </div>
    );
  }

  if (!storeInfo) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center mb-2">
        <Store className="text-blue-400 mr-2" size={18} />
        <h3 className="text-lg font-medium text-white">{storeInfo.storeName}</h3>
      </div>
      
      {storeInfo.storeId && (
        <p className="text-sm text-gray-400 mb-1">
          Mağaza ID: <span className="text-gray-300">{storeInfo.storeId}</span>
        </p>
      )}
      
      {storeInfo.storeUrl && (
        <a 
          href={storeInfo.storeUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-blue-400 hover:text-blue-300 flex items-center mt-2"
        >
          Mağaza Profilini Görüntüle
          <ExternalLink size={14} className="ml-1" />
        </a>
      )}
    </div>
  );
};

export default StoreInfo; 