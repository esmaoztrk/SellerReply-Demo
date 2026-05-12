class SecurityHelper {
    static async getPublicKey() {
        const response = await fetch('/api/security/public-key');
        console.log(response.json());
        const { publicKey } = await response.json();
        console.log(publicKey);
        return publicKey;
    }

    static async encryptData(data) {
        try {
            // Public key al
            const publicKey = await this.getPublicKey();
            console.log(publicKey);
            // String'e çevir
            const jsonString = JSON.stringify(data);
            
            // TextEncoder ile UTF-8'e çevir
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(jsonString);

            // Rastgele IV oluştur
            const iv = crypto.getRandomValues(new Uint8Array(12));

            // Key'i import et
            const key = await crypto.subtle.importKey(
                'raw',
                new Uint8Array(Buffer.from(publicKey, 'hex')),
                { name: 'AES-GCM' },
                false,
                ['encrypt']
            );

            // Şifrele
            const encrypted = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                dataBuffer
            );

            return {
                iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
                data: Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('')
            };
        } catch (error) {
            console.error('Şifreleme hatası:', error);
            throw new Error('Veriler şifrelenemedi');
        }
    }
}

export default SecurityHelper; 