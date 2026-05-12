const axios = require('axios');
require('dotenv').config();

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    this.model = 'gpt-3.5-turbo'; // veya 'gpt-4' gibi daha gelişmiş bir model
  }

  async generateAnswer(questionText, productName, productDetails = null) {
    try {
      // Ürün bilgilerini hazırla
      let productInfo = `Ürün: ${productName || 'Belirtilmemiş'}`;
      
      if (productDetails) {
        productInfo += `\nÜrün Açıklaması: ${productDetails.description || ''}`;
        productInfo += `\nÜrün Özellikleri: ${productDetails.attributes ? JSON.stringify(productDetails.attributes) : ''}`;
        productInfo += `\nFiyat: ${productDetails.price || ''}`;
        productInfo += `\nMarka: ${productDetails.brand || ''}`;
      }

      // Sistem mesajı
      const systemMessage = `
        Sen bir e-ticaret sitesinde müşteri sorularını yanıtlayan profesyonel bir müşteri temsilcisisin.
        Aşağıdaki ürün hakkında bir soru sorulacak. Bu soruya nazik, yardımcı ve bilgilendirici bir şekilde yanıt ver.
        Yanıtın kısa, öz ve 500 karakterden az olmalı.
        Eğer ürün hakkında yeterli bilgin yoksa, genel bir yanıt ver ve müşteriye daha fazla bilgi için iletişime geçmesini öner.
        Türkçe yanıt ver ve resmi bir dil kullan.
        
        ${productInfo}
      `;

      // API isteği
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: questionText }
          ],
          max_tokens: 500,
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      // Yanıtı döndür
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI API hatası:', error.response?.data || error.message);
      throw new Error('Yapay zeka yanıtı oluşturulamadı: ' + (error.response?.data?.error?.message || error.message));
    }
  }
}

module.exports = new AIService(); 