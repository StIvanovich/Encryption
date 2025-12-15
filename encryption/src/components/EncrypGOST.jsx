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

    handleInputTextChange = (e) => {
        this.setState({ inputText: e.target.value });
    };

    handleKeyChange = (e) => {
        this.setState({ encryptionKey: e.target.value });
    };

    stringToBytes = (str) => this.textEncoder.encode(str);
    bytesToString = (bytes) => this.textDecoder.decode(bytes);

    prepareKey = (key) => {
        const keyBytes = this.stringToBytes(key);
        const extended = new Uint8Array(32).fill(0);
        for (let i = 0; i < 32; i++) {
            extended[i] = keyBytes[i % keyBytes.length] || 0;
        }

        const keyWords = new Uint32Array(8);
        for (let i = 0; i < 8; i++) {
            keyWords[i] = extended[i * 4] | (extended[i * 4 + 1] << 8) | (extended[i * 4 + 2] << 16) | (extended[i * 4 + 3] << 24);
        }
        return keyWords;
    };

    addPadding = (data) => {
        const padLength = 8 - (data.length % 8);
        const padded = new Uint8Array(data.length + padLength);
        padded.set(data);
        padded.fill(padLength, data.length);
        return padded;
    };

    removePadding = (data) => {
        const padLength = data[data.length - 1];
        if (padLength < 1 || padLength > 8) return data;
        return data.slice(0, -padLength);
    };

    bytesToWords = (block) => {
        const w1 = (block[0] | (block[1] << 8) | (block[2] << 16) | (block[3] << 24)) >>> 0;
        const w2 = (block[4] | (block[5] << 8) | (block[6] << 16) | (block[7] << 24)) >>> 0;
        return [w1, w2];
    };

    wordsToBytes = (w1, w2) => {
        return new Uint8Array([w1 & 0xff, (w1 >> 8) & 0xff, (w1 >> 16) & 0xff, (w1 >> 24) & 0xff, w2 & 0xff, (w2 >> 8) & 0xff, (w2 >> 16) & 0xff, (w2 >> 24) & 0xff]);
    };

    gostRoundFunction = (value, roundKey) => {
        let x = value;
        for (let i = 0; i < 4; i++) {
            const sum = (x + roundKey) >>> 0;
            let substituted = 0;
            for (let j = 0; j < 8; j++) {
                const nibble = (sum >> (4 * j)) & 0xf;
                substituted |= this.gostSBoxes[j][nibble] << (4 * j);
            }
            x = ((substituted << 11) | (substituted >>> 21)) >>> 0;
        }
        return x;
    };

    encryptBlock = (left, right, keySchedule) => {
        for (let round = 0; round < 32; round++) {
            const newRight = (left ^ this.gostRoundFunction(right, keySchedule[round % 8])) >>> 0;
            left = right;
            right = newRight;
        }
        return [right, left];
    };

    decryptBlock = (left, right, keySchedule) => {
        for (let round = 31; round >= 0; round--) {
            const newRight = (left ^ this.gostRoundFunction(right, keySchedule[round % 8])) >>> 0;
            left = right;
            right = newRight;
        }
        return [right, left];
    };

    encryptText = (text, key) => {
        if (!key.trim()) return "[Ошибка: ключ не задан]";
        try {
            const keySchedule = this.prepareKey(key);
            const plainBytes = this.addPadding(this.stringToBytes(text));
            const cipherBytes = new Uint8Array(plainBytes.length);

            for (let i = 0; i < plainBytes.length; i += 8) {
                const block = plainBytes.slice(i, i + 8);
                const [l, r] = this.bytesToWords(block);
                const [cl, cr] = this.encryptBlock(l, r, keySchedule);
                cipherBytes.set(this.wordsToBytes(cl, cr), i);
            }

            return btoa(String.fromCharCode(...cipherBytes));
        } catch {
            return "[Ошибка шифрования]";
        }
    };

    decryptText = (base64Cipher, key) => {
        if (!key.trim()) return "[Ошибка: ключ не задан]";
        try {
            const binary = atob(base64Cipher);
            const cipherBytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));

            if (cipherBytes.length % 8 !== 0) {
                return "[Ошибка: длина шифротекста не кратна 8 байтам]";
            }

            const keySchedule = this.prepareKey(key);
            const plainBytes = new Uint8Array(cipherBytes.length);

            for (let i = 0; i < cipherBytes.length; i += 8) {
                const block = cipherBytes.slice(i, i + 8);
                const [l, r] = this.bytesToWords(block);
                const [dl, dr] = this.decryptBlock(l, r, keySchedule);
                plainBytes.set(this.wordsToBytes(dl, dr), i);
            }

            const unpadded = this.removePadding(plainBytes);
            return this.bytesToString(unpadded);
        } catch {
            return "[Ошибка расшифровки: проверьте ключ и шифротекст]";
        }
    };

    handleEncrypt = () => {
        const { inputText, encryptionKey } = this.state;
        const result = this.encryptText(inputText, encryptionKey);
        this.setState({ outputText: result });
    };

    handleDecrypt = () => {
        const { inputText, encryptionKey } = this.state;
        const result = this.decryptText(inputText, encryptionKey);
        this.setState({ outputText: result });
    };

    render() {
        const { inputText, encryptionKey, outputText } = this.state;

        return (
            <div className="cipher-container">
                <h1 className="app-title">ГОСТ 28147-89</h1>

                <input type="text" className="key-input" placeholder="Введите ключ шифрования" value={encryptionKey} onChange={this.handleKeyChange} aria-label="Ключ" />

                <textarea className="input-area" placeholder="Текст для шифрования или для расшифровки" value={inputText} onChange={this.handleInputTextChange} aria-label="Входные данные" />

                <textarea className="output-area" placeholder="Результат" value={outputText} readOnly aria-label="Результат" />

                <div className="button-group">
                    <button className="action-button encrypt-btn" onClick={this.handleEncrypt}>
                        Зашифровать
                    </button>
                    <button className="action-button decrypt-btn" onClick={this.handleDecrypt}>
                        Расшифровать
                    </button>
                </div>
            </div>
        );
    }
}

export default EncrypGOST;
