import { startGame } from "./js/functions.js";
import { Options } from "./js/options.js";
const { getCurrentWindow } = window.__TAURI__.window;
const { invoke } = window.__TAURI__.core;

window.addEventListener("DOMContentLoaded", async () => {
    let appWindow = await getCurrentWindow();

    // Load options
    const options = new Options();
    await options.initialize();

    const startButton = document.querySelector("#startButton");
    const optionsButton = document.querySelector("#optionsButton");
    const quitButton = document.querySelector("#quitButton");
    // Buttons in options menu
    const backButton = document.querySelector("#backButton");
    const saveButton = document.querySelector("#saveButton");

    // Start the game
    startButton.addEventListener("click", async () => {
        // Hide main menu
        document.querySelector("#gameStart").style.display = "none";

        await startGame(appWindow, options);
    });

    optionsButton.addEventListener("click", () => {
        // Hide main menu
        document.querySelector("#gameStart").classList.toggle("hidden");
        // Show options menu
        document.querySelector("#settings").classList.toggle("hidden");
    });
    // Options menu buttons
    backButton.addEventListener("click", () => {
        if (options.unsavedChanges()) {
            const confirmLeave = confirm(
                "You have unsaved changes. These changes will be usend only in this session. Are you sure you want to leave?"
            );
            if (!confirmLeave) {
                return;
            } else {
                // Hide options menu
                document.querySelector("#settings").classList.toggle("hidden");
                // Show main menu
                document.querySelector("#gameStart").classList.toggle("hidden");
            }
        } else {
            // Hide options menu
            document.querySelector("#settings").classList.toggle("hidden");
            // Show main menu
            document.querySelector("#gameStart").classList.toggle("hidden");
        }
    });

    saveButton.addEventListener("click", () => {
        const difficulty = document.querySelector("#difficulty").value;
        const volume = document.querySelector("#volume").value;
        const playerColor = document.querySelector("#playerColor").value;

        const newOptions = {
            difficulty: difficulty,
            volume: volume,
            playerColor: playerColor,
        };
        console.log(newOptions);
        // Update options
        options.updateOptions(newOptions);
    });

    quitButton.addEventListener("click", () => {
        invoke("quit");
    });
});
