const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class SecurityManager {
    static async generateKeyPair() {
        return crypto.generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
    }

    static async encryptData(data, key) {
        try {
            const iv = crypto.randomBytes(16);
            
            const cipher = crypto.createCipheriv(
                'aes-256-gcm',
                Buffer.from(key, 'hex'),
                iv
            );
            
            let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            return {
                iv: iv.toString('hex'),
                data: encrypted,
                tag: authTag.toString('hex')
            };
        } catch (error) {
            console.error('Veri şifreleme hatası:', error);
            throw new Error('Veri şifrelenemedi');
        }
    }

    static async decryptData(encryptedData, key) {
        try {
            const { iv, data, tag } = encryptedData;
            
            const decipher = crypto.createDecipheriv(
                'aes-256-gcm',
                Buffer.from(key, 'hex'),
                Buffer.from(iv, 'hex')
            );
            
            decipher.setAuthTag(Buffer.from(tag, 'hex'));
            
            let decrypted = decipher.update(data, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('Veri çözme hatası:', error);
            throw new Error('Veri çözülemedi');
        }
    }

    static generateToken(payload, secret, expiresIn = '24h') {
        return jwt.sign(payload, secret, { expiresIn });
    }

    static verifyToken(token, secret) {
        try {
            return jwt.verify(token, secret);
        } catch (error) {
            console.error('Token doğrulama hatası:', error);
            throw error;
        }
    }

    static async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }

    static async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    static generateRandomString(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    static generateCsrfToken() {
        return this.generateRandomString(32);
    }

    static async encryptForStorage(data, userId) {
        const userKey = crypto.createHash('sha256')
            .update(process.env.JWT_SECRET + userId)
            .digest('hex');

        return this.encryptData(data, userKey);
    }

    static async decryptFromStorage(encryptedData, userId) {
        const userKey = crypto.createHash('sha256')
            .update(process.env.JWT_SECRET + userId)
            .digest('hex');

        return this.decryptData(encryptedData, userKey);
    }
}

module.exports = SecurityManager; 