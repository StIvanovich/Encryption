import React, { useState } from "react";
import "./ADFGX.css";

const POLYBIUS_SQUARE = [
    ["A", "B", "C", "D", "E"],
    ["F", "G", "H", "I", "K"],
    ["L", "M", "N", "O", "P"],
    ["Q", "R", "S", "T", "U"],
    ["V", "W", "X", "Y", "Z"],
];

const ADFGX_CHARS = "ADFGX";

const cleanPlainText = (text) => {
    let cleaned = "";
    for (let i = 0; i < text.length; i++) {
        const c = text[i].toUpperCase();
        if (c >= "A" && c <= "Z") {
            cleaned += c === "J" ? "I" : c;
        }
    }
    return cleaned;
};

const cleanCipherText = (text) => {
    const validChars = new Set(["A", "D", "F", "G", "X"]);
    let cleaned = "";
    for (let i = 0; i < text.length; i++) {
        const c = text[i].toUpperCase();
        if (validChars.has(c)) {
            cleaned += c;
        }
    }
    return cleaned;
};

const processKeyword = (key) => {
    const seen = new Set();
    let unique = "";
    for (let i = 0; i < key.length; i++) {
        const c = key[i].toUpperCase();
        if (c >= "A" && c <= "Z" && !seen.has(c)) {
            seen.add(c);
            unique += c;
        }
    }
    return unique;
};

const findInSquare = (char) => {
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            if (POLYBIUS_SQUARE[row][col] === char) {
                return [row, col];
            }
        }
    }
    return null;
};

const encryptADFGX = (plaintext, keyword) => {
    const cleanPlain = cleanPlainText(plaintext);
    const cleanKey = processKeyword(keyword);
    if (!cleanPlain || !cleanKey) return "";

    let pairs = "";
    for (const char of cleanPlain) {
        const coords = findInSquare(char);
        if (coords) {
            const [row, col] = coords;
            pairs += ADFGX_CHARS[row] + ADFGX_CHARS[col];
        }
    }

    const keyLen = cleanKey.length;
    const columns = Array(keyLen)
        .fill()
        .map(() => []);

    for (let i = 0; i < pairs.length; i++) {
        columns[i % keyLen].push(pairs[i]);
    }

    const sortedIndices = [...Array(keyLen).keys()].sort((a, b) => cleanKey[a].localeCompare(cleanKey[b]));

    let result = "";
    for (const idx of sortedIndices) {
        result += columns[idx].join("");
    }

    return result;
};

const decryptADFGX = (ciphertext, keyword) => {
    const cleanCipher = cleanCipherText(ciphertext);
    const cleanKey = processKeyword(keyword);
    if (!cleanCipher || !cleanKey) return "";

    if (cleanCipher.length % 2 !== 0) {
        return "Ошибка: нечётное количество символов в шифртексте";
    }

    const keyLen = cleanKey.length;
    const total = cleanCipher.length;
    const baseLen = Math.floor(total / keyLen);
    const remainder = total % keyLen;

    const colLengths = Array(keyLen).fill(baseLen);
    for (let i = 0; i < remainder; i++) {
        colLengths[i]++;
    }

    const sortedIndices = [...Array(keyLen).keys()].sort((a, b) => cleanKey[a].localeCompare(cleanKey[b]));

    const columns = Array(keyLen)
        .fill()
        .map(() => []);
    let pos = 0;
    for (const idx of sortedIndices) {
        for (let i = 0; i < colLengths[idx]; i++) {
            columns[idx].push(cleanCipher[pos++]);
        }
    }

    let pairs = "";
    const maxRows = Math.max(...colLengths);
    for (let row = 0; row < maxRows; row++) {
        for (let col = 0; col < keyLen; col++) {
            if (row < columns[col].length) {
                pairs += columns[col][row];
            }
        }
    }

    let result = "";
    for (let i = 0; i < pairs.length; i += 2) {
        const row = ADFGX_CHARS.indexOf(pairs[i]);
        const col = ADFGX_CHARS.indexOf(pairs[i + 1]);
        if (row === -1 || col === -1) continue;
        result += POLYBIUS_SQUARE[row][col];
    }

    return result;
};

const ADFGX = () => {
    const [plaintext, setPlaintext] = useState("");
    const [ciphertext, setCiphertext] = useState("");
    const [keyword, setKeyword] = useState("");
    const [mode, setMode] = useState("encrypt");

    const handleAction = () => {
        if (mode === "encrypt") {
            const result = encryptADFGX(plaintext, keyword);
            setCiphertext(result);
        } else {
            const result = decryptADFGX(ciphertext, keyword);
            setPlaintext(result);
        }
    };

    return (
        <div className="adfgx-container">
            <h2>Шифр ADFGX</h2>

            <div className="input-group">
                <label>Ключевое слово:</label>
                <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Например: SORRY" />
            </div>

            <div className="mode-toggle">
                <label>
                    <input type="radio" checked={mode === "encrypt"} onChange={() => setMode("encrypt")} />
                    Зашифровать
                </label>
                <label>
                    <input type="radio" checked={mode === "decrypt"} onChange={() => setMode("decrypt")} />
                    Расшифровать
                </label>
            </div>

            <div className="text-input">
                {mode === "encrypt" ? (
                    <div>
                        <label>Открытый текст:</label>
                        <textarea value={plaintext} onChange={(e) => setPlaintext(e.target.value)} placeholder="Введите текст (только A–Z)" rows="4" />
                    </div>
                ) : (
                    <div>
                        <label>Шифртекст:</label>
                        <textarea value={ciphertext} onChange={(e) => setCiphertext(e.target.value)} placeholder="Введите шифртекст (только A, D, F, G, X)" rows="4" />
                    </div>
                )}
            </div>

            <button onClick={handleAction} className="action-button">
                {mode === "encrypt" ? "Зашифровать" : "Расшифровать"}
            </button>

            <div className="result">
                {mode === "encrypt" && ciphertext && (
                    <>
                        <h3>Результат:</h3>
                        <div className="result-box">{ciphertext}</div>
                    </>
                )}
                {mode === "decrypt" && plaintext && (
                    <>
                        <h3>Результат:</h3>
                        <div className="result-box">{plaintext}</div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ADFGX;
