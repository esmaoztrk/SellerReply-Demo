const axios = require('axios');
require('dotenv').config();

const openAiApiKey = process.env.OPENAI_API_KEY;

class OpenAiService {
    async askOpenAI(questionText, productName, relatedQuestions) {
        if (!questionText || typeof questionText !== 'string') {
            throw new Error('Geçerli bir soru metni girilmelidir.');
        }

        try {
            // Önceki yanıtları formatlayarak context oluştur
            const previousContext = relatedQuestions.map((qa, index) => {
                const contextType = qa.type === 'SAME_PRODUCT' ? 
                    'AYNI ÜRÜN' : 'BENZER ÜRÜN';
                
                return `${contextType} SORU ${index + 1}:
Ürün: ${qa.productName}
Soru: ${qa.text}
Yanıt: ${qa.answer}
Benzerlik: ${qa.similarity}
-------------------`;
            }).join('\n\n');

            const systemPrompt = `Sen deneyimli bir e-ticaret müşteri hizmetleri temsilcisisin.
            
            MEVCUT ÜRÜN: "${productName}"
            
            GEÇMİŞ YANITLAR:
            ${previousContext}

            GÖREV:
            1. Önce aynı ürüne ait yanıtları analiz et (AYNI ÜRÜN etiketli)
            2. Sonra benzer ürünlere ait yanıtları incele (BENZER ÜRÜN etiketli)
            3. Yanıtların benzerlik skorlarını dikkate al
            4. Tutarlı ve doğru bilgiler ver
            5. Önceki yanıtlardaki üslubu ve yaklaşımı takip et

            YANIT KURALLARI:
            1. Her zaman nazik ve profesyonel ol
            2. Selamlama ile başla ve iyi dileklerle bitir
            3. Ürün adını hiç kullanma, "ürünümüz" veya "bu ürün" de
            4. Yanıtı kısa ve öz tut
            5. Soruya doğrudan yanıt ver
            6. Bilgi eksikliğinde bunu nazikçe belirt
            7. Resmi ama samimi bir dil kullan`;

            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: questionText
                        }
                    ],
                    max_tokens: 200,
                    temperature: 0.6,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${openAiApiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.data?.choices?.[0]?.message?.content) {
                throw new Error('OpenAI yanıt döndürmedi');
            }

            const answer = response.data.choices[0].message.content.trim();
            return answer;

        } catch (error) {
            console.error('OpenAI API isteği hatası:', error.response?.data || error.message);
            throw new Error('Sorunun cevabı alınamadı: ' + (error.response?.data?.error?.message || error.message));
        }
    }
}

module.exports = new OpenAiService();
