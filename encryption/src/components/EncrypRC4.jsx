import { useState } from "react";

const DEFAULT_NONCE_LENGTH = 16;

class EncrypRC4 {
    static generateNonce(length = DEFAULT_NONCE_LENGTH) {
        return crypto.getRandomValues(new Uint8Array(length));
    }

    static bytesToHex(bytes) {
        return Array.from(bytes)
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("");
    }

    static hexToBytes(hex) {
        if (hex.length % 2 !== 0) {
            throw new Error("Ошибка: нечётное количество символов");
        }
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
        }
        return bytes;
    }

    static async deriveKey(originalKey, nonce) {
        const encoder = new TextEncoder();
        const keyBytes = encoder.encode(originalKey);
        const combined = new Uint8Array(keyBytes.length + nonce.length);
        combined.set(keyBytes);
        combined.set(nonce, keyBytes.length);
        const hash = await crypto.subtle.digest("SHA-256", combined);
        return new Uint8Array(hash);
    }

    static async encrypt(plaintext, key) {
        const nonce = this.generateNonce();
        const effectiveKey = await this.deriveKey(key, nonce);
        const plaintextBytes = new TextEncoder().encode(plaintext);

        const sBox = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
            sBox[i] = i;
        }

        let j = 0;
        for (let i = 0; i < 256; i++) {
            j = (j + sBox[i] + effectiveKey[i % effectiveKey.length]) % 256;
            [sBox[i], sBox[j]] = [sBox[j], sBox[i]];
        }

        const ciphertext = new Uint8Array(plaintextBytes.length);
        let i = 0;
        j = 0;
        for (let k = 0; k < plaintextBytes.length; k++) {
            i = (i + 1) % 256;
            j = (j + sBox[i]) % 256;
            [sBox[i], sBox[j]] = [sBox[j], sBox[i]];
            const keystreamByte = sBox[(sBox[i] + sBox[j]) % 256];
            ciphertext[k] = plaintextBytes[k] ^ keystreamByte;
        }

        const nonceHex = this.bytesToHex(nonce);
        const ciphertextHex = this.bytesToHex(ciphertext);
        return `${nonceHex}:${ciphertextHex}`;
    }

    static async decrypt(encryptedData, key) {
        const [nonceHex, ciphertextHex] = encryptedData.split(":");
        if (!nonceHex || !ciphertextHex) {
            throw new Error("Формат должен быть: (nonce:hex)");
        }

        const nonce = this.hexToBytes(nonceHex);
        const ciphertext = this.hexToBytes(ciphertextHex);
        const effectiveKey = await this.deriveKey(key, nonce);

        const sBox = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
            sBox[i] = i;
        }

        let j = 0;
        for (let i = 0; i < 256; i++) {
            j = (j + sBox[i] + effectiveKey[i % effectiveKey.length]) % 256;
            [sBox[i], sBox[j]] = [sBox[j], sBox[i]];
        }

        const plaintextBytes = new Uint8Array(ciphertext.length);
        let i = 0;
        j = 0;
        for (let k = 0; k < ciphertext.length; k++) {
            i = (i + 1) % 256;
            j = (j + sBox[i]) % 256;
            [sBox[i], sBox[j]] = [sBox[j], sBox[i]];
            const keystreamByte = sBox[(sBox[i] + sBox[j]) % 256];
            plaintextBytes[k] = ciphertext[k] ^ keystreamByte;
        }

        return new TextDecoder().decode(plaintextBytes);
    }
}

const Check = () => {
    const [inputText, setInputText] = useState("");
    const [outputText, setOutputText] = useState("");
    const [key, setKey] = useState("");

    const handleEncrypt = async () => {
        if (!inputText.trim() || !key.trim()) {
            setOutputText("");
            return;
        }
        try {
            const encrypted = await EncrypRC4.encrypt(inputText, key);
            setOutputText(encrypted);
        } catch {
            setOutputText("Ошибка шифрования");
        }
    };

    const handleDecrypt = async () => {
        if (!inputText.trim() || !key.trim()) {
            setOutputText("");
            return;
        }
        try {
            const decrypted = await EncrypRC4.decrypt(inputText, key);
            setOutputText(decrypted);
        } catch {
            setOutputText("Ошибка: проверьте формат и ключ");
        }
    };

    return (
        <div className="check">
            <h1>Поточный шифр RC4</h1>

            <textarea
                className="text-input"
                placeholder="Введите то, что хотите зашифровать или расшифровать"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                aria-label="Входные данные"
            />

            <input type="text" className="text-input" placeholder="Ваш ключ" value={key} onChange={(e) => setKey(e.target.value)} aria-label="Ключ" />

            <textarea className="text-output" placeholder="Результат шифрования" value={outputText} readOnly aria-label="Результат" />

            <div className="button-group">
                <button className="action-button" onClick={handleEncrypt}>
                    Зашифровать
                </button>
                <button className="action-button" onClick={handleDecrypt}>
                    Расшифровать
                </button>
            </div>
        </div>
    );
};

export default Check;
