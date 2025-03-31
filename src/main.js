import { startGame } from "./js/functions.js";
const { getCurrentWindow } = window.__TAURI__.window;
const { invoke } = window.__TAURI__.core;

window.addEventListener("DOMContentLoaded", async () => {
    let appWindow = await getCurrentWindow();
    const startButton = document.querySelector("#startButton");
    const optionsButton = document.querySelector("#optionsButton");
    const quitButton = document.querySelector("#quitButton");

    // Start the game
    startButton.addEventListener("click", async () => {
        // Hide main menu
        document.querySelector("#gameStart").style.display = "none";

        await startGame(appWindow);
    });

    optionsButton.addEventListener("click", () => {
        // Hide main menu
        document.querySelector("#gameStart").classList.toggle("hidden");
		// Show options menu
		document.querySelector("#settings").classList.toggle("hidden");

        // Buttons in options menu
        const backButton = document.querySelector("#backButton");
        const saveButton = document.querySelector("#saveButton");

        backButton.addEventListener("click", () => {
            // Hide options menu
            document.querySelector("#settings").classList.toggle("hidden");
            // Show main menu
            document.querySelector("#gameStart").classList.toggle("hidden");
        });
    
        saveButton.addEventListener("click", () => {
            const difficulty = document.querySelector("#difficulty").value;
            const volume = document.querySelector("#volume").value;
            console.log(`Difficulty: ${difficulty}, Volume: ${volume}`);
            alert("Save logic not implemented yet.");
        });
    });

    quitButton.addEventListener("click", () => {
        invoke("quit");
    });
});