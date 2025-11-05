import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import logoImage from '/logo.png'

const Logo = ({ className = '', size = 'h-10' }) => {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <a 
        href="https://padisah.pro" 
        target="_blank" 
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
      >
        <img 
          src={logoImage} 
          alt="Padisahbet" 
          className={size}
          style={{ height: 'auto', maxWidth: '200px' }}
        />
      </a>
    </div>
  )
}

export default Logo

