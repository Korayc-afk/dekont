// Backend authentication middleware (opsiyonel - gelecekte eklenebilir)
// Şu an frontend'de authentication yapılıyor

const authenticateAdmin = (req, res, next) => {
  // Frontend'de yapıldığı için şimdilik pasif
  // İleride backend'de de token kontrolü eklenebilir
  next()
}

module.exports = {
  authenticateAdmin
}

