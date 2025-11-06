# GitHub Deployment Rehberi

## ✅ Güvenlik ve Best Practices

### 1. GitHub'dan Güncelleme Yapmak Güvenli mi?

**EVET, tamamen güvenli!** 

- ✅ Vercel otomatik deploy yapar
- ✅ Environment variables korunur (Vercel'de saklanır, GitHub'a gitmez)
- ✅ Eski deployment'lar korunur (rollback yapabilirsiniz)
- ✅ Preview deployment'lar oluşturulur (test edebilirsiniz)

### 2. Environment Variables Güvenliği

**Environment variables GitHub'a GİTMEZ:**
- `SUPABASE_URL` → Vercel Dashboard'da saklanır
- `SUPABASE_SERVICE_ROLE_KEY` → Vercel Dashboard'da saklanır
- `VITE_ADMIN_PASSWORD` → Vercel Dashboard'da saklanır

**Kontrol:**
- Vercel Dashboard → Settings → Environment Variables
- Production, Preview, Development için ayrı ayrı ayarlanabilir

### 3. Deployment Süreci

#### Otomatik Deploy (GitHub Push)
```bash
git add .
git commit -m "Update feature"
git push
```

**Ne olur:**
1. GitHub'a push yapılır
2. Vercel otomatik olarak deploy başlatır
3. Build yapılır
4. Test edilir
5. Production'a deploy edilir

#### Manuel Deploy (Vercel CLI)
```bash
vercel --prod
```

### 4. Preview Deployment (Test İçin)

**Her pull request için otomatik preview oluşturulur:**
- Test edebilirsiniz
- Production'u etkilemez
- URL: `https://dekont-ruby-git-branch-name.vercel.app`

**Kullanım:**
1. Feature branch oluşturun
2. Değişiklikleri yapın
3. Pull request açın
4. Preview URL'i alın
5. Test edin
6. Merge edin

### 5. Rollback (Geri Dönme)

**Sorun olursa:**
1. Vercel Dashboard → Deployments
2. Eski deployment'ı bulun
3. "..." → "Promote to Production"
4. Eski versiyona dönersiniz

### 6. Environment Variables Güncelleme

**Yeni environment variable eklemek:**
1. Vercel Dashboard → Settings → Environment Variables
2. "Add New" → Variable ekleyin
3. **Redeploy yapın** (Settings → Deployments → "Redeploy")

**Önemli:** Environment variable değişikliğinden sonra **mutlaka redeploy yapın!**

### 7. Production vs Preview

**Production:**
- `https://dekont-ruby.vercel.app`
- Canlı kullanıcılar burayı görür
- Dikkatli deploy edin

**Preview:**
- `https://dekont-ruby-git-*.vercel.app`
- Test için kullanılır
- Production'u etkilemez

### 8. Deployment Checklist

**Production'a deploy etmeden önce:**
- [ ] Local'de test ettiniz mi?
- [ ] Environment variables doğru mu?
- [ ] Database migration varsa çalıştırıldı mı?
- [ ] Breaking changes var mı? (Varsa dokümante edin)
- [ ] Preview deployment'da test ettiniz mi?

### 9. Sorun Giderme

#### Deploy başarısız olursa:
1. Vercel Dashboard → Deployments → Failed deployment
2. Logs'u kontrol edin
3. Hata mesajını okuyun
4. Düzeltin ve tekrar push yapın

#### Environment variable eksikse:
1. Vercel Dashboard → Settings → Environment Variables
2. Eksik variable'ı ekleyin
3. Redeploy yapın

#### Build hatası:
1. Local'de test edin: `npm run build`
2. Hata varsa düzeltin
3. Tekrar push yapın

### 10. Best Practices

**✅ YAPILMASI GEREKENLER:**
- Küçük, sık commit yapın
- Anlamlı commit mesajları yazın
- Preview deployment'da test edin
- Environment variables'ı dokümante edin
- Breaking changes'i önceden bildirin

**❌ YAPILMAMASI GEREKENLER:**
- Environment variables'ı kod içine yazmayın
- Büyük, tek seferde değişiklik yapmayın
- Test etmeden production'a deploy etmeyin
- `.env` dosyalarını commit etmeyin (`.gitignore`'da olmalı)

### 11. Git Workflow Önerisi

```bash
# Feature branch oluştur
git checkout -b feature/new-feature

# Değişiklikleri yap
# ...

# Commit yap
git add .
git commit -m "Add new feature"

# Push yap (preview deployment oluşturulur)
git push origin feature/new-feature

# Preview'da test et
# https://dekont-ruby-git-feature-new-feature.vercel.app

# Main branch'e merge et (production deployment)
git checkout main
git merge feature/new-feature
git push origin main
```

### 12. Acil Durum Planı

**Production'da sorun varsa:**
1. **Hemen rollback yapın:**
   - Vercel Dashboard → Deployments
   - Son çalışan deployment'ı bulun
   - "Promote to Production"

2. **Sorunu tespit edin:**
   - Logs'u kontrol edin
   - Environment variables'ı kontrol edin
   - Database'i kontrol edin

3. **Düzeltin:**
   - Sorunu düzeltin
   - Test edin
   - Tekrar deploy edin

### 13. Monitoring

**Vercel Dashboard'da izleyebilecekleriniz:**
- Deployment durumu
- Function logs
- Error rates
- Performance metrics

**Önerilen:**
- Her deployment sonrası logları kontrol edin
- Error rate'i izleyin
- Performance'ı takip edin

## 🎯 Özet

**GitHub'dan güncelleme yapmak:**
- ✅ Güvenli
- ✅ Otomatik
- ✅ Geri dönülebilir
- ✅ Test edilebilir

**Dikkat edilmesi gerekenler:**
- Environment variables Vercel'de saklanır (GitHub'a gitmez)
- Production'a deploy etmeden önce test edin
- Sorun olursa rollback yapabilirsiniz

**Sonuç:** GitHub'dan güncelleme yapmak tamamen güvenli ve önerilen yöntemdir! 🚀

