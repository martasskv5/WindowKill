import { startGame } from "./js/functions.js";
import { Options } from "./js/options.js";
const { getCurrentWindow, currentMonitor, LogicalSize, LogicalPosition } = window.__TAURI__.window;
const { invoke } = window.__TAURI__.core;

let isPaused = false;

// window.addEventListener("DOMContentLoaded", async () => {
    let appWindow = await getCurrentWindow();
    const monitor = await currentMonitor();
    const screenWidth = monitor.size.width;
    const screenHeight = monitor.size.height;
    
    const options = new Options();
    await options.initialize();
    localStorage.setItem("achievements", JSON.stringify(options.achievements.achievements));
    options.screenMultiplier = 1920 / screenWidth;
    localStorage.setItem("screenMultiplier", options.screenMultiplier);
    
    // ✅ Prehrávanie hudby
    const bgMusic = new Audio("assets/sound/mojtrack.mp3");
    bgMusic.loop = true;
    bgMusic.volume = options.volume / 100;

    const windowWidth = options.defaultWidth / options.screenMultiplier;
    options.newWidth = windowWidth;
    console.log(`Window width: ${windowWidth}`);

    await appWindow.setSize(new LogicalSize(windowWidth, windowWidth));
    await appWindow.setPosition(new LogicalPosition((screenWidth - windowWidth) / 2, (screenHeight - windowWidth) / 2));

    if (await appWindow.scaleFactor() > 1) {
        alert("For best experience, please set your display scaling to 100%.");
    }

    await invoke("start_sync_server");
    await invoke("subscribe_sync");

    const startButton = document.querySelector("#startButton");
    const optionsButton = document.querySelector("#optionsButton");
    const quitButton = document.querySelector("#quitButton");
    const achievementsButton = document.querySelector("#achievements");
    const backButton = document.querySelector("#backButton");
    const saveButton = document.querySelector("#saveButton");
    const restartButton = document.querySelector("#restartButton");
    const mainMenuButton = document.querySelector("#mainMenuButton");
    const timer = document.querySelector("#timer");
    const killCount = document.querySelector("#killCount");

    startButton.addEventListener("click", async () => {
        document.querySelector("#gameStart").classList.toggle("hidden");
        achievements.classList.toggle("hidden");
        timer.classList.toggle("hidden");
        killCount.classList.toggle("hidden");

        try {
            await bgMusic.play();
        } catch (err) {
            console.error("Failed to play music:", err);
        }

        await startGame(appWindow, options, timer, bgMusic);
    });

    optionsButton.addEventListener("click", () => {
        document.querySelector("#gameStart").classList.toggle("hidden");
        achievements.classList.toggle("hidden");
        document.querySelector("#settings").classList.toggle("hidden");
    });

    backButton.addEventListener("click", () => {
        if (options.unsavedChanges()) {
            const confirmLeave = confirm("You have unsaved changes. These changes will be used only in this session. Are you sure you want to leave?");
            if (!confirmLeave) return;
            document.querySelector("#settings").classList.toggle("hidden");
            document.querySelector("#gameStart").classList.toggle("hidden");
        } else {
            document.querySelector("#settings").classList.toggle("hidden");
            document.querySelector("#gameStart").classList.toggle("hidden");
            achievements.classList.toggle("hidden");
        }
    });

    saveButton.addEventListener("click", () => {
        const difficulty = document.querySelector("#difficulty").value;
        const volume = parseFloat(document.querySelector("#volume").value);
        const playerColor = document.querySelector("#playerColor").value;

        const newOptions = {
            difficulty,
            volume,
            playerColor,
        };

        bgMusic.volume = volume / 100;
        localStorage.setItem("volume", volume / 100);
        options.updateOptions(newOptions);
    });

    quitButton.addEventListener("click", () => {
        invoke("quit");
    });

    restartButton.addEventListener("click", async () => {
        document.querySelector("#gameEnd").classList.toggle("hidden");
        timer.classList.toggle("hidden");
        killCount.classList.toggle("hidden");

        bgMusic.currentTime = 0;
        bgMusic.play();

        await startGame(appWindow, options, timer, bgMusic);
    });

    mainMenuButton.addEventListener("click", () => {
        document.querySelector("#gameEnd").classList.toggle("hidden");
        document.querySelector("#gameStart").classList.toggle("hidden");
        achievements.classList.toggle("hidden");

        bgMusic.pause();
        bgMusic.currentTime = 0;
    });

    achievementsButton.addEventListener("click", async () => {
        const width = (options.defaultWidth + 200) / options.screenMultiplier;
        await invoke("create_window", {
            id: "achievements",
            url: "html/achievements.html",
            x: (screenWidth - width) / 2,
            y: (screenHeight - width) / 2,
            w: width,
            h: width,
            title: "Achievements"
        });
    });

    // ✅ Pauza cez ESC
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            isPaused = !isPaused;

            if (isPaused) {
                console.log("Game paused");
                bgMusic.pause();
                // TODO: zobraz pauzovacie menu, stopni časovač
            } else {
                console.log("Game unpaused");
                bgMusic.play().catch(err => console.error("Resume error:", err));
                // TODO: skry pauzovacie menu, spusti časovač
            }
        }
    });
// });
