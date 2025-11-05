import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authUtils } from '../utils/auth'
import { 
  Search, Filter, Eye, Trash2, CheckCircle2, XCircle, 
  Calendar, DollarSign, User, FileText, ArrowLeft, LogOut,
  Download, Image as ImageIcon, File, TrendingUp, CreditCard
} from 'lucide-react'
import { storageService } from '../services/storageService'
import ReceiptPreview from './ReceiptPreview'
import Logo from './Logo'

const AdminPanel = () => {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [filteredTickets, setFilteredTickets] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    // Admin authentication kontrolü
    if (!authUtils.isAuthenticated()) {
      navigate('/yönetim-giriş-secure', { replace: true })
      return
    }

    // Session yenile
    authUtils.refreshSession()

    // Session timeout kontrolü (her 5 dakikada bir)
    const sessionCheckInterval = setInterval(() => {
      if (!authUtils.isAuthenticated()) {
        navigate('/yönetim-giriş-secure', { replace: true })
      }
    }, 5 * 60 * 1000)

    loadTickets()

    return () => clearInterval(sessionCheckInterval)
  }, [navigate])

  useEffect(() => {
    filterTickets()
  }, [tickets, searchTerm, statusFilter, dateFilter])

  const loadTickets = async () => {
    try {
      const allTickets = await storageService.getAllTickets()
      setTickets(allTickets)
    } catch (error) {
      console.error('Error loading tickets:', error)
      setTickets([])
    }
  }

  const filterTickets = () => {
    let filtered = [...tickets]

    // Arama filtresi
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(ticket =>
        ticket.recipientName.toLowerCase().includes(term) ||
        ticket.recipientIban.toLowerCase().includes(term) ||
        ticket.investmentMethod.toLowerCase().includes(term) ||
        ticket.recipientName.toLowerCase().includes(term)
      )
    }

    // Durum filtresi
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter)
    }

    // Tarih filtresi
    if (dateFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(ticket => {
        const ticketDate = new Date(ticket.investmentDateTime)
        switch (dateFilter) {
          case 'today':
            return ticketDate.toDateString() === now.toDateString()
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return ticketDate >= weekAgo
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            return ticketDate >= monthAgo
          case 'old':
            const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            return ticketDate < threeMonthsAgo
          default:
            return true
        }
      })
    }

    // Tarihe göre sırala (en yeni başta)
    filtered.sort((a, b) => new Date(b.investmentDateTime) - new Date(a.investmentDateTime))

    setFilteredTickets(filtered)
  }

  const handleStatusChange = async (ticketId, newStatus, adminNote = '') => {
    try {
      const updates = { status: newStatus }
      if (adminNote) {
        updates.adminNote = adminNote
      }
      await storageService.updateTicket(ticketId, updates)
      await loadTickets()
    } catch (error) {
      console.error('Error updating ticket:', error)
      alert('Güncelleme sırasında bir hata oluştu')
    }
  }

  const handleDelete = async (ticketId) => {
    if (window.confirm('Bu dekontu silmek istediğinize emin misiniz?')) {
      try {
        await storageService.deleteTicket(ticketId)
        await loadTickets()
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(null)
          setShowPreview(false)
        }
      } catch (error) {
        console.error('Error deleting ticket:', error)
        alert('Silme sırasında bir hata oluştu')
      }
    }
  }

  const handlePreview = (ticket) => {
    setSelectedTicket(ticket)
    setShowPreview(true)
  }

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

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
      approved: 'bg-green-500/20 text-green-300 border-green-500/50',
      rejected: 'bg-red-500/20 text-red-300 border-red-500/50'
    }
    const labels = {
      pending: 'Beklemede',
      approved: 'Onaylandı',
      rejected: 'Reddedildi'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badges[status] || badges.pending}`}>
        {labels[status] || status}
      </span>
    )
  }

  const totalAmount = filteredTickets.reduce((sum, ticket) => sum + (ticket.investmentAmount || 0), 0)

  return (
    <div className="min-h-screen p-6 relative" style={{ backgroundColor: '#161d2c' }}>
      {/* Logo */}
      <div className="absolute top-6 left-6 z-20">
        <Logo size="text-2xl" />
      </div>

      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-strong rounded-3xl p-6 mb-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-2">
                Admin Paneli
              </h1>
              <p className="text-white/70">Dekont yönetimi ve izleme</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/sorgu')}
                className="px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-xl transition-all duration-300 flex items-center gap-2 backdrop-blur-sm border border-purple-500/50"
              >
                <FileText size={20} />
                Dekont Sorgu
              </button>
              <button
                onClick={() => authUtils.logout()}
                className="px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-xl transition-all duration-300 flex items-center gap-2 backdrop-blur-sm border border-red-500/50"
              >
                <LogOut size={20} />
                Çıkış Yap
              </button>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="glass rounded-xl p-4 border border-white/20">
              <div className="text-white/70 text-sm mb-1">Toplam Dekont</div>
              <div className="text-2xl font-bold text-white">{filteredTickets.length}</div>
            </div>
            <div className="glass rounded-xl p-4 border border-white/20">
              <div className="text-white/70 text-sm mb-1">Toplam Tutar</div>
              <div className="text-2xl font-bold text-green-400">{formatCurrency(totalAmount)}</div>
            </div>
            <div className="glass rounded-xl p-4 border border-white/20">
              <div className="text-white/70 text-sm mb-1">Beklemede</div>
              <div className="text-2xl font-bold text-yellow-400">
                {filteredTickets.filter(t => t.status === 'pending').length}
              </div>
            </div>
            <div className="glass rounded-xl p-4 border border-white/20">
              <div className="text-white/70 text-sm mb-1">Onaylandı</div>
              <div className="text-2xl font-bold text-green-400">
                {filteredTickets.filter(t => t.status === 'approved').length}
              </div>
            </div>
          </div>

          {/* Filtreler */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
              <input
                type="text"
                placeholder="Ara (isim, IBAN, yöntem)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/30 transition-all duration-300"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/30 transition-all duration-300"
            >
              <option value="all" className="bg-slate-800">Tüm Durumlar</option>
              <option value="pending" className="bg-slate-800">Beklemede</option>
              <option value="approved" className="bg-slate-800">Onaylandı</option>
              <option value="rejected" className="bg-slate-800">Reddedildi</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-400/30 transition-all duration-300"
            >
              <option value="all" className="bg-slate-800">Tüm Tarihler</option>
              <option value="today" className="bg-slate-800">Bugün</option>
              <option value="week" className="bg-slate-800">Son 7 Gün</option>
              <option value="month" className="bg-slate-800">Son 30 Gün</option>
              <option value="old" className="bg-slate-800">Eski (90+ gün)</option>
            </select>
          </div>
        </div>

        {/* Dekont Listesi */}
        <div className="glass-strong rounded-3xl p-6 shadow-2xl">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-white/30 mb-4" size={64} />
              <p className="text-white/70 text-lg">Henüz dekont bulunmuyor</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="glass rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 hover:bg-white/5"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Sol taraf - Bilgiler */}
                    <div className="lg:col-span-8 space-y-3">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <User size={18} className="text-blue-400" />
                          <span className="text-white font-semibold">{ticket.recipientName}</span>
                        </div>
                        {getStatusBadge(ticket.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-white/70">
                          <CreditCard size={16} className="text-purple-400" />
                          <span className="font-mono">{ticket.recipientIban}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <TrendingUp size={16} className="text-pink-400" />
                          <span>{getMethodLabel(ticket.investmentMethod)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <DollarSign size={16} className="text-green-400" />
                          <span className="font-semibold text-green-400">{formatCurrency(ticket.investmentAmount)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <Calendar size={16} className="text-yellow-400" />
                          <span>{formatDate(ticket.investmentDateTime)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sağ taraf - Aksiyonlar */}
                    <div className="lg:col-span-4 flex flex-wrap gap-2 justify-end">
                      <button
                        onClick={() => handlePreview(ticket)}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all duration-300 flex items-center gap-2 border border-blue-500/50"
                      >
                        <Eye size={18} />
                        Önizle
                      </button>
                      {ticket.status !== 'approved' && (
                        <button
                          onClick={() => handleStatusChange(ticket.id, 'approved')}
                          className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-all duration-300 flex items-center gap-2 border border-green-500/50"
                        >
                          <CheckCircle2 size={18} />
                          Onayla
                        </button>
                      )}
                      {ticket.status !== 'rejected' && (
                        <button
                          onClick={() => handleStatusChange(ticket.id, 'rejected')}
                          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all duration-300 flex items-center gap-2 border border-red-500/50"
                        >
                          <XCircle size={18} />
                          Reddet
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(ticket.id)}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all duration-300 flex items-center gap-2 border border-red-500/50"
                      >
                        <Trash2 size={18} />
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dekont Önizleme Modal */}
      {showPreview && selectedTicket && (
        <ReceiptPreview
          ticket={selectedTicket}
          onClose={() => {
            setShowPreview(false)
            setSelectedTicket(null)
          }}
          onStatusChange={(newStatus, adminNote) => {
            handleStatusChange(selectedTicket.id, newStatus, adminNote)
          }}
        />
      )}
    </div>
  )
}

export default AdminPanel

