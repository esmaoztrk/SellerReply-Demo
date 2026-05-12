import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, MessageCircle, ArrowUpDown, ChevronLeft, ChevronRight, ExternalLink, Filter, Loader, ChevronsLeft, ChevronsRight, X } from "lucide-react";
import ApiService from "../services/ApiService";
import { formatDate } from "../utils/formatters";
import { toast } from "react-hot-toast";
import Header from "../components/common/Header";
import AnswerQuestionModal from "../components/questions/AnswerQuestionModal";

const QuestionsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [activeStatus, setActiveStatus] = useState("WAITING_FOR_ANSWER");
  const [connectedMarketplaces, setConnectedMarketplaces] = useState([]);
  const [selectedMarketplace, setSelectedMarketplace] = useState("");
  const [selectedPazaryeri, setSelectedPazaryeri] = useState("");
  const [filteredMarketplaces, setFilteredMarketplaces] = useState([]);

  // Modal için state'ler
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Yanıtı göster
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const [originalQuestions, setOriginalQuestions] = useState([]);

  const questionStatuses = [
    { id: "WAITING_FOR_ANSWER", label: "Yanıt Bekleyen" },
    { id: "ANSWERED", label: "Yanıtlanmış" },
    { id: "REJECTED", label: "Reddedilmiş" }
  ];

  // Bağlı pazaryerlerini getir
  useEffect(() => {
    const fetchConnectedMarketplaces = async () => {
      try {
        const marketplaces = await ApiService.getConnectedMarketplaces();
        console.log("Bağlı pazaryerleri:", marketplaces);
        setConnectedMarketplaces(marketplaces);
        
        // Bağlı pazaryerleri varsa, ilkini seç
        if (marketplaces.length > 0 && !selectedMarketplace) {
          setSelectedMarketplace(marketplaces[0].id);
        }
      } catch (error) {
        console.error('Bağlı pazaryerleri getirme hatası:', error);
        toast.error('Pazaryerleri yüklenemedi');
      }
    };
    
    fetchConnectedMarketplaces();
  }, []);

  // Müşteri sorularını getir
  const fetchQuestions = async () => {
    if (!selectedMarketplace) return;
    
    setLoading(true);
    setError(null);

    try {
      const params = {
        marketplaceId: selectedMarketplace,
        page: currentPage,
        status: activeStatus,
        size: 50,
        sort: 'creationDate,desc'
      };
      
      const data = await ApiService.getCustomerQuestions(params);
      
      // Backend'den gelen sıralamayı kullan, ekstra sıralama yapma
      setOriginalQuestions(data.content || []);
      setFilteredQuestions(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      
    } catch (error) {
      console.error('Müşteri soruları getirme hatası:', error);
      setError('Sorular yüklenemedi: ' + error.message);
      toast.error('Sorular yüklenemedi: ' + error.message);
      setFilteredQuestions([]);
      setOriginalQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  // useEffect içinde fetchQuestions'ı çağır
  useEffect(() => {
    fetchQuestions();
  }, [selectedMarketplace, currentPage, activeStatus]);

  // Arama işlemi
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.trim() === '') {
      // Arama terimi boşsa, orijinal soruları göster
      setFilteredQuestions(originalQuestions);
    } else {
      // Orijinal sorular üzerinde arama yap
      const filtered = originalQuestions.filter(question => 
        question.text?.toLowerCase().includes(term.toLowerCase()) ||
        question.productName?.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredQuestions(filtered);
    }
  };

  const handleStatusChange = (status, e) => {
    e.preventDefault();
    setActiveStatus(status);
    setCurrentPage(0); // Durum değiştiğinde ilk sayfaya dön
  };

  const handleMarketplaceChange = (e) => {
    setSelectedMarketplace(e.target.value);
    setCurrentPage(0); // Pazaryeri değiştiğinde ilk sayfaya dön
  };

  const handlePazaryeriChange = async (e) => {
    const selectedValue = e.target.value;
    setSelectedPazaryeri(selectedValue);
    setSelectedMarketplace(""); // Mağaza seçimini sıfırla

    if (selectedValue) {
      try {
        // Seçilen pazaryerine göre mağazaları filtrele
        const filtered = connectedMarketplaces.filter(marketplace => 
          marketplace.marketplaceId?.toLowerCase() === selectedValue.toLowerCase()
        );
        
        console.log(`${selectedValue} için filtrelenmiş mağazalar:`, filtered);
        setFilteredMarketplaces(filtered);

        // Eğer filtrelenmiş mağaza varsa ilkini seç
        if (filtered.length > 0) {
          setSelectedMarketplace(filtered[0].id);
        }
      } catch (error) {
        console.error('Mağaza listesi filtreleme hatası:', error);
        toast.error('Mağaza listesi filtrelenemedi');
        setFilteredMarketplaces([]);
      }
    } else {
      setFilteredMarketplaces([]);
    }
  };

  // Sayfalama işlemleri
  const goToFirstPage = (e) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  const goToLastPage = (e) => {
    e.preventDefault();
    setCurrentPage(totalPages - 1);
  };

  const goToPreviousPage = (e) => {
    e.preventDefault();
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = (e) => {
    e.preventDefault();
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Soruyu yanıtla
  const handleAnswerQuestion = (question) => {
    setSelectedQuestion(question);
    setIsModalOpen(true);
  };

  // Modal kapatma
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedQuestion(null);
  };

  // Yanıt gönderildikten sonra soruları yenile
  const handleAnswerSubmitted = async () => {
    try {
      // Modal'ı kapat
      setIsModalOpen(false);
      setSelectedQuestion(null);
      
      // Başarı mesajı göster
      toast.success('Soru başarıyla yanıtlandı');

      // Backend'in yanıtı işlemesi için kısa bir süre bekle
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Soruları yeniden yükle
      await fetchQuestions();

      // Eğer sayfada hiç soru kalmadıysa ve önceki sayfa varsa, önceki sayfaya git
      const remainingQuestions = filteredQuestions.length - 1;
      if (remainingQuestions === 0 && currentPage > 0) {
        setCurrentPage(prev => prev - 1);
      }

    } catch (error) {
      console.error('Yanıt gönderme hatası:', error);
      toast.error('Yanıt gönderilirken bir hata oluştu');
    }
  };

  // Yanıtı göster
  const handleShowAnswer = (question) => {
    console.log("Soru:", question);
    console.log("Yanıt:", question.answer);
    
    setSelectedQuestion(question);
    
    // Yanıt tipini kontrol et
    if (question.answer) {
      if (typeof question.answer === 'object') {
        console.log("Yanıt bir nesne, içeriği:", question.answer);
        setSelectedAnswer(question.answer.text || JSON.stringify(question.answer));
      } else {
        console.log("Yanıt bir string:", question.answer);
        setSelectedAnswer(question.answer);
      }
    } else {
      console.log("Yanıt bulunamadı");
      setSelectedAnswer("Yanıt bulunamadı.");
    }
    
    setShowAnswerModal(true);
  };

  const handleCloseAnswerModal = () => {
    setShowAnswerModal(false);
    setSelectedQuestion(null);
    setSelectedAnswer(null);
  };

  // Sayfa yüklendiğinde durumu kontrol et ve ayarla
  useEffect(() => {
    const savedStatus = localStorage.getItem('questionStatus');
    if (savedStatus) {
      setActiveStatus(savedStatus);
      localStorage.removeItem('questionStatus'); // Durumu temizle
    }
  }, []); // Sadece sayfa ilk yüklendiğinde çalışsın

  // Benzersiz pazaryerlerini al
  const uniqueMarketplaces = useMemo(() => {
    const marketplaceIds = [...new Set(connectedMarketplaces.map(m => m.marketplaceId))];
    return marketplaceIds.map(id => ({
      id: id,
      name: id.charAt(0).toUpperCase() + id.slice(1) // İlk harfi büyük yap
    }));
  }, [connectedMarketplaces]);

  return (
    <div className='flex-1 overflow-auto relative z-10'>
      <Header title='Müşteri Soruları' />

      <main className='max-w-7xl mx-auto py-6 px-4 lg:px-8'>
        <motion.div
          className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Filtreler ve Arama */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Pazaryeri ve Mağaza Seçimi */}
              <div className="flex items-center gap-2">
                {/* Pazaryeri Seçimi */}
                <select
                  value={selectedPazaryeri}
                  className="bg-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={handlePazaryeriChange}
                >
                  <option value="">Pazaryeri Seçin</option>
                  {uniqueMarketplaces.map(marketplace => (
                    <option key={marketplace.id} value={marketplace.id}>
                      {marketplace.name}
                    </option>
                  ))}
                </select>

                {/* Mağaza Seçimi */}
                <select
                  value={selectedMarketplace}
                  onChange={handleMarketplaceChange}
                  disabled={!selectedPazaryeri || filteredMarketplaces.length === 0}
                  className={`bg-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !selectedPazaryeri || filteredMarketplaces.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">
                    {filteredMarketplaces.length === 0 
                      ? `${selectedPazaryeri ? selectedPazaryeri + ' mağazası bulunamadı' : 'Mağaza Seçin'}`
                      : 'Mağaza Seçin'
                    }
                  </option>
                  {filteredMarketplaces.map(marketplace => (
                    <option key={marketplace.id} value={marketplace.id}>
                      {marketplace.storeName}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Arama Kutusu */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Soru ara..."
                  className="bg-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              </div>
            </div>
          </div>

          {/* Başlık ve Durum Filtreleri */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">
              {connectedMarketplaces.find(m => m.id === selectedMarketplace)?.storeName} Müşteri Soruları
            </h2>
            
            {/* Durum Butonları */}
            <div className="flex flex-wrap gap-2 mt-4">
              {questionStatuses.map(status => (
                <button
                  key={status.id}
                  onClick={(e) => handleStatusChange(status.id, e)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeStatus === status.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Yükleniyor veya Hata Durumu */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader className="animate-spin text-blue-500" size={32} />
            </div>
          ) : error ? (
            <div className="bg-red-900/30 text-red-300 p-4 rounded-lg border border-red-800/50">
              <p>{error}</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>Seçilen kriterlere uygun soru bulunamadı.</p>
            </div>
          ) : (
            <>
              {/* Sorular Tablosu */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-32">
                        Tarih
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-48">
                        Ürün
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Soru
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-24">
                        Durum
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-28">
                        İşlemler
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide divide-gray-700">
                    {filteredQuestions.map((question) => (
                      <motion.tr
                        key={question.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="hover:bg-gray-700/30 transition-colors duration-150"
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                          {formatDate(question.creationDate)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-100">
                          <div className="truncate max-w-[180px]">
                            {question.productName || 'İsimsiz Ürün'}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-300">
                          <div className="truncate max-w-[400px]">{question.text}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getStatusStyle(question.status)}`}
                          >
                            {getStatusInTurkish(question.status)}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                          {question.status === 'WAITING_FOR_ANSWER' ? (
                            <button 
                              className="text-white px-2 py-1 rounded-md bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-1 text-xs"
                              onClick={() => handleAnswerQuestion(question)}
                            >
                              <MessageCircle size={12} />
                              <span>Yanıtla</span>
                            </button>
                          ) : question.status === 'ANSWERED' ? (
                            <button 
                              className="text-white px-2 py-1 rounded-md bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-500 hover:to-purple-400 shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-1 text-xs"
                              onClick={() => handleShowAnswer(question)}
                            >
                              <ExternalLink size={12} />
                              <span>Yanıtı Gör</span>
                            </button>
                          ) : (
                            <span className="text-white px-2 py-1 rounded-md bg-gradient-to-r from-red-600 to-red-500 opacity-75 flex items-center space-x-1 text-xs">
                              <X size={12} />
                              <span>Reddedildi</span>
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sayfalama Kontrolleri */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Toplam {totalElements} soru • Sayfa {currentPage + 1} / {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button 
                    className="p-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    onClick={goToFirstPage}
                    disabled={currentPage <= 0}
                    title="İlk Sayfa"
                  >
                    <ChevronsLeft size={18} />
                  </button>
                  
                  <button 
                    className="p-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    onClick={goToPreviousPage}
                    disabled={currentPage <= 0}
                    title="Önceki Sayfa"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  
                  <button 
                    className="p-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    onClick={goToNextPage}
                    disabled={currentPage >= totalPages - 1}
                    title="Sonraki Sayfa"
                  >
                    <ChevronRight size={18} />
                  </button>
                  
                  <button 
                    className="p-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    onClick={goToLastPage}
                    disabled={currentPage >= totalPages - 1}
                    title="Son Sayfa"
                  >
                    <ChevronsRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Yanıtlama Modalı */}
        <AnswerQuestionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          question={selectedQuestion}
          marketplaceId={selectedMarketplace}
          onAnswerSubmitted={async () => {
            await handleAnswerSubmitted();
          }}
          fetchQuestions={fetchQuestions}
        />

        {/* Yanıt Gösterme Modalı */}
        {showAnswerModal && selectedQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 w-full max-w-2xl">
              {/* Modal Başlık */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-lg font-medium text-gray-100">Yanıt Detayı</h3>
                <button
                  onClick={handleCloseAnswerModal}
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
                  <p className="text-gray-200">{selectedQuestion.productName || "İsimsiz Ürün"}</p>
                </div>

                {/* Müşteri Sorusu */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Müşteri Sorusu</h4>
                  <div className="p-3 bg-gray-700 rounded-lg text-gray-200">
                    {selectedQuestion.text}
                  </div>
                </div>

                {/* Yanıt */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Yanıtınız</h4>
                  <div className="p-3 bg-gray-700 rounded-lg text-gray-200">
                    {typeof selectedAnswer === 'string' ? selectedAnswer : (selectedAnswer?.text || "Yanıt bulunamadı.")}
                  </div>
                </div>

                {/* Tarih Bilgisi */}
                <div className="text-xs text-gray-400 mt-4">
                  Yanıtlanma Tarihi: {formatDate(selectedQuestion.answerDate || selectedQuestion.updateDate)}
                </div>

                {/* Kapat Butonu */}
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleCloseAnswerModal}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Soru durumuna göre stil döndür
const getStatusStyle = (status) => {
  switch (status) {
    case 'WAITING_FOR_ANSWER':
      return 'bg-gradient-to-r from-yellow-600/40 to-amber-500/40 text-yellow-300 border border-yellow-600/30 shadow-sm';
    case 'ANSWERED':
      return 'bg-gradient-to-r from-green-600/40 to-emerald-500/40 text-green-300 border border-green-600/30 shadow-sm';
    case 'REJECTED':
      return 'bg-gradient-to-r from-red-600/40 to-rose-500/40 text-red-300 border border-red-600/30 shadow-sm';
    default:
      return 'bg-gradient-to-r from-gray-700/40 to-gray-600/40 text-gray-300 border border-gray-600/30 shadow-sm';
  }
};

// Soru durumuna göre Türkçe metin döndür
const getStatusInTurkish = (status) => {
  switch (status) {
    case 'WAITING_FOR_ANSWER':
      return 'Yanıt Bekliyor';
    case 'ANSWERED':
      return 'Yanıtlandı';
    case 'REJECTED':
      return 'Reddedildi';
    default:
      return status;
  }
};

export default QuestionsPage; 