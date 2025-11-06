import React, { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

const CustomTimePicker = ({ value, onChange, max, required, className }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  const getHoursFromValue = (val) => {
    if (val) {
      const [h] = val.split(':')
      return parseInt(h) || 0
    }
    return 0
  }
  
  const getMinutesFromValue = (val) => {
    if (val) {
      const [, m] = val.split(':')
      return parseInt(m) || 0
    }
    return 0
  }
  
  const [hours, setHours] = useState(() => getHoursFromValue(value))
  const [minutes, setMinutes] = useState(() => getMinutesFromValue(value))

  // Value değiştiğinde state'leri güncelle
  useEffect(() => {
    if (value) {
      setHours(getHoursFromValue(value))
      setMinutes(getMinutesFromValue(value))
    }
  }, [value])

  const maxHours = max ? parseInt(max.split(':')[0]) : 23
  const maxMinutes = max ? parseInt(max.split(':')[1]) : 59

  const handleHoursChange = (h) => {
    let newHours = h
    if (newHours < 0) newHours = 0
    if (newHours > 23) newHours = 23
    
    // Max kontrolü
    if (max && newHours > maxHours) {
      newHours = maxHours
      setMinutes(Math.min(minutes, maxMinutes))
    }
    
    setHours(newHours)
    const timeString = `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    onChange({ target: { value: timeString } })
  }

  const handleMinutesChange = (m) => {
    let newMinutes = m
    if (newMinutes < 0) newMinutes = 0
    if (newMinutes > 59) newMinutes = 59
    
    // Max kontrolü
    if (max && hours === maxHours && newMinutes > maxMinutes) {
      newMinutes = maxMinutes
    }
    
    setMinutes(newMinutes)
    const timeString = `${String(hours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`
    onChange({ target: { value: timeString } })
  }

  const handleInputChange = (e) => {
    const val = e.target.value
    if (val.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      const [h, m] = val.split(':')
      setHours(parseInt(h))
      setMinutes(parseInt(m))
      onChange(e)
    }
  }

  const displayValue = value || `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="SS:DD"
          required={required}
          pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
          className={className}
          maxLength={5}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
        >
          <Clock size={20} />
        </button>
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10 bg-black/20" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute top-full left-0 mt-2 z-20 bg-slate-900/95 backdrop-blur-lg rounded-xl p-4 border border-white/30 shadow-2xl">
            <div className="flex gap-4 items-center">
              <div className="flex flex-col items-center">
                <label className="text-white text-xs mb-2 font-semibold">Saat</label>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {Array.from({ length: 24 }, (_, i) => {
                    const isMax = max && i === maxHours && minutes > maxMinutes
                    const isDisabled = max && i > maxHours
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          handleHoursChange(i)
                          setIsOpen(false)
                        }}
                        disabled={isDisabled}
                        className={`w-12 px-3 py-1 rounded text-sm transition-all font-medium ${
                          hours === i
                            ? 'bg-blue-600 text-white shadow-lg'
                            : isDisabled
                            ? 'text-white/30 cursor-not-allowed'
                            : 'text-white hover:bg-white/20 hover:text-white'
                        }`}
                      >
                        {String(i).padStart(2, '0')}
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <div className="text-white text-2xl font-bold">:</div>
              
              <div className="flex flex-col items-center">
                <label className="text-white text-xs mb-2 font-semibold">Dakika</label>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {Array.from({ length: 60 }, (_, i) => {
                    const isDisabled = max && hours === maxHours && i > maxMinutes
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          handleMinutesChange(i)
                          setIsOpen(false)
                        }}
                        disabled={isDisabled}
                        className={`w-12 px-3 py-1 rounded text-sm transition-all font-medium ${
                          minutes === i
                            ? 'bg-blue-600 text-white shadow-lg'
                            : isDisabled
                            ? 'text-white/30 cursor-not-allowed'
                            : 'text-white hover:bg-white/20 hover:text-white'
                        }`}
                      >
                        {String(i).padStart(2, '0')}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default CustomTimePicker

