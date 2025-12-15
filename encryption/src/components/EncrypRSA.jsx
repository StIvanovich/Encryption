import { useState } from "react";

const EncrypRSA = () => {
    const [userInput, setUserInput] = useState("");
    const [result, setResult] = useState("Результат шифрования");

    const hexEncode = (plainText) => {
        return plainText
            .split("")
            .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
            .join(" ");
    };

    const hexDecode = (encodedText) => {
        try {
            return encodedText
                .split(" ")
                .map((hex) => String.fromCharCode(parseInt(hex, 16)))
                .join("");
        } catch {
            return "Ошибка: недопустимый формат шифротекста";
        }
    };

    const encryptText = () => {
        if (userInput.trim() === "") {
            setResult("Введите текст для шифрования");
            return;
        }
        const encoded = hexEncode(userInput);
        setResult(encoded);
    };

    const decrypText = () => {
        if (userInput.trim() === "") {
            setResult("Введите зашифрованный текст");
            return;
        }
        const decoded = hexDecode(userInput);
        setResult(decoded);
    };

    return (
        <div className="rsa-card">
            <h1 className="rsa-title">Шифр RSA</h1>

            <textarea className="rsa-input" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Введите текст для шифрования или расшифровки" rows={4} />

            <div className="button-group">
                <button className="rsa-button encrypt" onClick={encryptText} type="button">
                    Зашифровать
                </button>
                <button className="rsa-button decrypt" onClick={decrypText} type="button">
                    Расшифровать
                </button>
            </div>

            <div className="rsa-result">{result}</div>
        </div>
    );
};

export default EncrypRSA;
