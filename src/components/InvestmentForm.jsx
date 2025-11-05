import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Calendar, DollarSign, User, CreditCard, TrendingUp, FileText, AlertTriangle } from 'lucide-react'
import { storageService } from '../services/storageService'
import CustomTimePicker from './CustomTimePicker'

const InvestmentForm = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    userId: '',
    recipientName: '',
    recipientIban: '',
    investmentMethod: '',
    investmentAmount: '',
    investmentDate: '',
    investmentTime: '',
    receipt: null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fileError, setFileError] = useState('')
  const [ibanError, setIbanError] = useState('')
  const [timeError, setTimeError] = useState('')

  const fileInputRef = useRef(null)

  // Maksimum tarih ve saat (şu anki) - dinamik olarak hesapla
  const getMaxDateTime = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    
    return {
      maxDate: `${year}-${month}-${day}`,
      maxTime: `${hours}:${minutes}`
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Tarih ve saat değişikliğini birleştir
  const handleDateTimeChange = (type, value) => {
    setFormData(prev => {
      const newData = { ...prev }
      const maxDateTime = getMaxDateTime()
      
      if (type === 'date') {
        newData.investmentDate = value
        // Eğer bugün seçildiyse, maksimum saat kontrolü yap
        if (value === maxDateTime.maxDate && prev.investmentTime) {
          const [hours, minutes] = prev.investmentTime.split(':')
          const [maxHours, maxMinutes] = maxDateTime.maxTime.split(':')
          if (hours > maxHours || (hours === maxHours && minutes > maxMinutes)) {
            newData.investmentTime = maxDateTime.maxTime
          }
        }
        // Eğer geçmiş bir tarihe geçildiyse, saat kısıtlamasını kaldır
        if (value < maxDateTime.maxDate) {
          // Geçmiş tarih seçildi, saat kısıtlaması yok
        }
      } else {
        // Saat değişikliği
        newData.investmentTime = value
        
        // Eğer bugün seçildiyse ve ileri saat seçildiyse, maksimum saate ayarla
        if (prev.investmentDate === maxDateTime.maxDate) {
          const [hours, minutes] = value.split(':')
          const [maxHours, maxMinutes] = maxDateTime.maxTime.split(':')
          if (hours > maxHours || (hours === maxHours && minutes > maxMinutes)) {
            newData.investmentTime = maxDateTime.maxTime
            setTimeError('Gelecek saat seçilemez! Şu anki saatten ileri bir saat seçemezsiniz.')
            setTimeout(() => setTimeError(''), 3000)
          } else {
            setTimeError('')
          }
        } else {
          setTimeError('')
        }
      }
      return newData
    })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Dosya boyutu kontrolü - max 5MB
      const maxSize = 5 * 1024 * 1024 // 5MB in bytes
      if (file.size > maxSize) {
        setFileError('Dosya boyutu 5MB\'dan büyük olamaz!')
        setFormData(prev => ({ ...prev, receipt: null }))
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      // Dosya tipi kontrolü - sadece JPG, PNG, WEBP, PDF
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
      const fileExtension = file.name.split('.').pop().toLowerCase()
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf']
      
      // MIME type veya uzantı kontrolü
      const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)
      
      if (!isValidType) {
        setFileError('Sadece JPG, PNG, WEBP ve PDF dosyaları yüklenebilir!')
        setFormData(prev => ({ ...prev, receipt: null }))
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      // Dosya tipini normalize et
      let normalizedType = file.type
      if (!normalizedType || normalizedType === 'application/octet-stream') {
        if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
          normalizedType = 'image/jpeg'
        } else if (fileExtension === 'png') {
          normalizedType = 'image/png'
        } else if (fileExtension === 'webp') {
          normalizedType = 'image/webp'
        } else if (fileExtension === 'pdf') {
          normalizedType = 'application/pdf'
        }
      }

      setFileError('')
      
      // File'ı base64'e çevir (localStorage için)
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          receipt: {
            file: file,
            name: file.name,
            type: normalizedType,
            size: file.size,
            dataUrl: reader.result
          }
        }))
      }
      reader.onerror = () => {
        setFileError('Dosya okunurken bir hata oluştu!')
        setFormData(prev => ({ ...prev, receipt: null }))
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
      reader.readAsDataURL(file)
    } else {
      setFileError('')
      setFormData(prev => ({ ...prev, receipt: null }))
    }
  }

  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Tüm alanların dolu olduğunu kontrol et
      if (!formData.userId || !formData.userId.trim()) {
        alert('Lütfen kullanıcı ID\'nizi giriniz!')
        setIsSubmitting(false)
        return
      }

      if (!formData.recipientName || !formData.recipientName.trim()) {
        alert('Lütfen alıcı adını giriniz!')
        setIsSubmitting(false)
        return
      }

      // IBAN validasyonu
      if (!formData.recipientIban || formData.recipientIban.length !== 24) {
        setIbanError('IBAN 24 haneli olmalıdır (TR ile birlikte 26 karakter)')
        setIsSubmitting(false)
        return
      }

      if (!formData.investmentMethod) {
        alert('Lütfen yatırım yöntemi (banka) seçiniz!')
        setIsSubmitting(false)
        return
      }

      if (!formData.investmentAmount || parseFloat(formData.investmentAmount) <= 0) {
        alert('Lütfen geçerli bir yatırım tutarı giriniz!')
        setIsSubmitting(false)
        return
      }

      if (!formData.investmentDate || !formData.investmentTime) {
        alert('Lütfen yatırım tarihi ve saatini seçiniz!')
        setIsSubmitting(false)
        return
      }

      if (!formData.receipt) {
        alert('Lütfen dekont dosyasını yükleyiniz!')
        setIsSubmitting(false)
        return
      }

      // Tarih ve saati birleştir
      const investmentDateTime = formData.investmentDate && formData.investmentTime 
        ? `${formData.investmentDate}T${formData.investmentTime}:00`
        : ''

      // Form verilerini kaydet
      const ticketData = {
        userId: formData.userId.trim(),
        recipientName: formData.recipientName,
        recipientIban: `TR${formData.recipientIban}`,
        investmentMethod: formData.investmentMethod,
        investmentAmount: parseFloat(formData.investmentAmount) || 0,
        investmentDateTime: investmentDateTime,
        receipt: formData.receipt
      }

      await storageService.addTicket(ticketData)

      // Formu temizle
      setFormData({
        userId: '',
        recipientName: '',
        recipientIban: '',
        investmentMethod: '',
        investmentAmount: '',
        investmentDate: '',
        investmentTime: '',
        receipt: null
      })

      // Dosya input'unu temizle
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setFileError('')
      setIbanError('')
      setTimeError('')

      alert('Dekont başarıyla gönderildi!')
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative z-10 w-full max-w-2xl">
      {/* Decorative elements */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
      <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-pink-400 to-blue-600 rounded-full blur-2xl opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <form 
        onSubmit={handleSubmit}
        className="glass-strong rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 opacity-50 pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Arial, sans-serif', letterSpacing: '2px' }}>
              DEKONT KONTROL
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mx-auto rounded-full"></div>
          </div>

          {/* Kullanıcı ID */}
          <div className="group">
            <label className="flex items-center gap-2 text-white/90 font-semibold mb-2 text-sm uppercase tracking-wide">
              <User size={18} className="text-green-400 group-hover:text-green-300 transition-colors" />
              Kullanıcı ID <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="userId"
                value={formData.userId}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-400/30 transition-all duration-300 hover:bg-white/15"
                placeholder="Kullanıcı ID'nizi giriniz"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/0 via-green-500/20 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            <div className="mt-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-300 text-xs flex items-start gap-2">
                <span className="text-yellow-400 font-bold">⚠️</span>
                <span>Lütfen kullanıcı ID'nizi doğru yazın. Yanlış ID, talebinizin incelenmesini geciktirebilir.</span>
              </p>
            </div>
          </div>

          {/* Alıcı Adı */}
          <div className="group">
            <label className="flex items-center gap-2 text-white/90 font-semibold mb-2 text-sm uppercase tracking-wide">
              <User size={18} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
              Alıcı Adı <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/30 transition-all duration-300 hover:bg-white/15"
                placeholder="Alıcı adını giriniz"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          {/* Alıcı IBAN'ı */}
          <div className="group">
            <label className="flex items-center gap-2 text-white/90 font-semibold mb-2 text-sm uppercase tracking-wide">
              <CreditCard size={18} className="text-purple-400 group-hover:text-purple-300 transition-colors" />
              Alıcı IBAN'ı <span className="text-red-400">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="px-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-r-0 border-white/20 rounded-l-xl text-white font-semibold">
                TR
              </span>
              <input
                type="text"
                name="recipientIban"
                value={formData.recipientIban}
                onChange={(e) => {
                  // Sadece rakam girişine izin ver
                  const value = e.target.value.replace(/\D/g, '')
                  // Maksimum 24 rakam (TR ile birlikte 26 karakter olacak)
                  const limitedValue = value.slice(0, 24)
                  
                  setFormData(prev => ({
                    ...prev,
                    recipientIban: limitedValue
                  }))
                  
                  // IBAN validasyonu
                  if (limitedValue.length > 0 && limitedValue.length < 24) {
                    setIbanError('IBAN 24 haneli olmalıdır (TR ile birlikte 26 karakter)')
                  } else if (limitedValue.length === 24) {
                    setIbanError('')
                  } else {
                    setIbanError('')
                  }
                }}
                onBlur={() => {
                  // Input'tan çıkıldığında kontrol et
                  if (formData.recipientIban.length > 0 && formData.recipientIban.length !== 24) {
                    setIbanError('IBAN 24 haneli olmalıdır (TR ile birlikte 26 karakter)')
                  } else {
                    setIbanError('')
                  }
                }}
                maxLength={24}
                required
                className={`flex-1 px-4 py-3 backdrop-blur-sm border-2 rounded-r-xl text-white placeholder-white/50 focus:outline-none focus:ring-4 transition-all duration-300 hover:bg-white/15 ${
                  ibanError 
                    ? 'bg-red-500/10 border-red-500/50 focus:border-red-400 focus:ring-red-400/30' 
                    : 'bg-white/10 border-white/20 focus:border-purple-400 focus:ring-purple-400/30'
                }`}
                placeholder="00 0000 0000 0000 0000 0000 00"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              {ibanError && (
                <div className="mt-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                  {ibanError}
                </div>
              )}
              {!ibanError && formData.recipientIban.length > 0 && formData.recipientIban.length === 24 && (
                <div className="mt-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm">
                  ✓ IBAN formatı doğru (TR ile birlikte 26 karakter)
                </div>
              )}
            </div>
          </div>

          {/* Yatırım Yöntemi */}
          <div className="group">
            <label className="flex items-center gap-2 text-white/90 font-semibold mb-2 text-sm uppercase tracking-wide">
              <TrendingUp size={18} className="text-pink-400 group-hover:text-pink-300 transition-colors" />
              Yatırım Yöntemi <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                name="investmentMethod"
                value={formData.investmentMethod}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-400/30 transition-all duration-300 hover:bg-white/15 appearance-none cursor-pointer"
              >
                <option value="" className="bg-slate-800 text-white">Banka seçiniz</option>
                <option value="akbank" className="bg-slate-800 text-white">Akbank</option>
                <option value="garanti" className="bg-slate-800 text-white">Garanti BBVA</option>
                <option value="yapi-kredi" className="bg-slate-800 text-white">Yapı Kredi</option>
                <option value="is-bankasi" className="bg-slate-800 text-white">İş Bankası</option>
                <option value="ziraat" className="bg-slate-800 text-white">Ziraat Bankası</option>
                <option value="vakifbank" className="bg-slate-800 text-white">Vakıfbank</option>
                <option value="halkbank" className="bg-slate-800 text-white">Halkbank</option>
                <option value="denizbank" className="bg-slate-800 text-white">Denizbank</option>
                <option value="teb" className="bg-slate-800 text-white">TEB</option>
                <option value="qnb-finansbank" className="bg-slate-800 text-white">QNB Finansbank</option>
                <option value="ing-bank" className="bg-slate-800 text-white">ING Bank</option>
                <option value="hsbc" className="bg-slate-800 text-white">HSBC</option>
                <option value="citi-bank" className="bg-slate-800 text-white">Citibank</option>
                <option value="odeabank" className="bg-slate-800 text-white">Odea Bank</option>
                <option value="turkland-bank" className="bg-slate-800 text-white">Türkland Bank</option>
                <option value="albaraka" className="bg-slate-800 text-white">Albaraka Türk</option>
                <option value="kuveyt-turk" className="bg-slate-800 text-white">Kuveyt Türk</option>
                <option value="ziraat-katilim" className="bg-slate-800 text-white">Ziraat Katılım</option>
                <option value="vakif-katilim" className="bg-slate-800 text-white">Vakıf Katılım</option>
                <option value="emlak-katilim" className="bg-slate-800 text-white">Emlak Katılım</option>
                <option value="turk-ekonomi-bankasi" className="bg-slate-800 text-white">Türk Ekonomi Bankası</option>
                <option value="anadolubank" className="bg-slate-800 text-white">Anadolubank</option>
                <option value="sekarbank" className="bg-slate-800 text-white">Şekerbank</option>
                <option value="turkish-bank" className="bg-slate-800 text-white">Turkish Bank</option>
                <option value="other" className="bg-slate-800 text-white">Diğer Banka</option>
              </select>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/0 via-pink-500/20 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          {/* Yatırım Tutarı */}
          <div className="group">
            <label className="flex items-center gap-2 text-white/90 font-semibold mb-2 text-sm uppercase tracking-wide">
              <DollarSign size={18} className="text-green-400 group-hover:text-green-300 transition-colors" />
              Yatırım Tutarı <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="investmentAmount"
                value={formData.investmentAmount}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-400/30 transition-all duration-300 hover:bg-white/15"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/0 via-green-500/20 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          {/* Yatırım Tarihi ve Saati */}
          <div className="group">
            <label className="flex items-center gap-2 text-white/90 font-semibold mb-2 text-sm uppercase tracking-wide">
              <Calendar size={18} className="text-yellow-400 group-hover:text-yellow-300 transition-colors" />
              Yatırım Tarihi ve Saati <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="date"
                  name="investmentDate"
                  value={formData.investmentDate}
                  onChange={(e) => handleDateTimeChange('date', e.target.value)}
                  max={getMaxDateTime().maxDate}
                  required
                  lang="tr"
                  data-format="DD/MM/YYYY"
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/30 transition-all duration-300 hover:bg-white/15"
                  style={{ colorScheme: 'dark' }}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/0 via-yellow-500/20 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <p className="absolute -bottom-5 left-0 text-xs text-white/50">GG/AA/YYYY</p>
              </div>
              <div className="relative">
                <CustomTimePicker
                  value={formData.investmentTime}
                  onChange={(e) => handleDateTimeChange('time', e.target.value)}
                  max={formData.investmentDate === getMaxDateTime().maxDate ? getMaxDateTime().maxTime : undefined}
                  required
                  className="w-full px-4 py-3 pr-12 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/30 transition-all duration-300 hover:bg-white/15"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/0 via-yellow-500/20 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <p className="absolute -bottom-5 left-0 text-xs text-white/50">24 saat formatı (SS:DD)</p>
              </div>
            </div>
            {timeError && (
              <div className="mt-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                {timeError}
              </div>
            )}
            <div className="mt-7">
              <p className="text-xs text-white/50">
                Gelecek tarih ve saat seçilemez. Sadece bugün ve geçmiş tarihler kabul edilir.
              </p>
            </div>
          </div>

          {/* Dekont (File Upload) */}
          <div className="group">
            <label className="flex items-center gap-2 text-white/90 font-semibold mb-2 text-sm uppercase tracking-wide">
              <Upload size={18} className="text-cyan-400 group-hover:text-cyan-300 transition-colors" />
              Dekont <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleFileButtonClick}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center gap-2"
                >
                  <Upload size={18} />
                  Dosya Seç
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
                  required
                />
                <div className={`flex-1 px-4 py-3 backdrop-blur-sm border-2 rounded-xl flex items-center overflow-hidden transition-all duration-300 ${
                  fileError 
                    ? 'bg-red-500/10 border-red-500/50 text-red-300' 
                    : formData.receipt 
                      ? 'bg-green-500/10 border-green-500/50 text-green-300' 
                      : 'bg-white/10 border-white/20 text-white/70'
                }`}>
                  <span className="truncate">
                    {formData.receipt ? formData.receipt.name : 'Dosya seçilmedi (JPG, PNG, WEBP, PDF)'}
                  </span>
                </div>
              </div>
              {fileError && (
                <div className="mt-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                  {fileError}
                </div>
              )}
              <p className="mt-1 text-xs text-white/50">Sadece JPG, PNG, WEBP ve PDF dosyaları kabul edilir (Maksimum 5MB)</p>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
          </button>

          {/* Dekont Sorgu Butonu */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/sorgu')}
              className="px-6 py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-xl transition-all duration-300 flex items-center gap-2 backdrop-blur-sm border border-purple-500/50 mx-auto"
            >
              <FileText size={18} />
              Dekont Durumumu Sorgula
            </button>
          </div>

          {/* Uyarı Metinleri */}
          <div className="mt-8 pt-6 border-t border-white/20 space-y-3">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <h3 className="text-yellow-400 font-semibold mb-2 text-sm">⚠️ ÖNEMLİ UYARILAR</h3>
              <ul className="space-y-2 text-xs text-white/80 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>Tüm dekontlar titizlikle incelenmektedir. Sahte dekont gönderen üyelerimize cezai işlem uygulanacaktır.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>Dekont kontrolü 1-24 saat arasında tamamlanmaktadır. Lütfen sabırla bekleyiniz.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>İşleminizde hata olduğunu düşünüyorsanız veya sorularınız için <a href="mailto:destek@padisahbet.com" className="text-blue-400 hover:underline">destek@padisahbet.com</a> adresine e-posta gönderebilirsiniz.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>Dekont görselleri net, okunabilir ve eksiksiz olmalıdır. Blur, kesik veya yarım görseller reddedilir.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>Yatırım tutarı dekonttaki tutarla tam olarak eşleşmelidir. Tutarsızlık durumunda işlem reddedilir.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>Her dekont yalnızca bir kez kullanılabilir. Tekrar kullanım tespit edildiğinde hesap askıya alınır.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default InvestmentForm
