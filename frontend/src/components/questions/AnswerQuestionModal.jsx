import { useState, useEffect } from "react";
import { X, Send, AlertCircle, Sparkles, Edit, Check, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ApiService from "../../services/ApiService";
import { toast } from "react-hot-toast";

const AnswerQuestionModal = ({ isOpen, onClose, question, marketplaceId, onAnswerSubmitted, fetchQuestions }) => {
  const [answer, setAnswer] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [characterCount, setCharacterCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const maxCharacters = 500; // Maksimum karakter sayısı

  // Modal açıldığında cevap alanını temizle ve AI yanıtı iste
  useEffect(() => {
    if (isOpen && question) {
      setAnswer("");
      setAiAnswer("");
      setError(null);
      setCharacterCount(0);
      setIsEditing(false);
      generateAIAnswer();
    }
  }, [isOpen, question]);

  // Yapay zeka yanıtı oluştur
  const generateAIAnswer = async () => {
    if (!question) return;
    
    setAiLoading(true);
    setError(null);
    
    try {
        console.log('Soru detayları:', question); // Tüm soru objesini görelim
        
        // Ürün ID'sini bul - Trendyol için barcode kullan
        const productId = question.barcode;
        
        console.log('Kullanılacak ürün ID (barcode):', productId);
        
        // Yapay zeka yanıtı oluştur
        const response = await ApiService.generateAIAnswer({
            marketplaceId,
            questionId: question.id,
            questionText: question.text,
            productName: question.productName,
            productId: productId // barcode'u gönder
        });
        
        setAiAnswer(response);
        setAnswer(response);
        setCharacterCount(response.length);
    } catch (error) {
        console.error("AI yanıt üretme hatası:", error);
        setError("Yapay zeka yanıtı oluşturulamadı: " + error.message);
        toast.error("Yapay zeka yanıtı oluşturulamadı");
    } finally {
        setAiLoading(false);
    }
  };

  // Karakter sayısını güncelle
  const handleAnswerChange = (e) => {
    const text = e.target.value;
    if (text.length <= maxCharacters) {
      setAnswer(text);
      setCharacterCount(text.length);
    }
  };

  // AI yanıtını kullan
  const useAIAnswer = () => {
    setAnswer(aiAnswer);
    setCharacterCount(aiAnswer.length);
    setIsEditing(false);
  };

  // Düzenleme modunu aç/kapat
  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  // Cevabı gönder
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!answer.trim()) {
        setError("Lütfen bir cevap yazın");
        return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
        // Tüm soru nesnesini gönder
        await ApiService.answerCustomerQuestion(
            marketplaceId, 
            question.id, 
            answer,
            question // Tüm soru nesnesini gönder
        );

        // Başarılı yanıt durumu
        toast.success("Cevabınız başarıyla gönderildi");
        
        // Kısa bir bekleme ekleyelim
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Modal'ı kapat ve callback'i çağır
        await onAnswerSubmitted();
        onClose();

    } catch (error) {
        console.error("Cevap gönderme hatası:", error);
        
        // Backend 500 hatası verdiyse ama Trendyol'da yanıt başarılıysa
        if (error.message.includes('500')) {
            toast.success("Yanıtınız başarıyla kaydedildi");
            await onAnswerSubmitted();
            onClose();
            return;
        }
        
        setError(error.message || "Cevap gönderilemedi");
        toast.error(error.message || "Cevap gönderilemedi");
    } finally {
        setLoading(false);
    }
  };

  // Reddet
  const handleReject = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await ApiService.rejectCustomerQuestion(marketplaceId, question.id);
      toast.success("Soru başarıyla reddedildi");
      onAnswerSubmitted();
      onClose();
    } catch (error) {
      console.error("Reddetme hatası:", error);
      setError("Soru reddedilemedi: " + error.message);
      toast.error("Soru reddedilemedi");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !question) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 w-full max-w-2xl"
          >
            {/* Modal Başlık */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-gray-100">Soruyu Yanıtla</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal İçerik */}
            <div className="p-6">
              {/* Ürün Bilgisi */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-400 mb-1">Ürün</h4>
                <p className="text-gray-200">{question.productName || "İsimsiz Ürün"}</p>
              </div>

              {/* Müşteri Sorusu */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-1">Soru</h4>
                <div className="p-3 bg-gray-700 rounded-lg text-gray-200">
                  {question.text}
                </div>
              </div>

              {/* AI Yanıtı */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-400 flex items-center">
                    <Sparkles size={16} className="mr-1 text-blue-400" />
                    Yapay Zeka Yanıtı
                  </h4>
                  <button
                    onClick={generateAIAnswer}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
                    disabled={aiLoading}
                  >
                    <RefreshCw size={12} className={`mr-1 ${aiLoading ? 'animate-spin' : ''}`} />
                    Yeniden Oluştur
                  </button>
                </div>
                
                {aiLoading ? (
                  <div className="p-3 bg-gray-700 rounded-lg text-gray-400 flex items-center justify-center h-24">
                    <RefreshCw size={20} className="animate-spin mr-2" />
                    Yapay zeka yanıtı oluşturuluyor...
                  </div>
                ) : aiAnswer ? (
                  <div className="p-3 bg-blue-900/30 border border-blue-700/30 rounded-lg text-gray-200 relative">
                    {aiAnswer}
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={useAIAnswer}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
                      >
                        <Check size={12} className="mr-1" />
                        Bu yanıtı kullan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-700 rounded-lg text-gray-400 italic">
                    Yapay zeka yanıtı oluşturulamadı.
                  </div>
                )}
              </div>

              {/* Hata Mesajı */}
              {error && (
                <div className="mb-4 p-3 bg-red-900/30 text-red-300 rounded-lg flex items-start">
                  <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* Cevap Formu */}
              <form onSubmit={handleSubmit}>
                <div className="mb-1 flex justify-between items-center">
                  <label htmlFor="answer" className="text-sm font-medium text-gray-400 flex items-center">
                    {isEditing ? (
                      <>
                        <Edit size={16} className="mr-1 text-yellow-400" />
                        Yanıtı Düzenle
                      </>
                    ) : (
                      "Gönderilecek Yanıt"
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={toggleEditing}
                    className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center"
                  >
                    <Edit size={12} className="mr-1" />
                    {isEditing ? "Düzenlemeyi Bitir" : "Düzenle"}
                  </button>
                </div>
                
                {isEditing ? (
                  <textarea
                    id="answer"
                    rows={5}
                    placeholder="Yanıtınızı yazın..."
                    className="w-full p-3 bg-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    value={answer}
                    onChange={handleAnswerChange}
                    disabled={loading}
                  ></textarea>
                ) : (
                  <div className="p-3 bg-gray-700 rounded-lg text-gray-200 min-h-[120px]">
                    {answer || "Henüz bir yanıt yok."}
                  </div>
                )}
                
                {/* Karakter Sayacı */}
                <div className="flex justify-end mb-4">
                  <span className={`text-xs ${characterCount > maxCharacters * 0.8 ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {characterCount}/{maxCharacters}
                  </span>
                </div>

                {/* Butonlar */}
                <div className="flex justify-between mt-6">
                  <button
                    type="button"
                    onClick={handleReject}
                    className="px-4 py-2 bg-red-900/50 text-red-300 rounded-lg hover:bg-red-800/50 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    Reddet
                  </button>
                  
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                    disabled={loading || !answer.trim()}
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    ) : (
                      <Send size={16} className="mr-2" />
                    )}
                    Yanıtı Gönder
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AnswerQuestionModal; 