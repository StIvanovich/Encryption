import React, { useState } from "react";

const CaesarEncryp = () => {
    const [inputText, setInputText] = useState("");
    const [shift, setShift] = useState(3);
    const [outputText, setOutputText] = useState("");

    const RU_LOWERCASE = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
    const RU_UPPERCASE = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
    const EN_LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
    const EN_UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    const shiftChar = (char, alphabet, shiftAmount) => {
        const index = alphabet.indexOf(char);
        if (index === -1) return char;
        const len = alphabet.length;
        const normalizedShift = ((shiftAmount % len) + len) % len;
        const newIndex = (index + normalizedShift) % len;
        return alphabet[newIndex];
    };

    const caesar = (str, shiftAmount) => {
        return str
            .split("")
            .map((char) => {
                if (RU_LOWERCASE.includes(char)) {
                    return shiftChar(char, RU_LOWERCASE, shiftAmount);
                } else if (RU_UPPERCASE.includes(char)) {
                    return shiftChar(char, RU_UPPERCASE, shiftAmount);
                } else if (EN_LOWERCASE.includes(char)) {
                    return shiftChar(char, EN_LOWERCASE, shiftAmount);
                } else if (EN_UPPERCASE.includes(char)) {
                    return shiftChar(char, EN_UPPERCASE, shiftAmount);
                } else {
                    return char;
                }
            })
            .join("");
    };

    const handleEncrypt = () => {
        const result = caesar(inputText, parseInt(shift, 10) || 0);
        setOutputText(result);
    };

    const handleDecrypt = () => {
        const result = caesar(inputText, -parseInt(shift, 10) || 0);
        setOutputText(result);
    };

    const handleBruteForce = () => {
        const results = [];
        const hasCyrillic = /[а-яА-ЯёЁ]/.test(inputText);
        const maxShift = hasCyrillic ? 33 : 26;

        for (let s = 1; s < maxShift; s++) {
            const attempt = caesar(inputText, -s);
            results.push(`Смещение ${s}: ${attempt}`);
        }

        setOutputText(results.join("\n"));
    };

    return (
        <div className="cipher-container">
            <h2>Шифр Цезаря </h2>

            <div className="input-group">
                <label>
                    Текст:
                    <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} rows="5" cols="65" placeholder="Введите текст " />
                </label>
            </div>

            <div className="shift-control">
                <label>
                    Смещение:
                    <input type="number" value={shift} onChange={(e) => setShift(e.target.value)} min="1" max="100" />
                </label>
            </div>

            <div className="button-group">
                <button onClick={handleEncrypt} className="btn encrypt">
                    Зашифровать
                </button>
                <button onClick={handleDecrypt} className="btn decrypt">
                    Расшифровать
                </button>
                <button onClick={handleBruteForce} className="btn brute">
                    Взломать
                </button>
            </div>

            <div className="result-section">
                <strong>Результат:</strong>
                <pre className="result-output">{outputText || "—"}</pre>
            </div>
        </div>
    );
};

export default CaesarEncryp;
