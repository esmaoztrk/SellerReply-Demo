// Önceki yanıtları getir
router.get('/previous-answers', async (req, res) => {
    try {
        const { marketplaceId, productId, limit } = req.query;
        const previousAnswers = await CustomerQuestionService.getPreviousAnswers(marketplaceId, productId, limit);
        res.json(previousAnswers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// AI yanıtı oluştur
router.post('/generate-ai-answer', async (req, res) => {
    try {
        const { marketplaceId, questionId, questionText, productName, productId, previousAnswers } = req.body;
        const aiAnswer = await OpenAiService.askOpenAI(questionText, productName, previousAnswers);
        res.json({ answer: aiAnswer });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}); 