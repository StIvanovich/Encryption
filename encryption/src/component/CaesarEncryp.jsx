import { useState } from "react";

const RUSSIAN_ALPHABET = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
const ENGLISH_ALPHABET = "abcdefghijklmnopqrstuvwxyz";

const getAlphabet = (char) => {
    const lower = char.toLowerCase();
    if (ENGLISH_ALPHABET.includes(lower)) return ENGLISH_ALPHABET;
    if (RUSSIAN_ALPHABET.includes(lower)) return RUSSIAN_ALPHABET;
    return null;
};

const shiftLetter = (letter, shift) => {
    const alphabet = getAlphabet(letter);
    if (!alphabet) return letter;

    const isUpper = letter === letter.toUpperCase();
    const lower = letter.toLowerCase();
    const index = alphabet.indexOf(lower);
    const newIndex = (index + shift + alphabet.length) % alphabet.length;
    let newLetter = alphabet[newIndex];

    return isUpper ? newLetter.toUpperCase() : newLetter;
};

const CaesarEncryp = () => {
    const [inputText, setInputText] = useState("");
    const [shift, setShift] = useState(3);
    const [resultText, setResultText] = useState("");

    const processText = (direction) => {
        const output = inputText
            .split("")
            .map((char) => shiftLetter(char, shift * direction))
            .join("");
        setResultText(output);
    };

    const bruteForce = () => {
        if (!inputText.trim()) {
            setResultText("Введите текст для взлома.");
            return;
        }

        const alphabet = inputText
            .split("")
            .map(getAlphabet)
            .find((a) => a !== null);

        if (!alphabet) {
            setResultText("Текст не содержит букв.");
            return;
        }

        const results = Array.from({ length: alphabet.length - 1 }, (_, i) => {
            const s = i + 1;
            const decrypted = inputText
                .split("")
                .map((c) => shiftLetter(c, -s))
                .join("");
            return `Сдвиг ${s}: ${decrypted}`;
        });

        setResultText(results.join("\n"));
    };

    return (
        <div className="cipher-container">
            <h1>Шифр Цезаря</h1>

            <textarea className="input-field" placeholder="Введите текст для шифрования/расшифровки..." value={inputText} onChange={(e) => setInputText(e.target.value)} rows={4} />

            <input
                type="number"
                className="shift-input"
                value={shift}
                onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setShift(isNaN(val) ? 0 : val);
                }}
                min="-100"
                max="100"
                placeholder="Сдвиг"
            />

            <div className="button-group">
                <button className="action-button encrypt" onClick={() => processText(1)}>
                    Зашифровать
                </button>
                <button className="action-button decrypt" onClick={() => processText(-1)}>
                    Расшифровать
                </button>
                <button className="action-button brute-force" onClick={bruteForce}>
                    Взломать
                </button>
            </div>

            <textarea className="result-field" placeholder="Результат..." value={resultText} readOnly rows={6} />
        </div>
    );
};

export default CaesarEncryp;
