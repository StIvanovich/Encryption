import React, { useState } from "react";

const DeutschlandEncryp = () => {
    const [inputText, setInputText] = useState("");
    const [outputText, setOutputText] = useState("");

    const adfgvxMatrix = [
        ["p", "h", "0", "q", "g", "6"],
        ["4", "m", "e", "a", "1", "y"],
        ["l", "2", "n", "o", "f", "d"],
        ["x", "k", "r", "3", "c", "v"],
        ["s", "5", "z", "w", "7", "b"],
        ["j", "9", "u", "t", "i", "8"],
    ];

    const headers = ["A", "D", "F", "G", "V", "X"];

    const buildMap = () => {
        const map = {};
        for (let row = 0; row < adfgvxMatrix.length; row++) {
            for (let col = 0; col < headers.length; col++) {
                const char = adfgvxMatrix[row][col].toLowerCase();
                map[char] = headers[row] + headers[col];
            }
        }
        return map;
    };

    const encrypt = (text) => {
        const clean = text.toLowerCase().replace(/[^a-z0-9]/g, "");
        const map = buildMap();
        return clean
            .split("")
            .map((char) => map[char] || "")
            .join("");
    };

    const decrypt = (encoded) => {
        const clean = encoded.toUpperCase().replace(/[^ADFGVX]/g, "");
        if (clean.length % 2 !== 0) {
            return "Ошибка: требуется чётное число символов ADFGVX";
        }

        const map = buildMap();
        const reverseMap = {};
        for (const [char, code] of Object.entries(map)) {
            reverseMap[code] = char;
        }

        let result = "";
        for (let i = 0; i < clean.length; i += 2) {
            const pair = clean[i] + clean[i + 1];
            result += reverseMap[pair] || "";
        }
        return result;
    };

    const handleEncrypt = () => setOutputText(encrypt(inputText));
    const handleDecrypt = () => setOutputText(decrypt(inputText));

    return (
        <div role="region">
            <header>
                <h1>Немецкий шифр ADFGVX</h1>
                <p className="subtitle">Первой мировой войны </p>
            </header>

            <main>
                <div className="input-section">
                    <label htmlFor="input-text">Введите текст для шифрования или расшифровки:</label>
                    <textarea id="input-text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Для примера, введите:hello " rows="4" aria-describedby="input-hint" />
                    <p id="input-hint" className="hint">
                        Используйте латинницу.
                    </p>
                </div>

                <div className="actions">
                    <button type="button" onClick={handleEncrypt} aria-label="Зашифровать введённый текст">
                        Зашифровать
                    </button>
                    <button type="button" onClick={handleDecrypt} aria-label="Расшифровать введённый шифротекст">
                        Расшифровать
                    </button>
                </div>

                {outputText && (
                    <div className="output-section" aria-live="polite">
                        <h2>Полученный результат</h2>
                        <div className="output-box" id="output-text">
                            {outputText}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DeutschlandEncryp;
