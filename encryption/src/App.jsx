import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import GOST from "./components/EncrypGOST";
import EncrypGOST from "./components/EncrypGOST";

function App() {
    return (
        <>
            <main className="app-container">
                <EncrypGOST />
            </main>
        </>
    );
}

export default App;
