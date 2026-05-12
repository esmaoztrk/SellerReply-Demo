import { useState } from 'react';
import { X, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import ApiService from '../../services/ApiService';
import { toast } from 'react-hot-toast';

const MarketplaceConnectionModal = ({ marketplace, isOpen, onClose, onConnect }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [testLoading, setTestLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [testSuccess, setTestSuccess] = useState(false);
    const [showSecrets, setShowSecrets] = useState({});

    // Pazaryerine göre form alanlarını belirle
    const getFormFields = () => {
        switch (marketplace.id) {
            case 'trendyol':
                return [
                    { name: 'supplierId', label: 'Satıcı ID', type: 'text', placeholder: 'Örnek: 123456', required: true },
                    { name: 'username', label: 'API Key', type: 'text', placeholder: 'API key', required: true },
                    { name: 'password', label: 'API Secret', type: 'password', placeholder: 'API secret', required: true }
                ];
            case 'hepsiburada':
                return [
                    { 
                        name: 'merchantId', 
                        label: 'Merchant ID', 
                        type: 'text', 
                        placeholder: '1234567890', 
                        required: true 
                    },
                    { 
                        name: 'secretKey', 
                        label: 'Secret Key', 
                        type: 'password', 
                        placeholder: '1234567890', 
                        required: true 
                    },
                    { 
                        name: 'userAgent', 
                        label: 'User Agent', 
                        type: 'text', 
                        placeholder: 'example_dev', 
                        value: 'example_dev', 
                        required: true 
                    }
                ];
            case 'n11':
                return [
                    { name: 'appKey', label: 'Uygulama Anahtarı', type: 'text', placeholder: 'Uygulama Anahtarı', required: true },
                    { name: 'appSecret', label: 'Uygulama Gizli Anahtarı', type: 'password', placeholder: 'Uygulama Gizli Anahtarı', required: true }
                ];
            case 'ciceksepeti':
                return [
                    { name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'API Key', required: true },
                    { name: 'storeId', label: 'Mağaza ID', type: 'text', placeholder: 'Mağaza ID', required: true }
                ];
            case 'amazon':
                return [
                    { name: 'sellerId', label: 'Satıcı ID', type: 'text', placeholder: 'Satıcı ID', required: true },
                    { name: 'accessKey', label: 'Access Key', type: 'text', placeholder: 'Access Key', required: true },
                    { name: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'Secret Key', required: true },
                    { name: 'region', label: 'Bölge', type: 'text', placeholder: 'Örnek: eu-west-1', required: true }
                ];
            default:
                return [
                    { name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'API Key', required: true },
                    { name: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'API Secret', required: true }
                ];
        }
    };

    const validateForm = () => {
        const fields = getFormFields();
        const errors = {};
        let isValid = true;

        fields.forEach(field => {
            if (field.required && !formData[field.name]) {
                errors[field.name] = `${field.label} alanı zorunludur`;
                isValid = false;
            }
        });

        setFieldErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        setError(null);

        try {
            // Pazaryeri bağlantısını kur
            await ApiService.connectMarketplace({
                marketplaceId: marketplace.id,
                credentials: formData
            });
            
            onClose();
            onConnect(marketplace.id);
            
            // Başarılı mesajı göster
            toast.success('Mağaza bağlantısı başarıyla kuruldu!');
        } catch (err) {
            // Backend'den gelen hata mesajını al
            if (err.response?.status === 409) {
                // Zaten bağlı olan mağaza hatası
                const errorMessage = err.response.data.message;
                setError(errorMessage);
                toast.error(errorMessage);
                setFormData({}); // Formu sıfırla
                setTestSuccess(false);
            } else {
                // Diğer hatalar
                const errorMessage = err.response?.data?.message || 'API bağlantı hatası';
                setError(errorMessage);
                toast.error(errorMessage);
            }
            
            console.log('Hata detayı:', err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    const handleTestConnection = async () => {
        if (!validateForm()) {
            return;
        }
        
        setTestLoading(true);
        setError(null);
        setTestSuccess(false);

        try {
            // Bağlantıyı test et
            await ApiService.testMarketplaceConnection(marketplace.id, formData);
            setTestSuccess(true);
        } catch (err) {
            setError(err.message || 'Bağlantı testi başarısız oldu');
        } finally {
            setTestLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Hata mesajını temizle
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const toggleShowSecret = (field) => {
        setShowSecrets(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] backdrop-blur-sm" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-white"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    {marketplace.logo && (
                        <img 
                            src={marketplace.logo} 
                            alt={marketplace.name} 
                            className="w-6 h-6 object-contain" 
                        />
                    )}
                    {marketplace.name} Bağlantısı
                </h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {testSuccess && (
                    <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-400 text-sm flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        Bağlantı testi başarılı! API bilgileriniz doğru.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {getFormFields().map((field) => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                {field.label}
                            </label>
                            <div className="relative">
                                <input
                                    type={field.type === 'password' && !showSecrets[field.name] ? 'password' : 'text'}
                                    name={field.name}
                                    placeholder={field.placeholder}
                                    onChange={handleChange}
                                    value={formData[field.name] || ''}
                                    className={`w-full bg-gray-700 border ${fieldErrors[field.name] ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500`}
                                    required={field.required}
                                />
                                {field.type === 'password' && (
                                    <button
                                        type="button"
                                        onClick={() => toggleShowSecret(field.name)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showSecrets[field.name] ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                )}
                            </div>
                            {fieldErrors[field.name] && (
                                <p className="mt-1 text-sm text-red-400 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {fieldErrors[field.name]}
                                </p>
                            )}
                        </div>
                    ))}

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Mağaza Adı <span className="text-gray-500 text-xs">(Opsiyonel)</span>
                        </label>
                        <input
                            type="text"
                            name="storeName"
                            placeholder="Boş bırakırsanız otomatik alınacak"
                            onChange={handleChange}
                            value={formData.storeName || ''}
                            className={`w-full bg-gray-700 border ${fieldErrors.storeName ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500`}
                        />
                        {fieldErrors.storeName && (
                            <p className="mt-1 text-sm text-red-400 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {fieldErrors.storeName}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">
                            Boş bırakırsanız, mağaza adı pazaryeri API'sinden otomatik olarak alınacaktır.
                        </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={handleTestConnection}
                            disabled={testLoading || loading}
                            className={`flex-1 py-2 px-4 rounded-lg text-white font-medium ${
                                testLoading 
                                    ? 'bg-yellow-600/50 cursor-not-allowed' 
                                    : 'bg-yellow-600 hover:bg-yellow-700'
                            }`}
                        >
                            {testLoading ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}
                        </button>

                        <button
                            type="submit"
                            disabled={loading || testLoading}
                            className={`flex-1 py-2 px-4 rounded-lg text-white font-medium ${
                                loading 
                                    ? 'bg-blue-600/50 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {loading ? 'Bağlanıyor...' : 'Bağlan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MarketplaceConnectionModal; 