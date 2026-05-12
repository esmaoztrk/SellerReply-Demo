const axios = require('axios');
const base64 = require('base-64');
const BaseMarketplaceService = require('./BaseMarketplaceService');
const Order = require('../../models/Order');

class TrendyolService extends BaseMarketplaceService {
    constructor(credentials) {
        super(credentials);
        if (!credentials.supplierId || !credentials.username || !credentials.password) {
            throw new Error('Eksik kimlik bilgileri');
        }
        
        this.baseUrl = "https://api.trendyol.com/sapigw/suppliers";
        this.basicAuth = base64.encode(`${credentials.username}:${credentials.password}`);
        this.supplierId = credentials.supplierId;
    }

    getHeaders() {
        return {
            'Authorization': `Basic ${this.basicAuth}`,
            'Content-Type': 'application/json',
            'User-Agent': `${this.supplierId} - SelfIntegration`,
        };
    }

    async validateCredentials() {
        try {
            const response = await axios.get(`${this.baseUrl}/${this.supplierId}/orders`, {
                params: { size: 1 },
                headers: this.getHeaders(),
                timeout: 5000
            });
            if (response.status === 200) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            if (error.response) {
                const { status } = error.response;
                if (status === 401 || status === 403) {
                    throw new Error('Yetkilendirme hatası: API kimlik bilgileri yanlış');
                }
            }
            throw new Error('API bağlantısı başarısız: ' + error.message);
        }
    }
    

    async fetchOrders(userId, storeId, status = null, page = 0, size = 100) {
        try {
            if (!userId || !storeId) {
                throw new Error('userId ve storeId parametreleri gereklidir');
            }

            const params = {
                page,
                size
            };
            
            if (status) {
                params.status = status;
            }
            
            const response = await axios.get(`${this.baseUrl}/${this.supplierId}/orders`, {
                params,
                headers: this.getHeaders()
            });

            const orders = response.data.content || [];
            
            // Siparişleri veritabanına kaydet
            for (const order of orders) {
                try {
                    await Order.create({
                        userId: parseInt(userId),
                        marketplaceId: 'trendyol',
                        storeId: parseInt(storeId),
                        orderId: order.id.toString(),
                        orderData: order, // Tüm sipariş verisini JSON olarak kaydet
                        status: order.status,
                        orderDate: new Date(order.orderDate),
                        totalAmount: order.totalPrice || 0,
                        currency: 'TRY'
                    });
                } catch (error) {
                    if (error.name === 'SequelizeUniqueConstraintError') {
                        // Sipariş zaten var, güncelle
                        await Order.update({
                            status: order.status,
                            totalAmount: order.totalPrice || 0,
                            orderData: order
                        }, {
                            where: {
                                marketplaceId: 'trendyol',
                                orderId: order.id.toString(),
                                storeId: parseInt(storeId)
                            }
                        });
                    } else {
                        console.error(`Sipariş kaydedilemedi (${order.id}):`, error);
                    }
                }
            }

            return orders;
        } catch (error) {
            console.error('Sipariş getirme hatası:', error);
            throw new Error(`Siparişler getirilemedi: ${error.message}`);
        }
    }

    async fetchCustomerQuestions(status = "WAITING_FOR_ANSWER", page = 0, size = 50, sort = 'creationDate,desc') {
        try {
            console.log('Trendyol müşteri soruları getiriliyor...');
            console.log('Parametreler:', { 
                status, 
                page,
                size,
                sort
            });
            
            const response = await axios.get(`${this.baseUrl}/${this.supplierId}/questions/filter`, {
                params: {
                    status,
                    page,
                    size,
                    orderByField: 'CreatedDate',
                    orderByDirection: 'DESC'
                },
                headers: this.getHeaders(),
                timeout: 5000,
            });
            
            // Yanıtı işle ve dönüştür
            if (response && response.data) {
                const questions = response.data.content || [];
                
                return {
                    content: questions.map(question => ({
                        id: question.id,
                        text: question.text,
                        status: question.status,
                        creationDate: question.creationDate,
                        productName: question.productName,
                        productId: question.productId,
                        answer: question.answer
                    })),
                    totalElements: response.data.totalElements || 0,
                    totalPages: response.data.totalPages || 0,
                    currentPage: page
                };
            }
            
            return {
                content: [],
                totalElements: 0,
                totalPages: 0,
                currentPage: page
            };
        } catch (error) {
            console.error("Trendyol API müşteri soruları çekme hatası:", error.response ? error.response.data : error.message);
            throw new Error("Müşteri soruları çekilemedi.");
        }
    }

    async makeRequest(endpoint, method, params = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            
            const response = await axios({
                method,
                url,
                params,
                headers: this.getHeaders(),
                timeout: 5000
            });
            
            return response;
        } catch (error) {
            console.error('Trendyol API hatası:', error.response?.status, error.response?.data);
            throw new Error(error.response?.data?.message || 'Trendyol API hatası');
        }
    }

    async fetchStoreInfo() {
        try {
            console.log('Trendyol mağaza bilgileri getiriliyor...');
            
            // Supplier ID'yi kullanarak mağaza bilgilerini getir
            const supplierId = this.credentials.supplierId;
            if (!supplierId) {
                throw new Error('Supplier ID bulunamadı');
            }
            
            // Önce brands API'sinden ilk markayı alarak mağaza adını belirlemeye çalış
            try {
                const brandsResponse = await this.makeRequest('/brands', 'GET');
                if (brandsResponse && brandsResponse.data && brandsResponse.data.length > 0) {
                    // İlk markanın adını kullanarak mağaza adını oluştur
                    const firstBrand = brandsResponse.data[0];
                    return {
                        storeName: `${firstBrand.name} Mağazası`,
                        supplierId,
                        brandId: firstBrand.id
                    };
                }
            } catch (brandsError) {
                console.error('Trendyol markalar API hatası:', brandsError);
            }
            
            // Eğer brands API'sinden mağaza adı alınamazsa, varsayılan bir ad kullan
            return {
                storeName: `Trendyol Mağazası (${supplierId})`,
                supplierId
            };
        } catch (error) {
            console.error('Trendyol mağaza bilgileri getirme hatası:', error.message);
            throw error;
        }
    }

    async fetchBrands(name = '') {
        try {
            console.log('Trendyol markaları getiriliyor...');
            console.log('Credentials:', JSON.stringify(this.credentials, null, 2));
            
            // API isteği için URL ve parametreler
            const url = `${this.baseUrl}/brands`;
            const params = name ? { name } : {};
            
            // API isteği yap
            const response = await this.makeRequest('GET', url, params);
            
            // Yanıtı işle
            if (response && response.data) {
                return response.data.map(brand => ({
                    id: brand.id,
                    name: brand.name
                }));
            }
            
            return [];
        } catch (error) {
            console.error('Trendyol marka bilgileri getirme hatası:', error.message);
            return []; // Hata durumunda boş dizi döndür
        }
    }

    async fetchProductDetails(productId) {
        try {
            console.log('Trendyol ürün detayları getiriliyor...');
            console.log('Parametreler:', { productId });
            
            const response = await axios.get(`${this.baseUrl}/${this.supplierId}/products/${productId}`, {
                headers: this.getHeaders(),
                timeout: 5000,
            });
            
            if (response && response.data) {
                const product = response.data;
                
                return {
                    id: product.id,
                    name: product.title,
                    description: product.description,
                    brand: product.brand?.name,
                    price: product.price,
                    attributes: product.attributes,
                    images: product.images,
                    categories: product.categories
                };
            }
            
            return null;
        } catch (error) {
            console.error("Trendyol API ürün detayları getirme hatası:", error.response ? error.response.data : error.message);
            throw new Error("Ürün detayları getirilemedi.");
        }
    }

    async answerCustomerQuestion(questionId, answer) {
        try {
            console.log('Trendyol müşteri sorusu yanıtlanıyor...');
            console.log('Parametreler:', { questionId, answer });
            
            const response = await axios.post(
                `${this.baseUrl}/${this.supplierId}/questions/${questionId}/answers`,
                { text: answer },
                {
                    headers: this.getHeaders(),
                    timeout: 5000,
                }
            );
            
            return response.data;
        } catch (error) {
            console.error("Trendyol API soru yanıtlama hatası:", error.response ? error.response.data : error.message);
            throw new Error("Soru yanıtlanamadı.");
        }
    }

    async rejectCustomerQuestion(questionId) {
        try {
            console.log('Trendyol müşteri sorusu reddediliyor...');
            console.log('Parametreler:', { questionId });
            
            const response = await axios.post(
                `${this.baseUrl}/${this.supplierId}/questions/${questionId}/reject`,
                {},
                {
                    headers: this.getHeaders(),
                    timeout: 5000,
                }
            );
            
            return response.data;
        } catch (error) {
            console.error("Trendyol API soru reddetme hatası:", error.response ? error.response.data : error.message);
            throw new Error("Soru reddedilemedi.");
        }
    }
}

module.exports = TrendyolService;
