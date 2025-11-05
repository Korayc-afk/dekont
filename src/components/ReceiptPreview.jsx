import React, { useState, useEffect } from 'react'
import { X, CheckCircle2, XCircle, Download, User, CreditCard, TrendingUp, DollarSign, Calendar, FileText, ZoomIn, ZoomOut, Scan, Shield, MessageSquare, Save } from 'lucide-react'
import ReceiptOCR from './ReceiptOCR'
import ReceiptFraudAnalysis from './ReceiptFraudAnalysis'
import { storageService } from '../services/storageService'

const ReceiptPreview = ({ ticket, onClose, onStatusChange }) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showOCR, setShowOCR] = useState(false)
  const [showFraudAnalysis, setShowFraudAnalysis] = useState(false)
  const [adminNote, setAdminNote] = useState(ticket.adminNote || '')
  const [showNoteInput, setShowNoteInput] = useState(false)

  // ESC tuşu ile tam ekranı kapat
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isFullscreen])
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const getMethodLabel = (method) => {
    const methods = {
      'akbank': 'Akbank',
      'garanti': 'Garanti BBVA',
      'yapi-kredi': 'Yapı Kredi',
      'is-bankasi': 'İş Bankası',
      'ziraat': 'Ziraat Bankası',
      'vakifbank': 'Vakıfbank',
      'halkbank': 'Halkbank',
      'denizbank': 'Denizbank',
      'teb': 'TEB',
      'qnb-finansbank': 'QNB Finansbank',
      'ing-bank': 'ING Bank',
      'hsbc': 'HSBC',
      'citi-bank': 'Citibank',
      'odeabank': 'Odea Bank',
      'turkland-bank': 'Türkland Bank',
      'albaraka': 'Albaraka Türk',
      'kuveyt-turk': 'Kuveyt Türk',
      'ziraat-katilim': 'Ziraat Katılım',
      'vakif-katilim': 'Vakıf Katılım',
      'emlak-katilim': 'Emlak Katılım',
      'turk-ekonomi-bankasi': 'Türk Ekonomi Bankası',
      'anadolubank': 'Anadolubank',
      'sekarbank': 'Şekerbank',
      'turkish-bank': 'Turkish Bank',
      'other': 'Diğer Banka'
    }
    return methods[method] || method
  }

  const handleDownload = () => {
    const receiptUrl = ticket.receiptUrl || ticket.receipt?.dataUrl
    if (receiptUrl) {
      const link = document.createElement('a')
      link.href = receiptUrl
      link.download = ticket.receiptOriginalName || ticket.receipt?.name || 'dekont'
      link.click()
    }
  }

  // Get receipt URL (backend veya frontend)
  const getReceiptUrl = () => {
    return ticket.receiptUrl || ticket.receipt?.dataUrl || ''
  }

  // Check if receipt is image
  const receiptUrl = getReceiptUrl()
  const isImage = receiptUrl && (
    ticket.receiptMimeType?.startsWith('image/') || 
    ticket.receipt?.type?.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp)$/i.test(receiptUrl)
  )
  const isPdf = receiptUrl && (
    ticket.receiptMimeType === 'application/pdf' ||
    ticket.receipt?.type === 'application/pdf' ||
    /\.pdf$/i.test(receiptUrl)
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-strong rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-300"
        >
          <X size={24} />
        </button>

        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-2">
              Dekont Önizleme
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
          </div>

          {/* Bilgiler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 text-white/70 mb-2">
                <User size={18} className="text-blue-400" />
                <span className="text-sm">Alıcı Adı</span>
              </div>
              <div className="text-white font-semibold text-lg">{ticket.recipientName}</div>
            </div>

            <div className="glass rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 text-white/70 mb-2">
                <CreditCard size={18} className="text-purple-400" />
                <span className="text-sm">IBAN</span>
              </div>
              <div className="text-white font-mono text-sm">{ticket.recipientIban}</div>
            </div>

            <div className="glass rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 text-white/70 mb-2">
                <TrendingUp size={18} className="text-pink-400" />
                <span className="text-sm">Yatırım Yöntemi</span>
              </div>
              <div className="text-white font-semibold">{getMethodLabel(ticket.investmentMethod)}</div>
            </div>

            <div className="glass rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 text-white/70 mb-2">
                <DollarSign size={18} className="text-green-400" />
                <span className="text-sm">Yatırım Tutarı</span>
              </div>
              <div className="text-green-400 font-bold text-xl">{formatCurrency(ticket.investmentAmount)}</div>
            </div>

            <div className="glass rounded-xl p-4 border border-white/20 md:col-span-2">
              <div className="flex items-center gap-2 text-white/70 mb-2">
                <Calendar size={18} className="text-yellow-400" />
                <span className="text-sm">Yatırım Tarihi ve Saati</span>
              </div>
              <div className="text-white font-semibold">{formatDate(ticket.investmentDateTime)}</div>
            </div>
          </div>

          {/* Dekont Önizleme */}
          <div className="glass rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white/70">
                <FileText size={18} className="text-cyan-400" />
                <span className="font-semibold">Dekont</span>
                {ticket.receipt?.name && (
                  <span className="text-sm text-white/50">({ticket.receipt.name})</span>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {receiptUrl && isImage && (
                  <>
                    <button
                      onClick={() => setShowOCR(true)}
                      className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-all duration-300 flex items-center gap-2 border border-purple-500/50"
                    >
                      <Scan size={18} />
                      OCR Kontrolü
                    </button>
                    <button
                      onClick={() => setShowFraudAnalysis(true)}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all duration-300 flex items-center gap-2 border border-red-500/50"
                    >
                      <Shield size={18} />
                      Sahte Analiz
                    </button>
                  </>
                )}
                {receiptUrl && (
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg transition-all duration-300 flex items-center gap-2 border border-cyan-500/50"
                  >
                    <Download size={18} />
                    İndir
                  </button>
                )}
              </div>
            </div>

            <div className="bg-black/30 rounded-xl p-4 min-h-[300px] flex items-center justify-center relative">
              {receiptUrl ? (
                <>
                  {isImage ? (
                    <div className="relative group">
                      <img
                        src={receiptUrl}
                        alt="Dekont"
                        className="max-w-full max-h-[500px] rounded-lg shadow-lg"
                      />
                      <button
                        onClick={() => setIsFullscreen(true)}
                        className="absolute bottom-4 right-4 p-3 bg-blue-600/90 hover:bg-blue-700 text-white rounded-full transition-all duration-300 shadow-lg opacity-0 group-hover:opacity-100 transform hover:scale-110"
                        title="Tam Ekran Görüntüle"
                      >
                        <ZoomIn size={24} />
                      </button>
                    </div>
                  ) : isPdf ? (
                    <div className="relative group w-full">
                      <iframe
                        src={receiptUrl}
                        className="w-full h-[500px] rounded-lg"
                        title="Dekont PDF"
                      />
                      <button
                        onClick={() => setIsFullscreen(true)}
                        className="absolute bottom-4 right-4 p-3 bg-blue-600/90 hover:bg-blue-700 text-white rounded-full transition-all duration-300 shadow-lg opacity-0 group-hover:opacity-100 transform hover:scale-110"
                        title="Tam Ekran Görüntüle"
                      >
                        <ZoomIn size={24} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-white/70">
                      <FileText size={64} className="mx-auto mb-4 opacity-50" />
                      <p>Dekont önizlemesi mevcut değil</p>
                      <p className="text-sm mt-2">{ticket.receipt.name}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-white/70">
                  <FileText size={64} className="mx-auto mb-4 opacity-50" />
                  <p>Dekont bulunamadı</p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Notu */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-white/90 font-semibold text-sm">
                <MessageSquare size={18} className="text-blue-400" />
                Admin Notu
              </label>
              <button
                onClick={() => setShowNoteInput(!showNoteInput)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {showNoteInput ? 'İptal' : adminNote ? 'Düzenle' : 'Not Ekle'}
              </button>
            </div>
            {showNoteInput ? (
              <div className="space-y-2">
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Notunuzu buraya yazın..."
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/30 transition-all duration-300 resize-none"
                  rows="3"
                />
                <button
                  onClick={() => {
                    storageService.updateTicket(ticket.id, { adminNote: adminNote.trim() })
                    setShowNoteInput(false)
                    onStatusChange(ticket.status, adminNote.trim())
                  }}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Notu Kaydet
                </button>
              </div>
            ) : (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                {adminNote ? (
                  <p className="text-white/80 text-sm">{adminNote}</p>
                ) : (
                  <p className="text-white/50 text-sm italic">Henüz not eklenmemiş</p>
                )}
              </div>
            )}
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex gap-4 pt-4 border-t border-white/20">
            {ticket.status !== 'approved' && (
              <button
                onClick={() => {
                  onStatusChange('approved', adminNote)
                  onClose()
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} />
                Onayla
              </button>
            )}
            {ticket.status !== 'rejected' && (
              <button
                onClick={() => {
                  onStatusChange('rejected', adminNote)
                  onClose()
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <XCircle size={20} />
                Reddet
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 border border-white/20"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>

      {/* Tam Ekran Modal */}
      {isFullscreen && receiptUrl && (
        <div 
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 z-10"
            title="Kapat"
          >
            <X size={28} />
          </button>
          
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            {isImage ? (
              <img
                src={receiptUrl}
                alt="Dekont - Tam Ekran"
                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            ) : isPdf ? (
              <iframe
                src={receiptUrl}
                className="w-[90vw] h-[90vh] rounded-lg shadow-2xl"
                title="Dekont PDF - Tam Ekran"
                onClick={(e) => e.stopPropagation()}
              />
            ) : null}
          </div>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/70 text-sm">
            <ZoomOut size={20} className="mx-auto mb-2 opacity-50" />
            <p>Kapatmak için tıklayın veya ESC tuşuna basın</p>
          </div>
        </div>
      )}

      {/* OCR Modal */}
      {showOCR && (
        <ReceiptOCR
          ticket={ticket}
          onClose={() => setShowOCR(false)}
        />
      )}

      {/* Sahte Analiz Modal */}
      {showFraudAnalysis && (
        <ReceiptFraudAnalysis
          ticket={ticket}
          onClose={() => setShowFraudAnalysis(false)}
        />
      )}
    </div>
  )
}

export default ReceiptPreview

