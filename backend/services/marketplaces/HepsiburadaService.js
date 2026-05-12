const axios = require('axios');
const BaseMarketplaceService = require('./BaseMarketplaceService');
const Order = require('../../models/Order');

class HepsiburadaService extends BaseMarketplaceService {
    constructor(credentials) {
        super(credentials);
        this.merchantId = credentials.merchantId?.trim();
        this.secretKey = credentials.secretKey?.trim();
        this.userAgent = credentials.userAgent?.trim();
        this.basicAuth = null;

        if (!this.merchantId || !this.secretKey || !this.userAgent) {
            throw new Error('Eksik kimlik bilgileri');
        }

        // Base URL'ler
        this.baseUrl = 'https://oms-external-sit.hepsiburada.com';
        this.questionsBaseUrl = 'https://api-asktoseller-merchant-sit.hepsiburada.com';
    }

    // Frontend'den gelen string status'ü API için sayıya çevir
    convertStatusToNumber(status) {
        switch (status) {
            case 'WAITING_FOR_ANSWER':
                return 1;
            case 'ANSWERED':
                return 2;
            case 'REJECTED':
                return 3;
            case 'AUTO_CLOSED':
                return 4;
            default:
                return 1;
        }
    }

    // API'den gelen status'ü frontend için string'e çevir
    convertApiStatusToString(status) {
        switch (status) {
            case 'WaitingForAnswer':
                return 'WAITING_FOR_ANSWER';
            case 'Answered':
                return 'ANSWERED';
            case 'Rejected':
                return 'REJECTED';
            case 'AutoClosed':
                return 'AUTO_CLOSED';
            default:
                return 'WAITING_FOR_ANSWER';
        }
    }

    // Önce auth metodu ekleyelim
    async auth() {
        try {
            this.basicAuth = Buffer.from(`${this.merchantId}:${this.secretKey}`).toString('base64');
            return true;
        } catch (error) {
            throw new Error('Auth başarısız');
        }
    }

    // Müşteri sorularını getir metodunu güncelleyelim
    async fetchCustomerQuestions(status = 'WAITING_FOR_ANSWER', page = 0, size = 25, sort = 'desc') {
        try {
            // Frontend'den gelen string status'ü sayıya çevir
            let numericStatus;
            if (Array.isArray(status)) {
                numericStatus = status.map(s => this.convertStatusToNumber(s)).join(',');
            } else {
                numericStatus = this.convertStatusToNumber(status);
            }

            const response = await axios({
                method: 'GET',
                url: `${this.questionsBaseUrl}/api/v1.0/issues`,
                auth: {
                    username: this.merchantId,
                    password: this.secretKey
                },
                headers: {
                    'merchantId': this.merchantId,
                    'User-Agent': this.userAgent
                },
                params: {
                    desc: sort === 'desc' ? 'true' : 'false',
                    page: (page + 1).toString(),
                    size: size.toString(),
                    status: numericStatus.toString() // API'ye sayısal status gönder
                }
            });

            

            const questions = response.data.data || [];
            
            const formattedQuestions = questions.map(question => ({
                id: question.id || '',
                issueNumber: question.issueNumber || '',
                productId: question.product?.id || '',
                productName: question.product?.name || '',
                text: question.lastContent || '',
                status: this.convertApiStatusToString(question.status), // API'den gelen status'ü string'e çevir
                creationDate: question.createdAt || '',
                expireDate: question.expireDate || '',
                source: question.subject?.source || 0,
                subject: question.subject?.name || '',
                customerName: question.customerId || 'Anonim',
                lastModifiedDate: question.lastModifiedAt || question.createdAt || ''
            }));

            return {
                content: formattedQuestions,
                totalPages: response.data.totalPageCount || 0,
                totalElements: response.data.totalItemCount || 0,
                size: response.data.currentPageSize || parseInt(size),
                number: (response.data.currentPage || 1) - 1,
                numberOfElements: formattedQuestions.length
            };
        } catch (error) {
            console.error('Müşteri soruları getirme hatası:', error);
            throw new Error(`Müşteri soruları getirilemedi: ${error.message}`);
        }
    }

    /**
     * Müşteri sorusunu yanıtla
     * @param {string} questionNumber - Soru numarası (issueNumber)
     * @param {string} answer - Yanıt metni (max 2000 karakter)
     * @param {Array} files - Opsiyonel: Yanıtla birlikte gönderilecek dosyalar
     */

    async answerCustomerQuestion(questionNumber, answer, files = []) {
        console.log(questionNumber);
        try {
            if (!answer || answer.length > 2000) {
                throw new Error('Yanıt metni 2000 karakterden uzun olamaz ve boş olamaz');
            }

            if (!questionNumber) {
                throw new Error('Soru numarası (issueNumber) gereklidir');
            }

            // Form data string'ini oluştur - sadece Answer parametresi
            const boundary = '---011000010111000001101001';
            const formDataString = 
                `--${boundary}\r\n` +
                'Content-Disposition: form-data; name="Answer"\r\n\r\n' +
                `${answer}\r\n` +
                `--${boundary}--`;

            // URL'de direkt olarak soru numarası kullan
            const response = await axios({
                method: 'POST',
                url: `${this.questionsBaseUrl}/api/v1.0/issues/${questionNumber}/answer`, // number sadece URL'de
                headers: {
                    'accept': 'application/json',
                    'merchantId': this.merchantId,
                    'User-Agent': this.userAgent,
                    'content-type': `multipart/form-data; boundary=${boundary}`,
                    'authorization': `Basic ${Buffer.from(`${this.merchantId}:${this.secretKey}`).toString('base64')}`
                },
                data: formDataString // Sadece Answer içeren form data
            });

            return {
                success: true,
                message: 'Soru başarıyla yanıtlandı',
                data: response.data
            };

        } catch (error) {
            console.error('Soru yanıtlama hatası:', error.response?.data || error.message);
            
            if (error.response?.data?.errors) {
                const errorMessages = error.response.data.errors
                    .map(err => `${err.fieldName}: ${err.message}`)
                    .join(', ');
                throw new Error(`Validasyon hatası: ${errorMessages}`);
            }

            throw new Error(`Soru yanıtlanamadı: ${error.message}`);
        }
    }

    // Kimlik bilgilerini doğrula
    async validateCredentials() {
        try {
            // Sadece API bağlantısını test et, siparişleri kaydetme
            const response = await axios({
                method: 'GET',
                url: `${this.baseUrl}/orders/merchantid/${this.merchantId}`,
                headers: {
                    'accept': 'application/json',
                    'User-Agent': this.userAgent,
                    'authorization': `Basic ${Buffer.from(`${this.merchantId}:${this.secretKey}`).toString('base64')}`
                },
                params: {
                    offset: 0,
                    limit: 1
                }
            });
            
            return true;
        } catch (error) {
            throw new Error('API kimlik bilgileri geçersiz');
        }
    }

    // Mağaza bilgilerini getir
    async fetchStoreInfo() {
        return {
            storeName: `Hepsiburada Mağazası (${this.merchantId})`
        };
    }

    async fetchOrders(userId, storeId, status = "Open", page = 0, size = 100) {
        try {
            if (!userId || !storeId) {
                throw new Error('userId ve storeId parametreleri gereklidir');
            }

            const offset = page * size;
            
            const response = await axios({
                method: 'GET',
                url: `${this.baseUrl}/orders/merchantid/${this.merchantId}`,
                headers: {
                    'accept': 'application/json',
                    'User-Agent': this.userAgent,
                    'authorization': `Basic ${Buffer.from(`${this.merchantId}:${this.secretKey}`).toString('base64')}`
                },
                params: {
                    offset: offset,
                    limit: size
                }
            });

            const orders = response.data.items || [];
            
            // Siparişleri veritabanına kaydet
            for (const order of orders) {
                try {
                    await Order.create({
                        userId: parseInt(userId),
                        marketplaceId: 'hepsiburada',
                        storeId: parseInt(storeId),
                        orderId: order.id,
                        orderData: order, // Tüm sipariş verisini JSON olarak kaydet
                        status: order.status,
                        orderDate: new Date(order.orderDate),
                        totalAmount: order.totalPrice?.amount || 0,
                        currency: 'TRY'
                    });
                } catch (error) {
                    if (error.name === 'SequelizeUniqueConstraintError') {
                        // Sipariş zaten var, güncelle
                        await Order.update({
                            status: order.status,
                            totalAmount: order.totalPrice?.amount || 0,
                            orderData: order
                        }, {
                            where: {
                                marketplaceId: 'hepsiburada',
                                orderId: order.id,
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
}

module.exports = HepsiburadaService;
