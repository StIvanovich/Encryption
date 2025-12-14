import React from "react";

class EncrypGOST extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            inputText: "",
            encryptionKey: "",
            outputText: "",
        };

        this.gostSBoxes = [
            [4, 10, 9, 2, 13, 8, 0, 14, 6, 11, 1, 12, 7, 15, 5, 3],
            [14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6],
            [5, 8, 1, 13, 10, 3, 4, 2, 14, 15, 12, 7, 6, 0, 9, 11],
            [7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15],
            [6, 12, 7, 1, 5, 15, 13, 8, 4, 10, 9, 14, 0, 3, 11, 2],
            [4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1],
            [13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6],
            [1, 4, 6, 8, 11, 3, 15, 0, 9, 12, 13, 7, 10, 14, 5, 2],
        ];

        this.textEncoder = new TextEncoder();
        this.textDecoder = new TextDecoder();
    }

    handleInputTextChange = (event) => {
        this.setState({ inputText: event.target.value });
    };

    handleKeyChange = (event) => {
        this.setState({ encryptionKey: event.target.value });
    };

    convertStringToBytes = (text) => {
        return this.textEncoder.encode(text);
    };

    convertBytesToString = (bytes) => {
        return this.textDecoder.decode(bytes);
    };

    normalizeKeyToGost256Bit = (key) => {
        const keyBytes = this.convertStringToBytes(key);
        const extended = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
            extended[i] = keyBytes.length > 0 ? keyBytes[i % keyBytes.length] : 0;
        }

        const words = new Uint32Array(8);
        for (let i = 0; i < 8; i++) {
            words[i] = extended[i * 4] | (extended[i * 4 + 1] << 8) | (extended[i * 4 + 2] << 16) | (extended[i * 4 + 3] << 24);
        }
        return words;
    };

    addGostPadding = (data) => {
        const pad = 8 - (data.length % 8);
        const padded = new Uint8Array(data.length + pad);
        padded.set(data);
        padded.fill(pad, data.length);
        return padded;
    };

    removeGostPadding = (data) => {
        const pad = data[data.length - 1];
        if (pad < 1 || pad > 8) return data;
        return data.slice(0, -pad);
    };

    bytesToWords = (block) => {
        const w1 = (block[0] | (block[1] << 8) | (block[2] << 16) | (block[3] << 24)) >>> 0;
        const w2 = (block[4] | (block[5] << 8) | (block[6] << 16) | (block[7] << 24)) >>> 0;
        return [w1, w2];
    };

    wordsToBytes = (w1, w2) => {
        return new Uint8Array([w1 & 0xff, (w1 >> 8) & 0xff, (w1 >> 16) & 0xff, (w1 >> 24) & 0xff, w2 & 0xff, (w2 >> 8) & 0xff, (w2 >> 16) & 0xff, (w2 >> 24) & 0xff]);
    };

    gostFeistel = (value, roundKey) => {
        let x = value;
        for (let i = 0; i < 4; i++) {
            let sum = (x + roundKey) >>> 0;
            let y = 0;
            for (let j = 0; j < 8; j++) {
                const nibble = (sum >> (4 * j)) & 0xf;
                const sub = this.gostSBoxes[j][nibble];
                y |= sub << (4 * j);
            }
            x = ((y << 11) | (y >>> 21)) >>> 0;
        }
        return x;
    };

    encryptBlock = (left, right, keyWords) => {
        for (let r = 0; r < 32; r++) {
            const temp = right;
            right = (left ^ this.gostFeistel(right, keyWords[r % 8])) >>> 0;
            left = temp;
        }
        return [right, left];
    };

    decryptBlock = (left, right, keyWords) => {
        for (let r = 31; r >= 0; r--) {
            const temp = right;
            right = (left ^ this.gostFeistel(right, keyWords[r % 8])) >>> 0;
            left = temp;
        }
        return [right, left];
    };

    performGostEncryption = (text, key) => {
        if (!key.trim()) return "[Ошибка: ключ не задан]";
        try {
            const keyWords = this.normalizeKeyToGost256Bit(key);
            const plainBytes = this.addGostPadding(this.convertStringToBytes(text));
            const out = new Uint8Array(plainBytes.length);

            for (let i = 0; i < plainBytes.length; i += 8) {
                const block = plainBytes.slice(i, i + 8);
                const [l, r] = this.bytesToWords(block);
                const [el, er] = this.encryptBlock(l, r, keyWords);
                const encryptedBlock = this.wordsToBytes(el, er);
                out.set(encryptedBlock, i);
            }

            return btoa(String.fromCharCode(...out));
        } catch (e) {
            return "[Ошибка шифрования]";
        }
    };

    performGostDecryption = (base64, key) => {
        if (!key.trim()) return "[Ошибка: ключ не задан]";
        try {
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.split("").map((c) => c.charCodeAt(0)));
            if (bytes.length % 8 !== 0) {
                return "[Ошибка: длина шифротекста не кратна 8 байтам]";
            }

            const keyWords = this.normalizeKeyToGost256Bit(key);
            const out = new Uint8Array(bytes.length);

            for (let i = 0; i < bytes.length; i += 8) {
                const block = bytes.slice(i, i + 8);
                const [l, r] = this.bytesToWords(block);
                const [dl, dr] = this.decryptBlock(l, r, keyWords);
                const decryptedBlock = this.wordsToBytes(dl, dr);
                out.set(decryptedBlock, i);
            }

            const unpadded = this.removeGostPadding(out);
            return this.convertBytesToString(unpadded);
        } catch (e) {
            return "[Ошибка расшифровки: проверьте ключ и шифротекст]";
        }
    };

    handleEncryptClick = () => {
        const { inputText, encryptionKey } = this.state;
        const result = this.performGostEncryption(inputText, encryptionKey);
        this.setState({ outputText: result });
    };

    handleDecryptClick = () => {
        const { inputText, encryptionKey } = this.state;
        const result = this.performGostDecryption(inputText, encryptionKey);
        this.setState({ outputText: result });
    };

    render() {
        const { inputText, encryptionKey, outputText } = this.state;

        return (
            <div className="cipher-container">
                <h1 className="app-title">ГОСТ 28147-89</h1>

                <input type="text" className="key-input" placeholder="Введите ваш ключ" value={encryptionKey} onChange={this.handleKeyChange} aria-label="Ключ шифрования" />

                <textarea className="input-area" placeholder="Введите текст шифрования или дешифрования" value={inputText} onChange={this.handleInputTextChange} aria-label="Входной текст" />

                <textarea className="output-area" placeholder="Вывод" value={outputText} readOnly aria-label="Результат операции" />

                <div className="button-group">
                    <button className="action-button encrypt-btn" onClick={this.handleEncryptClick}>
                        Зашифровать
                    </button>
                    <button className="action-button decrypt-btn" onClick={this.handleDecryptClick}>
                        Расшифровать
                    </button>
                </div>
            </div>
        );
    }
}

export default EncrypGOST;
