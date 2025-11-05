import React, { useState, useEffect } from 'react'
import { createWorker } from 'tesseract.js'
import { CheckCircle2, XCircle, Loader2, Sparkles, X } from 'lucide-react'

const ReceiptOCR = ({ ticket, onClose }) => {
  const [ocrText, setOcrText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [comparison, setComparison] = useState(null)
  const [extractedData, setExtractedData] = useState(null)

  useEffect(() => {
    if (ticket?.receipt?.dataUrl && ticket.receipt.type?.startsWith('image/')) {
      // İlk yüklemede otomatik OCR başlatma
      // processImage()
    }
  }, [ticket])

  const processImage = async () => {
    setIsProcessing(true)
    setOcrText('')
    setComparison(null)
    setExtractedData(null)

    try {
      // Tesseract.js ile ücretsiz OCR (client-side, API key gerekmez)
      const worker = await createWorker('tur+eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            // Progress updates
          }
        }
      })

      // OCR ayarlarını iyileştir
      await worker.setParameters({
        tessedit_pageseg_mode: '6', // Assume a single uniform block of text
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzğüşıöçĞÜŞİÖÇ.,:/- TRY€$',
        preserve_interword_spaces: '1',
      })

      const receiptUrl = ticket.receiptUrl || ticket.receipt?.dataUrl
      const { data: { text } } = await worker.recognize(receiptUrl)
      await worker.terminate()

      setOcrText(text)
      
      // Metinden bilgileri çıkar
      const extractedData = extractDataFromText(text)
      if (extractedData) {
        setExtractedData(extractedData)
        compareWithUserData(extractedData)
      } else {
        compareWithUserData(text)
      }
    } catch (error) {
      console.error('OCR Error:', error)
      alert('Dekont okunurken bir hata oluştu! Hata: ' + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // Metinden veri çıkarma fonksiyonu
  const extractDataFromText = (text) => {
    const lowerText = text.toLowerCase()
    
    // IBAN bul (TR ile başlayan 26 karakter)
    const ibanMatch = text.match(/TR[0-9A-Z]{24}/gi)
    const iban = ibanMatch ? ibanMatch[0] : null
    
    // Tutar bul (farklı formatlar)
    const amountRegex = /(\d{1,3}(?:[.,\s]?\d{3})*(?:[.,]\d{2})?)\s*(?:TRY|TL|€|\$|USD|EUR)?/gi
    const amountMatches = [...text.matchAll(amountRegex)]
    const miktarRakam = amountMatches.length > 0 ? amountMatches[0][1] : null
    
    // Tarih bul (GG.AA.YYYY, GG/AA/YYYY vb.)
    const dateRegex = /(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{4})/g
    const dateMatch = text.match(dateRegex)
    const tarih = dateMatch ? dateMatch[0].replace(/\//g, '.').replace(/-/g, '.') : null
    
    // İsim bul (büyük harfle başlayan kelimeler)
    const nameRegex = /[A-ZĞÜŞİÖÇ][a-zğüşıöç]+(?:\s+[A-ZĞÜŞİÖÇ][a-zğüşıöç]+)+/g
    const nameMatches = [...text.matchAll(nameRegex)]
    const alacakliAdi = nameMatches.length > 0 ? nameMatches[0][0] : null
    
    // Para birimi bul
    const currencyMatch = text.match(/(TRY|TL|USD|EUR|€|\$)/i)
    const paraBirimi = currencyMatch ? currencyMatch[0].toUpperCase() : 'TRY'
    
    if (iban || miktarRakam || tarih || alacakliAdi) {
      return {
        alacakliAdi: alacakliAdi || 'Bulunamadı',
        iban: iban || 'Bulunamadı',
        tarih: tarih || 'Bulunamadı',
        miktarRakam: miktarRakam || 'Bulunamadı',
        miktarYazili: '', // Tesseract ile yazılı tutar bulmak zor
        paraBirimi: paraBirimi
      }
    }
    
    return null
  }

  const compareWithUserData = (extractedDataOrText) => {
    // Eğer structured data varsa (Google AI'dan geldi)
    if (extractedDataOrText && typeof extractedDataOrText === 'object' && extractedDataOrText.alacakliAdi) {
      const extracted = extractedDataOrText
      const userAmount = ticket.investmentAmount?.toString() || ''
      const userIban = ticket.recipientIban?.replace(/\s/g, '') || ''
      const userDate = ticket.investmentDateTime ? new Date(ticket.investmentDateTime).toLocaleDateString('tr-TR') : ''
      const userName = ticket.recipientName || ''

      // Tutar karşılaştırması
      const extractedAmount = extracted.miktarRakam?.replace(/[.,\s]/g, '') || ''
      const userAmountClean = userAmount.replace(/[.,\s]/g, '')
      const amountMatch = extractedAmount === userAmountClean || Math.abs(parseFloat(extractedAmount) - parseFloat(userAmountClean)) < 1

      // IBAN karşılaştırması
      const extractedIban = extracted.iban?.replace(/\s/g, '').toUpperCase() || ''
      const ibanMatch = extractedIban.includes(userIban.toUpperCase()) || userIban.toUpperCase().includes(extractedIban)

      // Tarih karşılaştırması
      const dateMatch = compareDates(extracted.tarih, userDate)

      // İsim karşılaştırması
      const nameMatch = extracted.alacakliAdi?.toLowerCase().includes(userName.toLowerCase()) || userName.toLowerCase().includes(extracted.alacakliAdi?.toLowerCase() || '')

      setComparison({
        amount: {
          match: amountMatch,
          extracted: extracted.miktarRakam || '',
          extractedYazili: extracted.miktarYazili || '',
          userValue: userAmount,
          currency: extracted.paraBirimi || 'TRY'
        },
        iban: {
          match: ibanMatch,
          extracted: extracted.iban || 'IBAN bulunamadı',
          userValue: userIban
        },
        date: {
          match: dateMatch,
          extracted: extracted.tarih || 'Tarih bulunamadı',
          userValue: userDate
        },
        name: {
          match: nameMatch,
          extracted: extracted.alacakliAdi || 'İsim bulunamadı',
          userValue: userName
        }
      })
    } else {
      // Eski yöntem (Tesseract.js için)
      const text = typeof extractedDataOrText === 'string' ? extractedDataOrText.toLowerCase() : ''
      const userAmount = ticket.investmentAmount?.toString() || ''
      const userIban = ticket.recipientIban?.replace(/\s/g, '') || ''
      const userDate = ticket.investmentDateTime ? new Date(ticket.investmentDateTime).toLocaleDateString('tr-TR') : ''

      const amountMatch = findAmountInText(text, userAmount)
      const ibanMatch = userIban.length >= 4 ? text.includes(userIban.slice(-6).toLowerCase()) : false
      const dateMatch = findDateInText(text, userDate)

      setComparison({
        amount: {
          match: amountMatch.found,
          extracted: amountMatch.value,
          userValue: userAmount,
          confidence: amountMatch.confidence
        },
        iban: {
          match: ibanMatch,
          extracted: ibanMatch ? 'IBAN bulundu' : 'IBAN bulunamadı',
          userValue: userIban.slice(-6)
        },
        date: {
          match: dateMatch.found,
          extracted: dateMatch.value || 'Tarih bulunamadı',
          userValue: userDate
        }
      })
    }
  }

  const compareDates = (extractedDate, userDate) => {
    if (!extractedDate || !userDate) return false
    
    // Extracted: GG.AA.YYYY veya farklı formatlar
    // User: GG.AA.YYYY
    const normalizeDate = (dateStr) => {
      return dateStr.replace(/[.\/]/g, '.').split('.').map(d => d.padStart(2, '0')).join('.')
    }
    
    return normalizeDate(extractedDate) === normalizeDate(userDate)
  }

  const findAmountInText = (text, userAmount) => {
    // Kullanıcı tutarını normalize et
    const userAmountNum = parseFloat(userAmount.replace(/[.,]/g, '').replace(',', '.')) || 0
    
    // Metindeki tüm tutar formatlarını bul (daha esnek regex)
    // Farklı formatlar: 1500, 1.500, 1,500, 1500.00, 1500,00, 1500 TRY, vb.
    const amountRegex = /(\d{1,3}(?:[.,\s]?\d{3})*(?:[.,]\d{2})?)\s*(?:TRY|TL|€|\$|USD|EUR)?/gi
    const matches = [...text.matchAll(amountRegex)] || []
    
    let found = false
    let extractedValue = ''
    let confidence = 'low'
    let bestMatch = null
    let bestDiff = Infinity

    for (const match of matches) {
      const matchText = match[1].trim()
      // Nokta ve virgülleri temizle, sadece rakamları al
      const cleanMatch = matchText.replace(/[.,\s]/g, '')
      const matchNum = parseFloat(cleanMatch) || 0
      
      // Tam eşleşme
      if (matchNum === userAmountNum) {
        found = true
        extractedValue = matchText
        confidence = 'high'
        bestMatch = matchText
        break
      }
      
      // Yakın eşleşme (fark %5'ten azsa)
      const diff = Math.abs(matchNum - userAmountNum)
      const percentDiff = userAmountNum > 0 ? (diff / userAmountNum) * 100 : 100
      
      if (percentDiff < 5 && diff < bestDiff) {
        bestDiff = diff
        bestMatch = matchText
        found = true
        confidence = percentDiff < 1 ? 'high' : percentDiff < 3 ? 'medium' : 'low'
      }
    }

    if (bestMatch) {
      extractedValue = bestMatch
    }

    return { found, value: extractedValue, confidence }
  }

  const findDateInText = (text, userDate) => {
    // Tarih formatları: DD/MM/YYYY, DD.MM.YYYY, DD-MM-YYYY
    const dateParts = userDate.split('.')
    if (dateParts.length === 3) {
      const [day, month, year] = dateParts
      const patterns = [
        `${day}/${month}/${year}`,
        `${day}.${month}.${year}`,
        `${day}-${month}-${year}`,
        `${day} ${month} ${year}`
      ]

      for (const pattern of patterns) {
        if (text.includes(pattern.toLowerCase())) {
          return { found: true, value: pattern }
        }
      }
    }

    return { found: false, value: null }
  }

  const isImage = ticket?.receipt?.type?.startsWith('image/')

  if (!isImage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="glass-strong rounded-3xl p-8 max-w-4xl w-full shadow-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
          >
            <XCircle size={24} />
          </button>
          <div className="text-center py-8">
            <p className="text-white/70">OCR yalnızca görsel dosyalar için kullanılabilir.</p>
            <p className="text-white/50 text-sm mt-2">PDF dosyaları için OCR desteği yakında eklenecek.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-strong rounded-3xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all z-10"
        >
          <XCircle size={24} />
        </button>

        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-2">
            Dekont OCR Kontrolü
          </h2>
          <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Sol Taraf - Dekont Görseli */}
          <div className="glass rounded-xl p-4 border border-white/20">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-blue-400" />
              Dekont Görseli
            </h3>
            <div className="bg-black/30 rounded-lg p-4 flex items-center justify-center min-h-[400px]">
              {ticket?.receipt?.dataUrl && (
                <img
                  src={ticket.receiptUrl || ticket.receipt?.dataUrl}
                  alt="Dekont"
                  className="max-w-full max-h-[500px] rounded-lg shadow-lg"
                />
              )}
            </div>
          </div>

          {/* Sağ Taraf - Çıkarılan Bilgiler ve Karşılaştırma */}
          <div className="space-y-4">
            {/* Çıkarılan Dekont Bilgileri */}
            {extractedData && (
              <div className="glass rounded-xl p-4 border border-green-500/30">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-400" />
                  Dekonttan Çıkarılan Bilgiler
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-white/70">Alacaklı Adı:</span>
                    <span className="text-white font-semibold ml-2 block mt-1">
                      {extractedData.alacakliAdi || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/70">IBAN:</span>
                    <span className="text-white font-mono ml-2 block mt-1">
                      {extractedData.iban || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/70">Tarih:</span>
                    <span className="text-white ml-2 block mt-1">
                      {extractedData.tarih || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/70">Para Yatırma Miktarı:</span>
                    <div className="mt-1">
                      <span className="text-white font-semibold block">
                        {extractedData.miktarRakam || '-'} {extractedData.paraBirimi || 'TRY'}
                      </span>
                      {extractedData.miktarYazili && (
                        <span className="text-white/80 text-xs block mt-1 italic">
                          ({extractedData.miktarYazili})
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-white/70">Para Birimi:</span>
                    <span className="text-white font-semibold ml-2">
                      {extractedData.paraBirimi || 'TRY'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Kullanıcı Bilgileri */}
            <div className="glass rounded-xl p-4 border border-white/20">
              <h3 className="text-white font-semibold mb-4">Kullanıcı Bilgileri</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-white/70">Alıcı Adı:</span>
                  <span className="text-white font-semibold ml-2">
                    {ticket.recipientName || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-white/70">Tutar:</span>
                  <span className="text-white font-semibold ml-2">
                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(ticket.investmentAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-white/70">IBAN:</span>
                  <span className="text-white font-mono ml-2">{ticket.recipientIban}</span>
                </div>
                <div>
                  <span className="text-white/70">Tarih:</span>
                  <span className="text-white ml-2">
                    {ticket.investmentDateTime ? new Date(ticket.investmentDateTime).toLocaleDateString('tr-TR') : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* OCR Butonu ve İşleme Durumu */}
            {!isProcessing && !comparison && !extractedData && (
              <div className="glass rounded-xl p-4 border border-white/20">
                <button
                  onClick={() => processImage()}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Sparkles size={20} />
                  Dekontu OCR ile Oku (Tesseract.js)
                </button>
                <p className="text-white/50 text-xs mt-2 text-center">
                  Ücretsiz OCR ile dekont görselindeki bilgileri otomatik okuyup çıkarır
                </p>
              </div>
            )}

            {isProcessing && (
              <div className="glass rounded-xl p-6 border border-white/20 text-center">
                <Loader2 className="mx-auto mb-4 text-blue-400 animate-spin" size={48} />
                <p className="text-white/70">Dekont okunuyor...</p>
                <p className="text-white/50 text-xs mt-2">Lütfen bekleyiniz (bu işlem birkaç saniye sürebilir)</p>
              </div>
            )}

            {/* Karşılaştırma Sonuçları */}
            {comparison && !isProcessing && (
              <div className="glass rounded-xl p-4 border border-white/20 space-y-4">
                <h3 className="text-white font-semibold mb-4">Karşılaştırma Sonuçları</h3>
                
                {/* Tutar */}
                <div className={`p-3 rounded-lg border-2 ${comparison.amount.match ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold">Tutar</span>
                    {comparison.amount.match ? (
                      <CheckCircle2 className="text-green-400" size={20} />
                    ) : (
                      <XCircle className="text-red-400" size={20} />
                    )}
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="text-white/70">
                      Dekontta: <span className="text-white">{comparison.amount.extracted || 'Bulunamadı'} {comparison.amount.currency || 'TRY'}</span>
                    </div>
                    {comparison.amount.extractedYazili && (
                      <div className="text-white/60 italic">
                        Yazılı: <span className="text-white">{comparison.amount.extractedYazili}</span>
                      </div>
                    )}
                    <div className="text-white/70">
                      Kullanıcı: <span className="text-white">{comparison.amount.userValue} TRY</span>
                    </div>
                  </div>
                </div>

                {/* İsim */}
                {comparison.name && (
                  <div className={`p-3 rounded-lg border-2 ${comparison.name.match ? 'bg-green-500/10 border-green-500/50' : 'bg-yellow-500/10 border-yellow-500/50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">Alacaklı Adı</span>
                      {comparison.name.match ? (
                        <CheckCircle2 className="text-green-400" size={20} />
                      ) : (
                        <XCircle className="text-yellow-400" size={20} />
                      )}
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="text-white/70">
                        Dekontta: <span className="text-white">{comparison.name.extracted}</span>
                      </div>
                      <div className="text-white/70">
                        Kullanıcı: <span className="text-white">{comparison.name.userValue}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* IBAN */}
                <div className={`p-3 rounded-lg border-2 ${comparison.iban.match ? 'bg-green-500/10 border-green-500/50' : 'bg-yellow-500/10 border-yellow-500/50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold">IBAN</span>
                    {comparison.iban.match ? (
                      <CheckCircle2 className="text-green-400" size={20} />
                    ) : (
                      <XCircle className="text-yellow-400" size={20} />
                    )}
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="text-white/70">
                      Durum: <span className="text-white">{comparison.iban.extracted}</span>
                    </div>
                    <div className="text-white/70">
                      Kullanıcı IBAN (son 6): <span className="text-white">{comparison.iban.userValue}</span>
                    </div>
                  </div>
                </div>

                {/* Tarih */}
                <div className={`p-3 rounded-lg border-2 ${comparison.date.match ? 'bg-green-500/10 border-green-500/50' : 'bg-yellow-500/10 border-yellow-500/50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold">Tarih</span>
                    {comparison.date.match ? (
                      <CheckCircle2 className="text-green-400" size={20} />
                    ) : (
                      <XCircle className="text-yellow-400" size={20} />
                    )}
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="text-white/70">
                      Dekontta: <span className="text-white">{comparison.date.extracted}</span>
                    </div>
                    <div className="text-white/70">
                      Kullanıcı: <span className="text-white">{comparison.date.userValue}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* OCR Metin (Gizlenebilir) */}
            {ocrText && (
              <details className="glass rounded-xl p-4 border border-white/20">
                <summary className="text-white/70 cursor-pointer text-sm">OCR Metnini Göster</summary>
                <div className="mt-3 p-3 bg-black/30 rounded text-xs text-white/70 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {ocrText}
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReceiptOCR

