import { startGame } from "./js/functions.js";
import { Options } from "./js/options.js";
const { getCurrentWindow, currentMonitor, LogicalSize, LogicalPosition } = window.__TAURI__.window;
const { invoke } = window.__TAURI__.core;

window.addEventListener("DOMContentLoaded", async () => {
    let appWindow = await getCurrentWindow();
    const monitor = await currentMonitor();
    const screenWidth = monitor.size.width;
    const screenHeight = monitor.size.height;

    // Load options
    const options = new Options();
    await options.initialize();
    localStorage.setItem("achievements", JSON.stringify(options.achievements.achievements));
    options.screenMultiplier = 1920 / screenWidth;
    console.log(options.screenMultiplier);

    // Adjust the window size to fit the screen
    const windowWidth = options.defaultWidth / options.screenMultiplier;
    options.newWidth = windowWidth;
    console.log(`Window width: ${windowWidth}`);

    await appWindow.setSize(new LogicalSize(windowWidth, windowWidth));
    await appWindow.setPosition(new LogicalPosition((screenWidth - windowWidth) / 2, (screenHeight - windowWidth) / 2));

    if (await appWindow.scaleFactor() > 1) {
        alert(
            "For best experience, please set your display scaling to 100%."
        );
    }

    await invoke("start_sync_server");
    await invoke('subscribe_sync');

    // Buttons in main menu
    const startButton = document.querySelector("#startButton");
    const optionsButton = document.querySelector("#optionsButton");
    const quitButton = document.querySelector("#quitButton");
    const achievementsButton = document.querySelector("#achievements");
    // Buttons in options menu
    const backButton = document.querySelector("#backButton");
    const saveButton = document.querySelector("#saveButton");
    // Buttons in game end menu
    const restartButton = document.querySelector("#restartButton");
    const mainMenuButton = document.querySelector("#mainMenuButton");

    const timer = document.querySelector("#timer");
    const killCount = document.querySelector("#killCount");

    // Start the game
    startButton.addEventListener("click", async () => {
        // Hide main menu
        document.querySelector("#gameStart").classList.toggle("hidden");
        achievements.classList.toggle("hidden");
        timer.classList.toggle("hidden");
        killCount.classList.toggle("hidden");

        await startGame(appWindow, options, timer);
    });

    optionsButton.addEventListener("click", () => {
        // Hide main menu
        document.querySelector("#gameStart").classList.toggle("hidden");
        achievements.classList.toggle("hidden");
        // Show options menu
        document.querySelector("#settings").classList.toggle("hidden");
    });
    // Options menu buttons
    backButton.addEventListener("click", () => {
        if (options.unsavedChanges()) {
            const confirmLeave = confirm(
                "You have unsaved changes. These changes will be used only in this session. Are you sure you want to leave?"
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
            achievements.classList.toggle("hidden");
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

    // Game end menu buttons
    restartButton.addEventListener("click", async () => {
        // Hide game end menu
        document.querySelector("#gameEnd").classList.toggle("hidden");
        timer.classList.toggle("hidden");
        killCount.classList.toggle("hidden");

        await startGame(appWindow, options, timer);
    });

    mainMenuButton.addEventListener("click", () => {
        // Hide game end menu
        document.querySelector("#gameEnd").classList.toggle("hidden");
        // Show main menu
        document.querySelector("#gameStart").classList.toggle("hidden");
        achievements.classList.toggle("hidden");
    });

    achievementsButton.addEventListener("click", async () => {
        const width = (options.defaultWidth + 200) / options.screenMultiplier
        await invoke("create_window", { id: "achievements", url: "html/achievements.html", x: (screenWidth - width) / 2, y: (screenHeight - width) / 2, w: width, h: width, title: "Achievements" });
    });
});