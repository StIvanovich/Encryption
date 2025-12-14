import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import CaesarEncryp from "./component/CaesarEncryp";

function App() {
    return (
        <>
            <main className="app-container">
                <CaesarEncryp />
            </main>
        </>
    );
}

export default App;
