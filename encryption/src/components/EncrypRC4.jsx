import React, { useState } from "react";

export default function RC4() {
    function toBytes(str) {
        const bytes = [];
        for (let i = 0; i < str.length; i++) {
            let charCode = str.charCodeAt(i);
            if (charCode < 0x80) {
                bytes.push(charCode);
            } else if (charCode < 0x800) {
                bytes.push(0xc0 | (charCode >> 6));
                bytes.push(0x80 | (charCode & 0x3f));
            } else if (charCode < 0xd800 || charCode >= 0xe000) {
                bytes.push(0xe0 | (charCode >> 12));
                bytes.push(0x80 | ((charCode >> 6) & 0x3f));
                bytes.push(0x80 | (charCode & 0x3f));
            } else {
                i++;
                const low = str.charCodeAt(i);
                const codePoint = 0x10000 + ((charCode & 0x3ff) << 10) + (low & 0x3ff);
                bytes.push(0xf0 | (codePoint >> 18));
                bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
                bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
                bytes.push(0x80 | (codePoint & 0x3f));
            }
        }
        return bytes;
    }

    function bytesToUtf8(bytes) {
        let str = "";
        let i = 0;
        while (i < bytes.length) {
            const b1 = bytes[i++];
            if (b1 < 0x80) {
                str += String.fromCharCode(b1);
            } else if (b1 < 0xe0) {
                str += String.fromCharCode(((b1 & 0x1f) << 6) | (bytes[i++] & 0x3f));
            } else if (b1 < 0xf0) {
                str += String.fromCharCode(((b1 & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f));
            } else {
                const codePoint = ((b1 & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
                if (codePoint < 0x10000) {
                    str += String.fromCharCode(codePoint);
                } else {
                    str += String.fromCharCode(0xd800 + ((codePoint - 0x10000) >> 10), 0xdc00 + ((codePoint - 0x10000) & 0x3ff));
                }
            }
        }
        return str;
    }

    function bytesToHex(bytes) {
        return bytes.map((b) => (b < 16 ? "0" : "") + b.toString(16)).join("");
    }

    function hexToBytes(hex) {
        const bytes = [];
        for (let i = 0; i < hex.length; i += 2) {
            bytes.push(parseInt(hex.substr(i, 2), 16));
        }
        return bytes;
    }

    function rc4(keyBytes, dataBytes) {
        const S = Array.from({ length: 256 }, (_, i) => i);
        let j = 0;
        for (let i = 0; i < 256; i++) {
            j = (j + S[i] + keyBytes[i % keyBytes.length]) % 256;
            [S[i], S[j]] = [S[j], S[i]];
        }

        const output = [];
        let i = 0;
        j = 0;
        for (let k = 0; k < dataBytes.length; k++) {
            i = (i + 1) % 256;
            j = (j + S[i]) % 256;
            [S[i], S[j]] = [S[j], S[i]];
            const keystream = S[(S[i] + S[j]) % 256];
            output.push(dataBytes[k] ^ keystream);
        }
        return output;
    }

    const [key, setKey] = useState("Sorry");
    const [inputText, setInputText] = useState("Please");
    const [hexCiphertext, setHexCiphertext] = useState("");
    const [outputText, setOutputText] = useState("");
    const [error, setError] = useState("");

    const clearError = () => {
        if (error) setError("");
    };

    const handleEncrypt = () => {
        clearError();
        try {
            if (!key.trim()) {
                setError("Ключ не может быть пустым.");
                return;
            }
            const keyBytes = toBytes(key);
            const dataBytes = toBytes(inputText);
            const encryptedBytes = rc4(keyBytes, dataBytes);
            setHexCiphertext(bytesToHex(encryptedBytes));
            setOutputText("");
        } catch (err) {
            setError("Ошибка при шифровании: " + (err.message || "неизвестная ошибка"));
        }
    };

    const handleDecrypt = () => {
        clearError();
        try {
            if (!key.trim()) {
                setError("Ключ не может быть пустым.");
                return;
            }
            if (!hexCiphertext) {
                setError("Нет данных для расшифровки. Сначала зашифруйте текст.");
                return;
            }
            const keyBytes = toBytes(key);
            const dataBytes = hexToBytes(hexCiphertext);
            const decryptedBytes = rc4(keyBytes, dataBytes);
            const result = bytesToUtf8(decryptedBytes);
            setOutputText(result);
        } catch (err) {
            setError("Ошибка при расшифровке: " + (err.message || "некорректные данные"));
        }
    };

    return (
        <div className="rc4-container">
            <div className="rc4-input-group">
                <label>Введите ваш ключ:</label>
                <input
                    type="text"
                    value={key}
                    onChange={(e) => {
                        setKey(e.target.value);
                        clearError();
                    }}
                />
            </div>

            <div className="rc4-input-group">
                <label>Текст для шифрования:</label>
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => {
                        setInputText(e.target.value);
                        clearError();
                    }}
                />
            </div>

            <div className="rc4-buttons">
                <button onClick={handleEncrypt} className="rc4-btn encrypt-btn">
                    Зашифровать
                </button>
                <button onClick={handleDecrypt} className="rc4-btn decrypt-btn">
                    Расшифровать
                </button>
            </div>

            {error && <div className="rc4-error">{error}</div>}

            {hexCiphertext && (
                <div className="rc4-result">
                    <label>Шифротекст:</label>
                    <div className="rc4-hex">{hexCiphertext}</div>
                </div>
            )}

            {outputText && (
                <div className="rc4-result">
                    <label>Расшифрованный текст:</label>
                    <div className="rc4-output">{outputText}</div>
                </div>
            )}
        </div>
    );
}
