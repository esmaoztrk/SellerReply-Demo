const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const AIService = require('../services/AIService');
const MarketplaceManager = require('../services/MarketplaceManager');

// AI ile yanıt oluştur
router.post('/generate-answer', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { marketplaceId, questionId, questionText, productName, productId } = req.body;

    if (!marketplaceId || !questionText) {
      return res.status(400).json({ message: 'Eksik parametreler' });
    }

    // Pazaryeri bağlantısını getir
    const connection = await MarketplaceManager.getMarketplaceConnection(userId, parseInt(marketplaceId));
    if (!connection || !connection.isConnected) {
      return res.status(404).json({ message: 'Pazaryeri bağlantısı bulunamadı' });
    }

    // Pazaryeri servisini başlat - connection.marketplaceId kullan (trendyol, hepsiburada gibi)
    const service = MarketplaceManager.initializeMarketplaceService(
      connection.marketplaceId, 
      connection.credentials
    );

    // Ürün detaylarını getir (varsa)
    let productDetails = null;
    if (productId) {
      try {
        productDetails = await service.fetchProductDetails(productId);
      } catch (error) {
        console.warn('Ürün detayları getirilemedi:', error.message);
        // Ürün detayları alınamazsa devam et
      }
    }

    // Yapay zeka yanıtı oluştur
    const answer = await AIService.generateAnswer(
      questionText,
      productName,
      productDetails
    );

    res.json({ answer });
  } catch (error) {
    console.error('AI yanıt üretme hatası:', error);
    res.status(500).json({ message: 'Yapay zeka yanıtı oluşturulamadı' });
  }
});

module.exports = router; 