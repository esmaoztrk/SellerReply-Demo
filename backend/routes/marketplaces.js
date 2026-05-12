const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/authMiddleware');
const MarketplaceManager = require('../services/MarketplaceManager');
const MarketplaceConnection = require('../models/MarketplaceConnection');
const CustomerQuestion = require('../models/CustomerQuestion');
const OpenAiService = require('../services/OpenAiService');
const { Op } = require('sequelize');

// Pazaryeri bağlantılarını getir
router.get('/connections', auth, async (req, res) => {
  try {
    const userId = req.userId;
    console.log(userId);
    const connections = await MarketplaceManager.getConnectedMarketplaces(userId);
    res.json(connections);
  } catch (error) {
    console.error('Pazaryeri bağlantıları getirme hatası:', error);
    res.status(500).json({ message: 'Pazaryeri bağlantıları getirilemedi' });
  }
});

// Pazaryeri bağlantısı kur
router.post('/connect', [
  auth,
  body('marketplaceId').notEmpty().withMessage('Pazaryeri ID gereklidir'),
  body('credentials').isObject().withMessage('Kimlik bilgileri gereklidir')
], async (req, res) => {
  // Validasyon hatalarını kontrol et
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { marketplaceId, credentials } = req.body;
    const userId = req.userId;

    // Pazaryeri servisini başlat ve kimlik bilgilerini doğrula
    let service;
    try {
      service = MarketplaceManager.initializeMarketplaceService(marketplaceId, credentials);
      await service.validateCredentials();
    } catch (error) {
      return res.status(400).json({ message: `API kimlik bilgileri geçersiz: ${error.message}` });
    }

    // Kimlik bilgilerini şifrele ve kaydet
    const result = await MarketplaceManager.saveMarketplaceConnection(userId, marketplaceId, credentials);

    res.json({ 
      success: true, 
      message: 'Pazaryeri bağlantısı başarıyla kaydedildi',
      storeName: result.storeName,
      id: result.id
    });
  } catch (error) {
    console.error('Pazaryeri bağlantı hatası:', error);
    // Özel hata mesajlarını kontrol et
    if (error.message.includes('zaten bağlı')) {
      return res.status(409).json({ message: error.message }); // 409 Conflict
    }
    res.status(500).json({ message: 'Pazaryeri bağlantısı kaydedilemedi' });
  }
});

// Pazaryeri bağlantısını test et
router.post('/test-connection', [
  auth,
  body('marketplaceId').notEmpty().withMessage('Pazaryeri ID gereklidir'),
  body('credentials').isObject().withMessage('Kimlik bilgileri gereklidir')
], async (req, res) => {
  // Validasyon hatalarını kontrol et
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { marketplaceId, credentials } = req.body;

    // Pazaryeri servisini başlat ve kimlik bilgilerini doğrula
    let service;
    try {
      service = MarketplaceManager.initializeMarketplaceService(marketplaceId, credentials);
      await service.validateCredentials();
    } catch (error) {
      return res.status(400).json({ message: `API kimlik bilgileri geçersiz: ${error.message}` });
    }

    res.json({ success: true, message: 'Bağlantı testi başarılı' });
  } catch (error) {
    console.error('Bağlantı testi hatası:', error);
    res.status(500).json({ message: 'Bağlantı testi başarısız oldu' });
  }
});

// Pazaryeri bağlantısını sil
router.delete('/connections/:connectionId', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { connectionId } = req.params;

    // Veritabanından bağlantıyı sil
    await MarketplaceConnection.destroy({
      where: { id: connectionId, userId }
    });

    res.json({ success: true, message: 'Pazaryeri bağlantısı başarıyla silindi' });
  } catch (error) {
    console.error('Pazaryeri bağlantısı silme hatası:', error);
    res.status(500).json({ message: 'Pazaryeri bağlantısı silinemedi' });
  }
});

// Markaları getir
router.get('/brands', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { marketplaceId } = req.query;

    // marketplaceId bir string ise ve "hepsiburada" gibi bir değerse
    if (typeof marketplaceId === 'string' && isNaN(parseInt(marketplaceId))) {
      // En son eklenen bağlantıyı bul
      const connection = await MarketplaceConnection.findOne({
        where: { 
          userId,
          marketplaceId 
        },
        order: [['createdAt', 'DESC']]
      });

      if (!connection) {
        return res.status(404).json({ message: 'Pazaryeri bağlantısı bulunamadı' });
      }

      // Şifrelenmiş kimlik bilgilerini çöz
      const decryptedCredentials = {};
      for (const [key, value] of Object.entries(connection.credentials)) {
        decryptedCredentials[key] = MarketplaceManager.decrypt(value);
      }

      // Pazaryeri servisini başlat - connection.marketplaceId kullan (trendyol, hepsiburada gibi)
      const service = MarketplaceManager.initializeMarketplaceService(
        connection.marketplaceId, 
        decryptedCredentials
      );

      // Markaları getir
      const brands = await service.fetchBrands();
      
      // Mağaza bilgilerini getir
      const storeInfo = await service.fetchStoreInfo();
      
      // Yanıtı oluştur
      res.json({
        brands,
        storeName: storeInfo.storeName
      });
    } else {
      // Sayısal ID ile arama
      const connection = await MarketplaceConnection.findOne({
        where: { 
          id: parseInt(marketplaceId), 
          userId 
        }
      });

      if (!connection) {
        return res.status(404).json({ message: 'Pazaryeri bağlantısı bulunamadı' });
      }

      // Şifrelenmiş kimlik bilgilerini çöz
      const decryptedCredentials = {};
      for (const [key, value] of Object.entries(connection.credentials)) {
        decryptedCredentials[key] = MarketplaceManager.decrypt(value);
      }

      // Pazaryeri servisini başlat - connection.marketplaceId kullan (trendyol, hepsiburada gibi)
      const service = MarketplaceManager.initializeMarketplaceService(
        connection.marketplaceId, 
        decryptedCredentials
      );

      // Markaları getir
      const brands = await service.fetchBrands();
      
      // Mağaza bilgilerini getir
      const storeInfo = await service.fetchStoreInfo();
      
      // Yanıtı oluştur
      res.json({
        brands,
        storeName: storeInfo.storeName
      });
    }
  } catch (error) {
    console.error('Markalar getirme hatası:', error);
    res.status(500).json({ message: 'Markalar getirilemedi' });
  }
});

// Müşteri sorularını getir
router.get('/customer-questions', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { 
      marketplaceId, // Bu artık connection ID'si
      page = 0, 
      status = 'WAITING_FOR_ANSWER', 
      size = 50, // Varsayılan olarak daha fazla soru
      sort = 'creationDate,desc' // Varsayılan sıralama
    } = req.query;

    // Connection ID'ye göre bağlantıyı getir
    const connection = await MarketplaceConnection.findOne({
      where: { 
        id: parseInt(marketplaceId), // String'i integer'a dönüştür
        userId 
      }
    });

    if (!connection) {
      return res.status(404).json({ message: 'Pazaryeri bağlantısı bulunamadı' });
    }

    // Şifrelenmiş kimlik bilgilerini çöz
    const decryptedCredentials = {};
    for (const [key, value] of Object.entries(connection.credentials)) {
      decryptedCredentials[key] = MarketplaceManager.decrypt(value);
    }

    // Pazaryeri servisini başlat - connection.marketplaceId kullan (trendyol, hepsiburada gibi)
    const service = MarketplaceManager.initializeMarketplaceService(
      connection.marketplaceId, 
      decryptedCredentials
    );

    // Müşteri sorularını getir (tarih parametreleri olmadan)
    const questions = await service.fetchCustomerQuestions(
      status, 
      parseInt(page),
      parseInt(size),
      sort
    );

    res.json(questions);
  } catch (error) {
    console.error('Müşteri soruları getirme hatası:', error);
    res.status(500).json({ message: 'Müşteri soruları getirilemedi' });
  }
});

// Müşteri sorusunu yanıtla
router.post('/customer-questions/answer', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { marketplaceId, questionId, answer, question } = req.body;

    if (!marketplaceId || !questionId || !answer) {
      return res.status(400).json({ message: 'Eksik parametreler' });
    }

    // Connection ID'ye göre bağlantıyı getir
    const connection = await MarketplaceConnection.findOne({
      where: { 
        id: parseInt(marketplaceId),
        userId 
      }
    });

    if (!connection) {
      return res.status(404).json({ message: 'Pazaryeri bağlantısı bulunamadı' });
    }

    // Şifrelenmiş kimlik bilgilerini çöz
    const decryptedCredentials = {};
    for (const [key, value] of Object.entries(connection.credentials)) {
      decryptedCredentials[key] = MarketplaceManager.decrypt(value);
    }

    // Pazaryeri servisini başlat
    const service = MarketplaceManager.initializeMarketplaceService(
      connection.marketplaceId, 
      decryptedCredentials
    );

    // Pazaryerine göre soru ID'sini belirle
    let finalQuestionId;
    if (connection.marketplaceId === 'hepsiburada') {
      // Hepsiburada için issueNumber kullan
      finalQuestionId = question.issueNumber || questionId;
      console.log('Hepsiburada issueNumber:', finalQuestionId);
    } else if (connection.marketplaceId === 'trendyol') {
      // Trendyol için questionId kullan
      finalQuestionId = questionId;
      console.log('Trendyol questionId:', finalQuestionId);
    }

    // Soruyu yanıtla
    await service.answerCustomerQuestion(finalQuestionId, answer);

    // Veritabanına kaydet
    await CustomerQuestion.create({
      marketplaceId: connection.marketplaceId,
      questionId: finalQuestionId,
      productName: question.productName,
      text: question.text,
      answer,
      status: 'ANSWERED',
      barcode: question.barcode,
      category: question.category,
      answerDate: new Date()
    });

    res.json({ success: true, message: 'Soru başarıyla yanıtlandı' });
  } catch (error) {
    console.error('Soru yanıtlama hatası:', error);
    res.status(500).json({ message: 'Soru yanıtlanamadı', error: error.message });
  }
});

// Müşteri sorusunu reddet
router.post('/customer-questions/reject', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { marketplaceId, questionId } = req.body; // marketplaceId artık connection ID'si

    if (!marketplaceId || !questionId) {
      return res.status(400).json({ message: 'Eksik parametreler' });
    }

    // Connection ID'ye göre bağlantıyı getir
    const connection = await MarketplaceConnection.findOne({
      where: { 
        id: parseInt(marketplaceId), // String'i integer'a dönüştür
        userId 
      }
    });

    if (!connection) {
      return res.status(404).json({ message: 'Pazaryeri bağlantısı bulunamadı' });
    }

    // Şifrelenmiş kimlik bilgilerini çöz
    const decryptedCredentials = {};
    for (const [key, value] of Object.entries(connection.credentials)) {
      decryptedCredentials[key] = MarketplaceManager.decrypt(value);
    }

    // Pazaryeri servisini başlat - connection.marketplaceId kullan (trendyol, hepsiburada gibi)
    const service = MarketplaceManager.initializeMarketplaceService(
      connection.marketplaceId, 
      decryptedCredentials
    );

    // Soruyu reddet
    await service.rejectCustomerQuestion(questionId);

    res.json({ success: true, message: 'Soru başarıyla reddedildi' });
  } catch (error) {
    console.error('Soru reddetme hatası:', error);
    res.status(500).json({ message: 'Soru reddedilemedi', error: error.message });
  }
});

// Önceki yanıtlanmış soruları getir
router.get('/customer-questions/previous-answers', async (req, res) => {
    try {
        const { marketplaceId, productId, limit = 5 } = req.query;

        // productId yoksa boş dizi dön
        if (!productId) {
            return res.json([]);
        }

        // Veritabanından o ürüne ait yanıtlanmış soruları çek
        const previousAnswers = await CustomerQuestion.findAll({
            where: {
                marketplaceId,
                productId,
                status: 'ANSWERED'
            },
            order: [['updatedAt', 'DESC']], // En son yanıtlananlar önce gelsin
            limit: parseInt(limit),
            attributes: ['text', 'answer', 'updatedAt', 'productName']
        });

        res.json(previousAnswers);
    } catch (error) {
        console.error('Önceki yanıtlar getirilemedi:', error);
        // Hata durumunda boş dizi dön
        res.json([]);
    }
});

// AI yanıtı oluştur
router.post('/customer-questions/generate-ai-answer', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const { marketplaceId, questionText, productName, barcode } = req.body;

        console.log('Gelen soru bilgileri:', {
            marketplaceId,
            questionText,
            productName,
            barcode
        });

        // Connection ID'ye göre bağlantıyı getir
        const connection = await MarketplaceConnection.findOne({
            where: { 
                id: parseInt(marketplaceId),
                userId 
            }
        });
      

        if (!connection) {
            return res.status(404).json({ message: 'Pazaryeri bağlantısı bulunamadı' });
        }
        const decryptedCredentials = {};
        for (const [key, value] of Object.entries(connection.credentials)) {
          decryptedCredentials[key] = MarketplaceManager.decrypt(value);
        }

        let allRelatedQuestions = [];

        // 1. Veritabanından yanıtları getir
        if (barcode) {
            const dbSameProductQuestions = await CustomerQuestion.findAll({
                where: {
                    barcode,
                    status: 'ANSWERED'
                },
                order: [['answerDate', 'DESC']],
                limit: 10,
                attributes: ['text', 'answer', 'answerDate', 'productName']
            });

            allRelatedQuestions.push(...dbSameProductQuestions.map(q => ({
                ...q.toJSON(),
                type: 'SAME_PRODUCT_DB',
                similarity: 1.0,
                source: 'database'
            })));
        }

        // 2. Veritabanından benzer ürün yanıtlarını getir
        if (productName) {
            const keywords = productName.split(' ')
                .filter(word => word.length > 2)
                .map(word => word.toLowerCase());

            if (keywords.length > 0) {
                const dbSimilarProductQuestions = await CustomerQuestion.findAll({
                    where: {
                        status: 'ANSWERED',
                        ...(barcode && { barcode: { [Op.ne]: barcode } }),
                        [Op.or]: keywords.map(keyword => ({
                            productName: {
                                [Op.iLike]: `%${keyword}%`
                            }
                        }))
                    },
                    order: [['answerDate', 'DESC']],
                    limit: 10,
                    attributes: ['text', 'answer', 'answerDate', 'productName']
                });

                allRelatedQuestions.push(...dbSimilarProductQuestions.map(q => ({
                    ...q.toJSON(),
                    type: 'SIMILAR_PRODUCT_DB',
                    similarity: 0.5,
                    source: 'database'
                })));
            }
        }

        // 3. API'den yanıtlanmış soruları getir
        try {
            // Şifrelenmiş kimlik bilgilerini çöz
            const decryptedCredentials = {};
            for (const [key, value] of Object.entries(connection.credentials)) {
                decryptedCredentials[key] = MarketplaceManager.decrypt(value);
            }

            // Pazaryeri servisini başlat
            const service = MarketplaceManager.initializeMarketplaceService(
                connection.marketplaceId,
                decryptedCredentials
            );

            // API'den yanıtlanmış soruları getir
            const apiQuestions = await service.fetchCustomerQuestions(
                'ANSWERED',
                0,
                50,
                'creationDate,desc'
            );

            // API'den gelen soruları filtrele ve ekle
            if (apiQuestions.content) {
                // Aynı ürüne ait sorular
                const apiSameProductQuestions = apiQuestions.content
                    .filter(q => q.barcode === barcode)
                    .slice(0, 10);

                allRelatedQuestions.push(...apiSameProductQuestions.map(q => ({
                    text: q.text,
                    answer: q.answer,
                    answerDate: q.answerDate || q.updateDate,
                    productName: q.productName,
                    type: 'SAME_PRODUCT_API',
                    similarity: 0.9,
                    source: 'api'
                })));

                // Benzer ürünlere ait sorular
                if (productName) {
                    const keywords = productName.split(' ')
                        .filter(word => word.length > 2);

                    const apiSimilarProductQuestions = apiQuestions.content
                        .filter(q => 
                            q.barcode !== barcode && // Farklı ürünler
                            keywords.some(keyword => 
                                q.productName.toLowerCase().includes(keyword.toLowerCase())
                            )
                        )
                        .slice(0, 10);

                    allRelatedQuestions.push(...apiSimilarProductQuestions.map(q => ({
                        text: q.text,
                        answer: q.answer,
                        answerDate: q.answerDate || q.updateDate,
                        productName: q.productName,
                        type: 'SIMILAR_PRODUCT_API',
                        similarity: 0.4,
                        source: 'api'
                    })));
                }
            }
        } catch (error) {
            console.error('API yanıtları getirilemedi:', error);
            // API hatası olsa bile devam et
        }

        // Yanıtları tarihe göre sırala
        allRelatedQuestions.sort((a, b) => 
            new Date(b.answerDate) - new Date(a.answerDate)
        );

        // API'den gelen yanıtları veritabanına kaydet
        const apiQuestions = allRelatedQuestions.filter(q => q.source === 'api');
        if (apiQuestions.length > 0) {
            try {
                // Her soru için kontrol et ve kaydet
                for (const q of apiQuestions) {
                    const questionData = {
                        marketplaceId: connection.marketplaceId,
                        supplierId: decryptedCredentials.supplierId, // şifresi çözülmüş mağaza ID'si
                        questionId: q.answer?.id?.toString() || `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        productName: q.productName,
                        text: q.text,
                        answer: q.answer?.text || q.answer,
                        status: 'ANSWERED',
                        barcode: q.barcode || null,
                        category: q.category || null,
                        answerDate: q.answerDate || new Date()
                    };

                    // Önce aynı soru var mı diye kontrol et
                    const existingQuestion = await CustomerQuestion.findOne({
                        where: {
                            marketplaceId: connection.marketplaceId,
                            supplierId: decryptedCredentials.supplierId,
                            [Op.or]: [
                                { questionId: q.answer?.id?.toString() },
                                {
                                    [Op.and]: [
                                        { text: q.text },
                                        { productName: q.productName }
                                    ]
                                }
                            ]
                        }
                    });

                    if (!existingQuestion) {
                        await CustomerQuestion.create(questionData);
                        console.log(`Yeni soru kaydedildi (Mağaza: ${decryptedCredentials.supplierId}): ${q.text.substring(0, 50)}...`);
                    } else {
                        console.log(`Bu soru zaten var (Mağaza: ${decryptedCredentials.supplierId}): ${q.text.substring(0, 50)}...`);
                    }
                }

                console.log(`İşlem tamamlandı. ${apiQuestions.length} soru kontrol edildi.`);
            } catch (error) {
                console.error('Yanıtlar veritabanına kaydedilemedi:', error);
                // Hata detaylarını logla ama devam et
            }
        }

        // AI yanıtı oluştur
        const answer = await OpenAiService.askOpenAI(
            questionText,
            productName,
            allRelatedQuestions
        );

        res.json(answer);
    } catch (error) {
        console.error('AI yanıtı oluşturulamadı:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 