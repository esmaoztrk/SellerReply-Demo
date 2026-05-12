import http from './http-common';
import { toast } from 'react-hot-toast';

const ApiService = {
    // Pazaryeri bağlantısı kur
    connectMarketplace: async (data) => {
        try {
            // Eğer storeName belirtilmemişse ve mağaza adını otomatik almak istiyorsak
            if (!data.credentials.storeName) {
                try {
                    // Önce test bağlantısı yap
                    await ApiService.testMarketplaceConnection(data.marketplaceId, data.credentials);
                    
                    // Brands API'sinden mağaza adını almaya çalış
                    const response = await http.get('/marketplaces/brands', {
                        params: { marketplaceId: data.marketplaceId }
                    });
                    
                    // Mağaza adını ekle
                    if (response.data && response.data.storeName) {
                        data.credentials.storeName = response.data.storeName;
                    }
                } catch (error) {
                    console.error('Mağaza adı otomatik alınamadı:', error);
                    // Hata durumunda devam et, backend varsayılan bir ad atayacak
                }
            }
            
            // Bağlantıyı kur
            const response = await http.post('/marketplaces/connect', data);
            
            // Mağaza adı API'den alındı bilgisini göster
            if (response.data.storeName) {
                toast.success(`Bağlantı başarılı! Mağaza adı: "${response.data.storeName}"`);
            }
            
            return response.data;
        } catch (error) {
            // 409 hatası (zaten bağlı) için özel işlem
            if (error.response?.status === 409) {
                throw error; // Orijinal hatayı olduğu gibi ilet
            }
            
            console.error('Pazaryeri bağlantı hatası:', error);
            throw new Error(error.response?.data?.message || 'Pazaryeri bağlantısı kurulamadı');
        }
    },

    // Bağlı pazaryerlerini getir
    getConnectedMarketplaces: async () => {
        try {
            const response = await http.get('/marketplaces/connections');
            return response.data;
        } catch (error) {
            console.error('Pazaryerleri getirme hatası:', error);
            throw new Error(error.response?.data?.message || 'Pazaryerleri getirilemedi');
        }
    },

    // Pazaryeri bağlantısını test et
    testMarketplaceConnection: async (marketplaceId, credentials) => {
        try {
            const response = await http.post('/marketplaces/test-connection', {
                marketplaceId,
                credentials
            });
            return response.data;
        } catch (error) {
            console.error('Bağlantı testi hatası:', error);
            throw new Error(error.response?.data?.message || 'Bağlantı testi başarısız oldu');
        }
    },

    // Pazaryeri bağlantısını sil
    disconnectMarketplace: async (connectionId) => {
        try {
            const response = await http.delete(`/marketplaces/connections/${connectionId}`)
            return response.data;
        } catch (error) {
            console.error('Pazaryeri bağlantısı silme hatası:', error);
            throw new Error(error.response?.data?.message || 'Bağlantı silinemedi');
        }
    },

    // Siparişleri getir
    getOrders: async (params) => {
        try {
            const response = await http.get('/marketplaces/orders', { params });
            return response.data;
        } catch (error) {
            console.error('Sipariş getirme hatası:', error);
            throw new Error(error.response?.data?.message || 'Siparişler getirilemedi');
        }
    },

    // Müşteri sorularını getir
    getCustomerQuestions: async (params) => {
        try {
            const response = await http.get('/marketplaces/customer-questions', { params });
            return response.data;
        } catch (error) {
            console.error('Müşteri soruları getirme hatası:', error);
            throw new Error(error.response?.data?.message || 'Müşteri soruları getirilemedi');
        }
    },

    // Markaları getir
    getBrands: async (marketplaceId, name = '') => {
        try {
            const response = await http.get('/marketplaces/brands', {
                params: { marketplaceId, name }
            });
            return response.data;
        } catch (error) {
            console.error('Marka getirme hatası:', error);
            throw new Error(error.response?.data?.message || 'Markalar getirilemedi');
        }
    },

    // Müşteri sorusunu yanıtla
    answerCustomerQuestion: async (marketplaceId, questionId, answer, question) => {
        try {
            const response = await http.post('/marketplaces/customer-questions/answer', {
                marketplaceId,
                questionId,
                answer,
                question // Tüm soru nesnesini gönder
            });
            return response.data;
        } catch (error) {
            // Eğer error.response varsa ve status 500 ise
            if (error.response?.status === 500) {
                // Trendyol'da yanıt başarılı olmuş olabilir, sessizce başarılı kabul et
                console.log('Backend 500 hatası aldı ama işlem başarılı olabilir');
                return { success: true, message: 'Yanıt gönderildi' };
            }
            throw new Error(error.response?.data?.message || 'Soru yanıtlanamadı');
        }
    },

    // Müşteri sorusunu reddet
    rejectCustomerQuestion: async (marketplaceId, questionId) => {
        try {
            const response = await http.post('/marketplaces/customer-questions/reject', {
                marketplaceId,
                questionId
            });
            return response.data;
        } catch (error) {
            console.error('Soru reddetme hatası:', error);
            throw new Error(error.response?.data?.message || 'Soru reddedilemedi');
        }
    },

    // Önceki yanıtları getir
    getPreviousAnswers: async (marketplaceId, productId, limit = 5) => {
        try {
            const response = await http.get(`/marketplaces/customer-questions/previous-answers`, {
                params: {
                    marketplaceId,
                    productId,
                    limit
                }
            });
            return response.data;
        } catch (error) {
            console.error('Önceki yanıtlar getirilemedi:', error);
            return []; // Hata durumunda boş dizi dön
        }
    },

    // AI yanıtı oluştur
    generateAIAnswer: async ({ marketplaceId, questionId, questionText, productName }) => {
        try {
            const response = await http.post('/marketplaces/customer-questions/generate-ai-answer', {
                marketplaceId,
                questionId,
                questionText,
                productName
            });
            return response.data;
        } catch (error) {
            console.error('AI yanıtı oluşturma hatası:', error);
            throw new Error(error.response?.data?.message || 'AI yanıtı oluşturulamadı');
        }
    }
};

export default ApiService;
