import React, { useState } from "react";

const WORD_SIZE_BITS = 32;
const ROUND_COUNT = 12;
const KEY_SIZE_BYTES = 16;
const KEY_WORD_COUNT = Math.ceil((KEY_SIZE_BYTES * 8) / WORD_SIZE_BITS);
const SUBKEY_ARRAY_SIZE = 2 * (ROUND_COUNT + 1);

const MAGIC_CONSTANT_P = 0xb7e15163;
const MAGIC_CONSTANT_Q = 0x9e3779b9;

function rotateLeft(value, shift) {
    return ((value << (shift & 31)) | (value >>> (32 - (shift & 31)))) >>> 0;
}

function rotateRight(value, shift) {
    return ((value >>> (shift & 31)) | (value << (32 - (shift & 31)))) >>> 0;
}

function expandKey(keyBytes) {
    const keyBuffer = new Uint8Array(KEY_SIZE_BYTES);
    keyBuffer.set(keyBytes.slice(0, KEY_SIZE_BYTES));
    if (keyBytes.length < KEY_SIZE_BYTES) {
        keyBuffer.fill(0, keyBytes.length);
    }

    const keyWords = new Uint32Array(KEY_WORD_COUNT);
    for (let i = 0; i < KEY_SIZE_BYTES; i++) {
        keyWords[Math.floor(i / 4)] |= keyBuffer[i] << (8 * (i % 4));
    }

    const subkeys = new Uint32Array(SUBKEY_ARRAY_SIZE);
    subkeys[0] = MAGIC_CONSTANT_P;
    for (let i = 1; i < SUBKEY_ARRAY_SIZE; i++) {
        subkeys[i] = (subkeys[i - 1] + MAGIC_CONSTANT_Q) >>> 0;
    }

    let i = 0;
    let j = 0;
    let a = 0;
    let b = 0;
    const iterations = 3 * Math.max(SUBKEY_ARRAY_SIZE, KEY_WORD_COUNT);

    for (let k = 0; k < iterations; k++) {
        a = subkeys[i] = rotateLeft((subkeys[i] + a + b) >>> 0, 3);
        b = keyWords[j] = rotateLeft((keyWords[j] + a + b) >>> 0, (a + b) & 31);
        i = (i + 1) % SUBKEY_ARRAY_SIZE;
        j = (j + 1) % KEY_WORD_COUNT;
    }

    return subkeys;
}

function encryptBlock(subkeys, left, right) {
    left = (left + subkeys[0]) >>> 0;
    right = (right + subkeys[1]) >>> 0;

    for (let i = 1; i <= ROUND_COUNT; i++) {
        left = (rotateLeft((left ^ right) >>> 0, right) + subkeys[2 * i]) >>> 0;
        right = (rotateLeft((right ^ left) >>> 0, left) + subkeys[2 * i + 1]) >>> 0;
    }

    return [left, right];
}

function decryptBlock(subkeys, left, right) {
    for (let i = ROUND_COUNT; i >= 1; i--) {
        right = rotateRight((right - subkeys[2 * i + 1]) >>> 0, left) ^ left;
        left = rotateRight((left - subkeys[2 * i]) >>> 0, right) ^ right;
    }

    right = (right - subkeys[1]) >>> 0;
    left = (left - subkeys[0]) >>> 0;

    return [left, right];
}

function textToBytes(text) {
    return new TextEncoder().encode(text);
}

function bytesToHex(bytes) {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
}

function encryptText(plaintext, keyBytes) {
    const subkeys = expandKey(keyBytes);
    const data = textToBytes(plaintext);
    const padding = (8 - (data.length % 8)) % 8;
    const padded = new Uint8Array(data.length + padding);
    padded.set(data);

    const result = new Uint8Array(padded.length);
    for (let offset = 0; offset < padded.length; offset += 8) {
        const wordA = (padded[offset] | (padded[offset + 1] << 8) | (padded[offset + 2] << 16) | (padded[offset + 3] << 24)) >>> 0;
        const wordB = (padded[offset + 4] | (padded[offset + 5] << 8) | (padded[offset + 6] << 16) | (padded[offset + 7] << 24)) >>> 0;

        const [encryptedA, encryptedB] = encryptBlock(subkeys, wordA, wordB);

        result[offset] = encryptedA & 0xff;
        result[offset + 1] = (encryptedA >>> 8) & 0xff;
        result[offset + 2] = (encryptedA >>> 16) & 0xff;
        result[offset + 3] = (encryptedA >>> 24) & 0xff;
        result[offset + 4] = encryptedB & 0xff;
        result[offset + 5] = (encryptedB >>> 8) & 0xff;
        result[offset + 6] = (encryptedB >>> 16) & 0xff;
        result[offset + 7] = (encryptedB >>> 24) & 0xff;
    }

    return bytesToHex(result);
}

function decryptText(hexCiphertext, keyBytes) {
    const subkeys = expandKey(keyBytes);
    const data = hexToBytes(hexCiphertext);
    if (data.length % 8 !== 0) throw new Error("Ты по-моему, что-то не то ввёл");

    const result = new Uint8Array(data.length);
    for (let offset = 0; offset < data.length; offset += 8) {
        const wordA = (data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24)) >>> 0;
        const wordB = (data[offset + 4] | (data[offset + 5] << 8) | (data[offset + 6] << 16) | (data[offset + 7] << 24)) >>> 0;

        const [decryptedA, decryptedB] = decryptBlock(subkeys, wordA, wordB);

        result[offset] = decryptedA & 0xff;
        result[offset + 1] = (decryptedA >>> 8) & 0xff;
        result[offset + 2] = (decryptedA >>> 16) & 0xff;
        result[offset + 3] = (decryptedA >>> 24) & 0xff;
        result[offset + 4] = decryptedB & 0xff;
        result[offset + 5] = (decryptedB >>> 8) & 0xff;
        result[offset + 6] = (decryptedB >>> 16) & 0xff;
        result[offset + 7] = (decryptedB >>> 24) & 0xff;
    }

    let trimmedLength = result.length;
    while (trimmedLength > 0 && result[trimmedLength - 1] === 0) {
        trimmedLength--;
    }

    return new TextDecoder().decode(result.slice(0, trimmedLength));
}

export default function RC5Cipher() {
    const [inputText, setInputText] = useState("");
    const [secretKey, setSecretKey] = useState("Sorry");
    const [outputText, setOutputText] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleEncrypt = () => {
        try {
            setErrorMessage("");
            const keyBytes = textToBytes(secretKey);
            const ciphertext = encryptText(inputText, keyBytes);
            setOutputText(ciphertext);
        } catch (error) {
            setErrorMessage(`Ошибка при шифровании: ${error.message}`);
        }
    };

    const handleDecrypt = () => {
        try {
            setErrorMessage("");
            const keyBytes = textToBytes(secretKey);
            const plaintext = decryptText(inputText, keyBytes);
            setOutputText(plaintext);
        } catch (error) {
            setErrorMessage(`Ошибка при расшифровке: ${error.message}`);
        }
    };

    return (
        <div className="rc5-container">
            <h2>Шифр RC5</h2>

            <div className="rc5-input-group">
                <label>Ваш ключ:</label>
                <input type="text" value={secretKey} onChange={(e) => setSecretKey(e.target.value.slice(0, 16))} className="rc5-key-input" />
            </div>

            <div className="rc5-input-group">
                <label>Ввод:</label>
                <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} rows="4" className="rc5-textarea" />
            </div>

            <div className="rc5-button-group">
                <button onClick={handleEncrypt} className="rc5-button rc5-button--encrypt">
                    Зашифровать
                </button>
                <button onClick={handleDecrypt} className="rc5-button rc5-button--decrypt">
                    Расшифровать
                </button>
            </div>

            {errorMessage && <p className="rc5-error">{errorMessage}</p>}

            <div className="rc5-input-group">
                <label>Результат:</label>
                <textarea value={outputText} readOnly rows="4" className="rc5-textarea" />
            </div>
        </div>
    );
}
