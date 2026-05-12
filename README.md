# SellerReply Demo

SellerReply Demo, e-ticaret satıcılarının pazaryeri mağazalarını tek panelden yönetebilmesi için hazırlanmış bir demo uygulamadır. Proje; kullanıcı girişi, pazaryeri bağlantıları, sipariş/soru yönetimi, analitik ekranları ve AI destekli cevap üretme akışlarını içerir.

## Özellikler

- Kullanıcı kayıt ve giriş sistemi
- JWT tabanlı korumalı sayfalar
- Trendyol ve Hepsiburada pazaryeri bağlantıları
- Pazaryeri API bilgilerinin şifrelenerek saklanması
- Sipariş, müşteri sorusu ve mağaza bilgisi yönetimi
- AI destekli müşteri sorusu cevaplama altyapısı
- Dashboard, analitik, kullanıcılar, ayarlar ve pazaryerleri ekranları
- Rate limiting, CORS, Helmet ve temel güvenlik middleware'leri

## Teknolojiler

- Frontend: React, Vite, Tailwind CSS, Recharts, Framer Motion
- Backend: Node.js, Express, Sequelize
- Veritabanı: PostgreSQL
- Kimlik doğrulama: JSON Web Token
- AI entegrasyonu: OpenAI API

## Proje Yapısı

```text
SellerReply-Demo/
├── backend/        # Express API, modeller, rotalar ve servisler
├── frontend/       # React/Vite arayüzü
├── package.json    # Kök seviye çalıştırma script'i
└── README.md
```

## Kurulum

Önce repoyu klonlayın ve bağımlılıkları yükleyin:

```bash
git clone <repo-url>
cd SellerReply-Demo
npm install
cd backend && npm install
cd ../frontend && npm install
```

Backend için ortam değişkenlerini oluşturun:

```bash
cd backend
cp .env.example .env
```

`backend/.env` dosyasındaki veritabanı, JWT, şifreleme, SMTP ve OpenAI değerlerini kendi ortamınıza göre doldurun. Gerçek `.env` dosyası repoya eklenmemelidir.

Gerekli şifreleme anahtarlarını üretmek için:

```bash
cd backend
node scripts/generate-keys.js
```

PostgreSQL veritabanınızı oluşturduktan sonra backend çalışırken Sequelize tabloları senkronize eder.

## Çalıştırma

Kök dizinden frontend ve backend'i birlikte başlatmak için:

```bash
npm start
```

Ayrı ayrı çalıştırmak isterseniz:

```bash
cd backend
npm start
```

```bash
cd frontend
npm run dev
```

Varsayılan adresler:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api`
- Health check: `http://localhost:3000/health`

## Ortam Değişkenleri

Örnek değerler `backend/.env.example` içinde bulunur. Başlıca değişkenler:

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `ENCRYPTION_KEY`, `PUBLIC_ENCRYPTION_KEY`, `PRIVATE_ENCRYPTION_KEY`
- `FRONTEND_URL`, `CLIENT_URL`
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`
- `OPENAI_API_KEY`

## Güvenlik Notu

Bu repo public kullanıma hazırlanırken `.env`, `node_modules` ve işletim sistemi dosyaları git dışında bırakılmıştır. Üretim ortamında güçlü JWT/şifreleme anahtarları kullanılmalı ve API anahtarları düzenli olarak yenilenmelidir.

## Lisans

Bu proje demo amaçlı hazırlanmıştır.
