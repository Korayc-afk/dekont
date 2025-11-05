import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CheckCircle2, XCircle, Clock, FileText, ArrowLeft, User as UserIcon } from 'lucide-react'
import { storageService } from '../services/storageService'
import Logo from './Logo'

const ReceiptQuery = () => {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [tickets, setTickets] = useState([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!userId.trim()) {
      alert('Lütfen kullanıcı ID giriniz!')
      return
    }

    try {
      const userTickets = await storageService.getTicketsByUserId(userId.trim())
      setTickets(userTickets)
      setHasSearched(true)
    } catch (error) {
      console.error('Error fetching tickets:', error)
      alert('Sorgulama sırasında bir hata oluştu')
      setTickets([])
      setHasSearched(true)
    }
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Onaylandı',
          icon: CheckCircle2,
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/50'
        }
      case 'rejected':
        return {
          label: 'Reddedildi',
          icon: XCircle,
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/50'
        }
      case 'pending':
      default:
        return {
          label: 'İşlemde',
          icon: Clock,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/50'
        }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
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

  return (
    <div className="min-h-screen p-4 sm:p-6 relative" style={{ backgroundColor: '#161d2c' }}>
      {/* Logo */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-20">
        <Logo size="text-xl sm:text-2xl" />
      </div>

      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto pt-20 sm:pt-24">
        {/* Header */}
        <div className="glass-strong rounded-xl sm:rounded-3xl p-4 sm:p-6 mb-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-2">
                Dekont Kontrol Sorgu
              </h1>
              <p className="text-white/70 text-sm sm:text-base">Kullanıcı ID ile dekont durumunu sorgulayın</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg sm:rounded-xl transition-all duration-300 flex items-center gap-2 backdrop-blur-sm border border-white/20 text-sm sm:text-base"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Ana Sayfa</span>
            </button>
          </div>

          {/* Kullanıcı ID Arama */}
          <div className="space-y-4">
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
              <input
                type="text"
                placeholder="Kullanıcı ID'nizi giriniz"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/30 transition-all duration-300"
              />
            </div>
            <button
              onClick={handleSearch}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Search size={20} />
              Sorgula
            </button>
          </div>
        </div>

        {/* Sonuçlar */}
        {hasSearched && (
          <div className="glass-strong rounded-xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              Sonuçlar ({tickets.length} dekont)
            </h2>

            {tickets.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto mb-4 text-white/50" size={48} />
                <p className="text-white/70 text-lg">Bu kullanıcı ID'ye ait dekont bulunamadı.</p>
                <p className="text-white/50 text-sm mt-2">Lütfen kullanıcı ID'nizi kontrol edin.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => {
                  const statusInfo = getStatusInfo(ticket.status)
                  const StatusIcon = statusInfo.icon

                  return (
                    <div
                      key={ticket.id}
                      className={`glass rounded-xl p-4 sm:p-6 border-2 ${statusInfo.borderColor}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        {/* Sol taraf - Bilgiler */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`px-3 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.borderColor} border flex items-center gap-2`}>
                              <StatusIcon className={statusInfo.color} size={18} />
                              <span className={`${statusInfo.color} font-semibold text-sm`}>
                                {statusInfo.label}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-white/70">Alıcı Adı:</span>
                              <span className="text-white ml-2 font-semibold">{ticket.recipientName}</span>
                            </div>
                            <div>
                              <span className="text-white/70">Tutar:</span>
                              <span className="text-white ml-2 font-semibold">{formatCurrency(ticket.investmentAmount)}</span>
                            </div>
                            <div>
                              <span className="text-white/70">IBAN:</span>
                              <span className="text-white ml-2 font-mono text-xs">{ticket.recipientIban}</span>
                            </div>
                            <div>
                              <span className="text-white/70">Tarih:</span>
                              <span className="text-white ml-2">{formatDate(ticket.investmentDateTime)}</span>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-white/70">Yatırım Yöntemi:</span>
                              <span className="text-white ml-2">{ticket.investmentMethod}</span>
                            </div>
                          </div>

                          {/* Admin Notu */}
                          {ticket.adminNote && (
                            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                              <div className="flex items-start gap-2">
                                <FileText className="text-blue-400 mt-0.5" size={18} />
                                <div className="flex-1">
                                  <p className="text-blue-400 font-semibold text-sm mb-1">Admin Notu:</p>
                                  <p className="text-white/80 text-sm">{ticket.adminNote}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReceiptQuery

