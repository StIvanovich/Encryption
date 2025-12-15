import { useState } from "react";

const ENGLISH_ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const RUSSIAN_ALPHABET = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";

const getAlphabet = (character) => {
    const lowerCharacter = character.toLowerCase();
    if (ENGLISH_ALPHABET.includes(lowerCharacter)) {
        return ENGLISH_ALPHABET;
    }
    if (RUSSIAN_ALPHABET.includes(lowerCharacter)) {
        return RUSSIAN_ALPHABET;
    }
    return null;
};

const shiftLetter = (letter, shift) => {
    const alphabet = getAlphabet(letter);
    if (!alphabet) {
        return letter;
    }

    const wasUpperCase = letter === letter.toUpperCase();
    const lowerLetter = letter.toLowerCase();

    const currentIndex = alphabet.indexOf(lowerLetter);
    const newIndex = (currentIndex + shift + alphabet.length) % alphabet.length;

    let newLetter = alphabet[newIndex];

    if (wasUpperCase) {
        newLetter = newLetter.toUpperCase();
    }

    return newLetter;
};

const CaesarEncryp = () => {
    const [inputText, setInputText] = useState("");
    const [shift, setShift] = useState(3);
    const [resultText, setResultText] = useState("");

    const encrypt = () => {
        const inputCharacters = inputText.split("");
        const encryptedCharacters = [];

        for (const character of inputCharacters) {
            const encryptedChar = shiftLetter(character, shift);
            encryptedCharacters.push(encryptedChar);
        }

        const encryptedText = encryptedCharacters.join("");
        setResultText(encryptedText);
    };

    const decrypt = () => {
        const inputCharacters = inputText.split("");
        const decryptedCharacters = [];

        for (const character of inputCharacters) {
            const decryptedChar = shiftLetter(character, -shift);
            decryptedCharacters.push(decryptedChar);
        }

        const decryptedText = decryptedCharacters.join("");
        setResultText(decryptedText);
    };

    const bruteForce = () => {
        if (!inputText.trim()) {
            setResultText("Введите текст для взлома.");
            return;
        }

        let alphabet = null;
        for (const char of inputText) {
            const a = getAlphabet(char);
            if (a) {
                alphabet = a;
                break;
            }
        }

        if (!alphabet) {
            setResultText("Текст не содержит букв.");
            return;
        }

        const maxShift = alphabet.length;
        let results = [];

        for (let s = 1; s < maxShift; s++) {
            const decrypted = inputText
                .split("")
                .map((c) => shiftLetter(c, -s))
                .join("");
            results.push(`Сдвиг ${s}: ${decrypted}`);
        }

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
                    const value = parseInt(e.target.value, 10);
                    setShift(isNaN(value) ? 0 : value);
                }}
                min="-100"
                max="100"
                placeholder="Сдвиг"
            />

            <div className="button-group">
                <button className="action-button encrypt" onClick={encrypt}>
                    Зашифровать
                </button>
                <button className="action-button decrypt" onClick={decrypt}>
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
