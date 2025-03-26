import * as C from "./js/classes.js";
import { startGame, animateWindowResizeAndCenter } from "./js/functions.js";
const { getCurrentWindow, LogicalSize, LogicalPosition, currentMonitor } = window.__TAURI__.window;
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
        
        // Resize the window to 400x400px
        await appWindow.setSize(new LogicalSize(400, 400))

        // Center the window on the screen
        const monitor = await currentMonitor();
        if (monitor) {
            const monitorWidth = monitor.size.width;
            const monitorHeight = monitor.size.height;
            const newX = (monitorWidth - 400) / 2; // Center horizontally
            const newY = (monitorHeight - 400) / 2; // Center vertically
            await animateWindowResizeAndCenter(appWindow, 400, 400, newX, newY, 1000);
        }

        startGame(appWindow);
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