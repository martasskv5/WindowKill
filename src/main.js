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
        // document.querySelector("#gameStart").style.display = "none";
        // Show options menu
        // document.querySelector("#options").style.display = "block";
        alert("Options menu not implemented yet.");
    });

    quitButton.addEventListener("click", () => {
        invoke("quit");
    });
});