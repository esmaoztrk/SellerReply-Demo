const crypto = require('crypto');
const TrendyolService = require('./marketplaces/TrendyolService');
const HepsiburadaService = require('./marketplaces/HepsiburadaService');
const MarketplaceConnection = require('../models/MarketplaceConnection');
const db = require('../models');
const Order = require('../models/Order'); // Order modelini import et
require('dotenv').config(); // .env dosyasını yükle

class MarketplaceManager {
    constructor() {
        this.marketplaces = {
            trendyol: TrendyolService,
            hepsiburada: HepsiburadaService,
            // Diğer pazaryerleri buraya eklenecek
        };
        
        // Şifreleme için güvenli bir anahtar
        let encryptionKey = process.env.ENCRYPTION_KEY || process.env.PRIVATE_ENCRYPTION_KEY;
        
        if (!encryptionKey) {
            console.error('ENCRYPTION_KEY veya PRIVATE_ENCRYPTION_KEY çevresel değişkeni tanımlanmamış!');
            encryptionKey = 'default_encryption_key_for_development_only';
        }
        
        // Anahtarın 32 byte (256 bit) uzunluğunda olduğundan emin ol
        if (encryptionKey.length < 32) {
            // Anahtarı 32 byte'a tamamla
            encryptionKey = encryptionKey.padEnd(32, '0');
        } else if (encryptionKey.length > 32) {
            // Anahtarı 32 byte'a kısalt
            encryptionKey = encryptionKey.substring(0, 32);
        }
        
        this.encryptionKey = encryptionKey;
    }

    // API bilgilerini şifrele
    encrypt(text) {
        if (!text) {
            throw new Error('Şifrelenecek metin boş olamaz');
        }
        
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(this.encryptionKey), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        return {
            iv: iv.toString('hex'),
            encryptedData: encrypted,
            authTag: authTag.toString('hex')
        };
    }

    // API bilgilerini çöz
    decrypt(encrypted) {
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            Buffer.from(this.encryptionKey),
            Buffer.from(encrypted.iv, 'hex')
        );
        decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
        let decrypted = decipher.update(encrypted.encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    // Statik decrypt fonksiyonu - dışarıdan erişim için
    static decrypt(encrypted) {
        const instance = new MarketplaceManager();
        return instance.decrypt(encrypted);
    }

    // Pazaryeri bağlantısını kaydet
    async saveMarketplaceConnection(userId, marketplaceId, credentials, storeName = null) {
        try {
            // Pazaryerine göre özel kontrol yap
            let existingConnections = await MarketplaceConnection.findAll({
                where: { 
                    userId,
                    marketplaceId,
                }
            });

            // Mevcut bağlantıları kontrol et
            if (existingConnections.length > 0) {
                for (let connection of existingConnections) {
                    try {
                        // Şifrelenmiş bilgileri çöz
                        const decryptedCredentials = {};
                        for (const [key, value] of Object.entries(connection.credentials)) {
                            if (value && typeof value === 'object') {
                                decryptedCredentials[key] = this.decrypt(value);
                            }
                        }

                        // Pazaryerine göre kontrol
                        if (marketplaceId === 'trendyol') {
                            // Trendyol için supplierId kontrolü
                            if (decryptedCredentials.supplierId === credentials.supplierId) {
                                throw new Error('Bu Trendyol mağazası zaten bağlı.');
                            }
                        } 
                        else if (marketplaceId === 'hepsiburada') {
                            // Hepsiburada için merchantId kontrolü
                            if (decryptedCredentials.merchantId === credentials.merchantId) {
                                throw new Error('Bu Hepsiburada mağazası zaten bağlı.');
                            }
                        }
                    } catch (decryptError) {
                        console.error('Şifre çözme hatası:', decryptError);
                        continue; // Şifre çözme hatası olursa diğer bağlantıyı kontrol et
                    }
                }
            }

            // Her bir credential'ı ayrı ayrı şifrele
            const encryptedCredentials = {};
            for (const [key, value] of Object.entries(credentials)) {
                if (value === undefined || value === null) {
                    throw new Error(`${key} değeri tanımsız veya null olamaz`);
                }
                encryptedCredentials[key] = this.encrypt(value.toString());
            }

            // Mağaza adını belirle
            let finalStoreName = storeName;
            
            if (!finalStoreName && credentials.storeName) {
                finalStoreName = credentials.storeName;
            }
            
            if (!finalStoreName) {
                if (marketplaceId === 'trendyol') {
                    finalStoreName = `Trendyol Mağaza ${credentials.supplierId}`;
                } else if (marketplaceId === 'hepsiburada') {
                    finalStoreName = `Hepsiburada Mağaza ${credentials.merchantId}`;
                }
            }

            // Yeni bağlantıyı oluştur
            const connection = await MarketplaceConnection.create({
                userId,
                marketplaceId,
                credentials: encryptedCredentials,
                storeName: finalStoreName,
                status: 'active',
                lastSync: new Date()
            });

            // Siparişleri çek ve kaydet
            try {
                const service = this.initializeMarketplaceService(marketplaceId, credentials);
                
                // Son 30 günlük siparişleri çek
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                
                await service.fetchOrders(
                    userId,
                    connection.id, // storeId olarak connection.id'yi kullan
                    null, // status
                    0,    // page
                    200   // size
                );

                console.log(`${marketplaceId} siparişleri başarıyla çekildi ve kaydedildi.`);
            } catch (orderError) {
                console.error('Siparişleri çekme ve kaydetme hatası:', orderError);
                // Sipariş çekme hatası bağlantı kaydını engellemeyecek
            }

            return {
                success: true,
                message: 'Pazaryeri bağlantısı başarıyla kaydedildi.',
                connection: {
                    id: connection.id,
                    marketplaceId,
                    storeName: finalStoreName
                }
            };

        } catch (error) {
            console.error('Pazaryeri bağlantı hatası:', error);
            throw error;
        }
    }

    // Pazaryeri bağlantı bilgilerini getir
    async getMarketplaceConnection(userId, marketplaceId, storeName = null) {
        try {
            let query = { userId };
            
            // Eğer marketplaceId bir sayı ise, id olarak kullan
            if (!isNaN(marketplaceId)) {
                query.id = marketplaceId;
            } 
            // Değilse, marketplaceId olarak kullan (trendyol, hepsiburada gibi)
            else {
                query.marketplaceId = marketplaceId;
                
                // Eğer mağaza adı belirtilmişse, o mağazayı getir
                if (storeName) {
                    query.storeName = storeName;
                }
            }
            
            // Belirli bir mağaza adı belirtilmişse o mağazayı, belirtilmemişse ilk mağazayı getir
            const connection = await MarketplaceConnection.findOne({
                where: query
            });

            if (!connection) {
                return {
                    isConnected: false,
                    credentials: null
                };
            }

            // Şifrelenmiş kimlik bilgilerini çöz
            const decryptedCredentials = {};
            for (const [key, value] of Object.entries(connection.credentials)) {
                decryptedCredentials[key] = this.decrypt(value);
            }

            return {
                isConnected: true,
                credentials: decryptedCredentials,
                storeName: connection.storeName,
                marketplaceId: connection.marketplaceId
            };
        } catch (error) {
            console.error('Pazaryeri bağlantı bilgileri getirme hatası:', error);
            throw new Error('Pazaryeri bağlantı bilgileri alınamadı.');
        }
    }

    // Tüm bağlı pazaryerlerini listele
    async getConnectedMarketplaces(userId) {
        try {
            console.log(userId);
            const connections = await MarketplaceConnection.findAll({
                where: { userId },
                attributes: ['id', 'marketplaceId', 'storeName', 'updatedAt']
            });

            return connections.map(conn => ({
                id: conn.id, // Benzersiz bağlantı ID'si
                marketplaceId: conn.marketplaceId,
                storeName: conn.storeName || `${conn.marketplaceId.charAt(0).toUpperCase() + conn.marketplaceId.slice(1)} Mağazası`,
                isConnected: true,
                lastUpdated: conn.updatedAt
            }));
        } catch (error) {
            console.error('Bağlı pazaryerleri listesi alınamadı:', error);
            throw new Error('Bağlı pazaryerleri listesi alınamadı.');
        }
    }

    // Pazaryeri bağlantısını sil
    async deleteMarketplaceConnection(userId, marketplaceId) {
        try {
            // Transaction başlat
            const t = await db.sequelize.transaction();

            try {
                // Önce silinecek bağlantıyı bul
                const connection = await MarketplaceConnection.findOne({
                    where: { 
                        userId, 
                        id: marketplaceId
                    },
                    transaction: t
                });

                if (!connection) {
                    await t.rollback();
                    throw new Error('Mağaza bağlantısı bulunamadı');
                }

                // Önce bu mağazaya ait tüm siparişleri manuel olarak sil
                await Order.destroy({
                    where: {
                        storeId: connection.id
                    },
                    transaction: t
                });

                // Sonra mağaza bağlantısını sil
                await connection.destroy({ transaction: t });

                // Kalan sipariş sayısını kontrol et
                const remainingOrderCount = await Order.count({ transaction: t });
                
                // Eğer hiç sipariş kalmadıysa sequence'i sıfırla
                if (remainingOrderCount === 0) {
                    if (db.sequelize.options.dialect === 'postgres') {
                        // PostgreSQL için
                        await db.sequelize.query("ALTER SEQUENCE \"Orders_id_seq\" RESTART WITH 1", { transaction: t });
                    } else if (db.sequelize.options.dialect === 'mysql') {
                        // MySQL için
                        await db.sequelize.query("ALTER TABLE Orders AUTO_INCREMENT = 1", { transaction: t });
                    } else if (db.sequelize.options.dialect === 'sqlite') {
                        // SQLite için
                        await db.sequelize.query("DELETE FROM sqlite_sequence WHERE name = 'Orders'", { transaction: t });
                    }
                }

                // Kalan mağaza bağlantısı sayısını kontrol et
                const remainingConnectionCount = await MarketplaceConnection.count({ transaction: t });
                
                // Eğer hiç mağaza bağlantısı kalmadıysa sequence'i sıfırla
                if (remainingConnectionCount === 0) {
                    if (db.sequelize.options.dialect === 'postgres') {
                        // PostgreSQL için
                        await db.sequelize.query("ALTER SEQUENCE \"MarketplaceConnections_id_seq\" RESTART WITH 1", { transaction: t });
                    } else if (db.sequelize.options.dialect === 'mysql') {
                        // MySQL için
                        await db.sequelize.query("ALTER TABLE MarketplaceConnections AUTO_INCREMENT = 1", { transaction: t });
                    } else if (db.sequelize.options.dialect === 'sqlite') {
                        // SQLite için
                        await db.sequelize.query("DELETE FROM sqlite_sequence WHERE name = 'MarketplaceConnections'", { transaction: t });
                    }
                }

                // Transaction'ı onayla
                await t.commit();

                return {
                    success: true,
                    message: 'Mağaza bağlantısı ve ilgili tüm siparişler başarıyla silindi'
                };
            } catch (error) {
                // Hata durumunda transaction'ı geri al
                await t.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Mağaza bağlantısı silme hatası:', error);
            throw new Error(`Mağaza bağlantısı silinemedi: ${error.message}`);
        }
    }

    // Pazaryeri servisini başlat
    initializeMarketplaceService(marketplaceId, credentials) {
        const ServiceClass = this.marketplaces[marketplaceId];
        if (!ServiceClass) {
            throw new Error(`Desteklenmeyen pazaryeri: ${marketplaceId}`);
        }
        return new ServiceClass(credentials);
    }

    static async validateConnection(marketplaceId, credentials) {
        const service = this.getService(marketplaceId, credentials);
        const isValid = await service.validateCredentials();
        
        if (!isValid) {
            throw new Error('API bilgileri geçersiz');
        }
        
        return service;
    }

    static async saveConnection(userId, marketplaceId, encryptedCredentials) {
        await db.query(
            'INSERT INTO marketplace_connections (user_id, marketplace_id, credentials) VALUES ($1, $2, $3) ON CONFLICT (user_id, marketplace_id) DO UPDATE SET credentials = $3',
            [userId, marketplaceId, encryptedCredentials]
        );
    }

    static getService(marketplaceId, credentials) {
        switch (marketplaceId.toLowerCase()) {
            case 'trendyol':
                return new TrendyolService(credentials);
            case 'hepsiburada':
                return new HepsiburadaService(credentials);
            default:
                throw new Error('Desteklenmeyen pazaryeri');
        }
    }

    async connectMarketplace(userId, marketplaceId, credentials) {
        try {
            // Mevcut bağlantıyı kontrol et
            let connection = await MarketplaceConnection.findOne({
                where: { userId, marketplaceId }
            });

            // Bağlantı bilgilerini hazırla
            const connectionData = {
                userId,
                marketplaceId,
                credentials: JSON.stringify(credentials),
                isConnected: true
            };

            // Eğer storeName belirtilmişse, kullan
            if (credentials.storeName) {
                connectionData.storeName = credentials.storeName;
            } else {
                // Brands API'sinden mağaza adını almaya çalış
                try {
                    // Pazaryeri API'sine bağlan ve mağaza bilgilerini al
                    const marketplaceApi = this.getMarketplaceApi(marketplaceId, credentials);
                    const brandInfo = await marketplaceApi.getBrandInfo();
                    
                    // Mağaza adını kaydet
                    if (brandInfo && brandInfo.name) {
                        connectionData.storeName = brandInfo.name;
                    } else {
                        // Varsayılan mağaza adı
                        connectionData.storeName = `${marketplaceId.charAt(0).toUpperCase() + marketplaceId.slice(1)} Mağazası`;
                    }
                } catch (apiError) {
                    console.error(`Mağaza adı alınamadı (${marketplaceId}):`, apiError);
                    // Hata durumunda varsayılan mağaza adı
                    connectionData.storeName = `${marketplaceId.charAt(0).toUpperCase() + marketplaceId.slice(1)} Mağazası`;
                }
            }

            // Bağlantıyı oluştur veya güncelle
            if (connection) {
                await connection.update(connectionData);
            } else {
                await MarketplaceConnection.create(connectionData);
            }

            return true;
        } catch (error) {
            console.error(`Pazaryeri bağlantısı kurulamadı (${marketplaceId}):`, error);
            throw new Error('Pazaryeri bağlantısı kurulamadı.');
        }
    }
}

module.exports = new MarketplaceManager(); 