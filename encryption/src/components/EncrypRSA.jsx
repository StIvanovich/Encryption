import React, { useState, useEffect } from "react";

const EncrypRSA = () => {
    const [plainText, setPlainText] = useState("");
    const [encryptedText, setEncryptedText] = useState("");
    const [decryptedText, setDecryptedText] = useState("");
    const [keyPair, setKeyPair] = useState(null);
    const [isGenerating, setIsGenerating] = useState(true);

    useEffect(() => {
        const generateKeyPair = async () => {
            try {
                const keyPair = await window.crypto.subtle.generateKey(
                    {
                        name: "RSA-OAEP",
                        modulusLength: 2048,
                        publicExponent: new Uint8Array([1, 0, 1]),
                        hash: "SHA-256",
                    },
                    true,
                    ["encrypt", "decrypt"]
                );
                setKeyPair(keyPair);
            } catch (e) {
                console.error(e);
            } finally {
                setIsGenerating(false);
            }
        };

        if (window.crypto?.subtle) {
            generateKeyPair();
        } else {
            setIsGenerating(false);
        }
    }, []);

    const arrayBufferToBase64 = (buffer) => {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    };

    const base64ToArrayBuffer = (str) => {
        const binary = atob(str);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    };

    const encrypt = async () => {
        if (!keyPair || !plainText.trim()) {
            return;
        }

        try {
            const encoder = new TextEncoder();
            const encoded = encoder.encode(plainText);

            if (encoded.length > 190) {
                return;
            }

            const encrypted = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, keyPair.publicKey, encoded);

            setEncryptedText(arrayBufferToBase64(encrypted));
            setDecryptedText("");
        } catch (err) {
            console.error("Ошибка шифрования RSA:", err);
        }
    };

    const decrypt = async () => {
        if (!keyPair || !encryptedText.trim()) {
            return;
        }

        try {
            const encryptedBuffer = base64ToArrayBuffer(encryptedText);
            const decrypted = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, keyPair.privateKey, encryptedBuffer);

            const result = new TextDecoder().decode(decrypted);
            setDecryptedText(result);
        } catch (err) {
            console.error("Ошибка расшифровки RSA:", err);
        }
    };

    if (isGenerating) {
        return;
    }

    return (
        <div className="rsa-container">
            <h2>Шифрование RSA</h2>

            <div>
                <h3>Исходный текст:</h3>
                <textarea className="rsa-textarea" rows="3" value={plainText} onChange={(e) => setPlainText(e.target.value)} placeholder="Введите текст для шифрования..." />
                <br />
                <button className="rsa-button encrypt-button" onClick={encrypt}>
                    Зашифровать
                </button>
            </div>

            <div>
                <h3>Зашифрованный текст:</h3>
                <textarea className="rsa-textarea" rows="4" value={encryptedText} readOnly placeholder="Результат" />
                <br />
                <button className="rsa-button decrypt-button" onClick={decrypt}>
                    Расшифровать
                </button>
            </div>

            <div>
                <h3>Расшифрованный текст:</h3>
                <textarea className="rsa-textarea" rows="3" value={decryptedText} readOnly placeholder="Результат" />
            </div>
        </div>
    );
};

export default EncrypRSA;
