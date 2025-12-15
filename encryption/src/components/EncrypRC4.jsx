import { useState } from "react";

const DEFAULT_LENGTH = 16;

class EncrypRC4 {
    static generateNonce(length = DEFAULT_LENGTH) {
        return crypto.getRandomValues(new Uint8Array(length));
    }

    static bytesToHex(bytes) {
        return Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, "0"))
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
        const keyData = encoder.encode(originalKey);
        const combined = new Uint8Array(keyData.length + nonce.length);
        combined.set(keyData);
        combined.set(nonce, keyData.length);
        const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
        return new Uint8Array(hashBuffer);
    }

    static async encrypt(text, key) {
        const nonce = this.generateNonce();
        const effectiveKey = await this.deriveKey(key, nonce);
        const textBytes = new TextEncoder().encode(text);

        const s = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
            s[i] = i;
        }

        let j = 0;
        for (let i = 0; i < 256; i++) {
            j = (j + s[i] + effectiveKey[i % effectiveKey.length]) % 256;
            [s[i], s[j]] = [s[j], s[i]];
        }

        const result = new Uint8Array(textBytes.length);
        let i = 0;
        j = 0;
        for (let k = 0; k < textBytes.length; k++) {
            i = (i + 1) % 256;
            j = (j + s[i]) % 256;
            [s[i], s[j]] = [s[j], s[i]];
            const randomByte = s[(s[i] + s[j]) % 256];
            result[k] = textBytes[k] ^ randomByte;
        }

        const nonceHex = this.bytesToHex(nonce);
        const encryptedHex = this.bytesToHex(result);
        return `${nonceHex}:${encryptedHex}`;
    }

    static async decrypt(encryptedWithNonce, key) {
        const parts = encryptedWithNonce.split(":");
        if (parts.length !== 2) {
            throw new Error("Формат должен быть: (nonce:hex)");
        }
        const [nonceHex, encryptedHex] = parts;
        const nonce = this.hexToBytes(nonceHex);
        const encryptedBytes = this.hexToBytes(encryptedHex);
        const effectiveKey = await this.deriveKey(key, nonce);

        const s = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
            s[i] = i;
        }

        let j = 0;
        for (let i = 0; i < 256; i++) {
            j = (j + s[i] + effectiveKey[i % effectiveKey.length]) % 256;
            [s[i], s[j]] = [s[j], s[i]];
        }

        const result = new Uint8Array(encryptedBytes.length);
        let i = 0;
        j = 0;
        for (let k = 0; k < encryptedBytes.length; k++) {
            i = (i + 1) % 256;
            j = (j + s[i]) % 256;
            [s[i], s[j]] = [s[j], s[i]];
            const randomByte = s[(s[i] + s[j]) % 256];
            result[k] = encryptedBytes[k] ^ randomByte;
        }

        return new TextDecoder().decode(result);
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
            const result = await EncrypRC4.encrypt(inputText, key);
            setOutputText(result);
        } catch (err) {
            setOutputText("Ошибка шифрования");
        }
    };

    const handleDecrypt = async () => {
        if (!inputText.trim() || !key.trim()) {
            setOutputText("");
            return;
        }
        try {
            console.log(inputText);
            console.log(key);

            const result = await EncrypRC4.decrypt(inputText, key);
            console.log(result);
            setOutputText(result);
        } catch (err) {
            setOutputText("Ошибка: проверьте формат и ключ");
        }
    };

    return (
        <div className="check">
            <h1>Поточный шифр RC4</h1>

            <textarea
                className="text-input"
                placeholder="Введите то, что хотитете зашифровать или расшифровать"
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
