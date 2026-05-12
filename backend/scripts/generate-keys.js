const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Daha güvenli anahtar üretimi
function generateSecureKeys() {
  // 32 byte (256 bit) rastgele anahtarlar oluştur
  const publicKey = crypto.randomBytes(32).toString('hex');
  const privateKey = crypto.randomBytes(32).toString('hex');
  const jwtSecret = crypto.randomBytes(64).toString('hex');
  
  // Anahtarları konsola yazdır
  console.log('PUBLIC_ENCRYPTION_KEY=' + publicKey);
  console.log('PRIVATE_ENCRYPTION_KEY=' + privateKey);
  console.log('JWT_SECRET=' + jwtSecret);
  
  // .env.example dosyasına ekle
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  if (fs.existsSync(envExamplePath)) {
    let envContent = fs.readFileSync(envExamplePath, 'utf8');
    
    // Anahtar değişkenlerini ekle veya güncelle
    const envVars = {
      'PUBLIC_ENCRYPTION_KEY': 'your_public_key_here',
      'PRIVATE_ENCRYPTION_KEY': 'your_private_key_here',
      'JWT_SECRET': 'your_jwt_secret_here'
    };
    
    for (const [key, value] of Object.entries(envVars)) {
      if (!envContent.includes(key + '=')) {
        envContent += `\n${key}=${value}`;
      }
    }
    
    fs.writeFileSync(envExamplePath, envContent);
    console.log('.env.example dosyası güncellendi');
  }
  
  return { publicKey, privateKey, jwtSecret };
}

// RSA anahtar çifti oluştur
function generateRsaKeyPair() {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    }, (err, publicKey, privateKey) => {
      if (err) {
        console.error('RSA anahtar çifti oluşturma hatası:', err);
        return reject(err);
      }
      
      // Anahtarları dosyalara kaydet
      const keysDir = path.join(__dirname, '..', 'keys');
      if (!fs.existsSync(keysDir)) {
        fs.mkdirSync(keysDir, { recursive: true });
      }
      
      fs.writeFileSync(path.join(keysDir, 'public.pem'), publicKey);
      fs.writeFileSync(path.join(keysDir, 'private.pem'), privateKey);
      
      console.log('RSA anahtar çifti oluşturuldu ve keys/ dizinine kaydedildi');
      resolve({ publicKey, privateKey });
    });
  });
}

// Ana fonksiyon
async function main() {
  try {
    // Simetrik anahtarlar oluştur
    const symmetricKeys = generateSecureKeys();
    
    // RSA anahtar çifti oluştur
    await generateRsaKeyPair();
    
    console.log('\nAnahtarlar başarıyla oluşturuldu. Bu anahtarları .env dosyanıza ekleyin.');
  } catch (error) {
    console.error('Anahtar oluşturma hatası:', error);
    process.exit(1);
  }
}

main(); 