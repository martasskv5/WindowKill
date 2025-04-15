import * as C from "./classes.js";
import { GameUtils } from "./gameUtils.js";
const { LogicalSize, LogicalPosition } = window.__TAURI__.window;

/**
 * Helper function for resizing the window. Can shrink or expand the window while keeping it centered.
 * @param {Object} appWindow - The Tauri app window object.
 * @param {number} targetWidth - The target width to resize the window to.
 * @param {number} targetHeight - The target height to resize the window to.
 * @param {number} durationMs - The duration of the animation in milliseconds.
 * @returns {Promise<void>}
 */
async function _resizeWindow(appWindow, targetWidth, targetHeight, durationMs) {
    // Get the initial window size and position
    const startSize = await appWindow.innerSize();
    const startPos = await appWindow.outerPosition();

    // Ensure startSize and startPos are valid
    if (!startSize || !startPos) {
        throw new Error("Failed to retrieve window size or position.");
    }

    // Animate the resizing process
    const startTime = Date.now();
    return new Promise((resolve) => {
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / durationMs, 1);

            // Calculate new size and position to keep the window centered
            const newWidth = startSize.width + targetWidth * progress;
            const newHeight = startSize.height + targetHeight * progress;
            const newX = startPos.x - (newWidth - startSize.width) / 2;
            const newY = startPos.y - (newHeight - startSize.height) / 2;

            // Update window size and position
            appWindow.setSize(new LogicalSize(newWidth, newHeight)).catch(console.error);
            appWindow.setPosition(new LogicalPosition(newX, newY)).catch(console.error);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        };

        requestAnimationFrame(animate);
    });
}

/**
 * Starts the game.
 * @param {Object} appWindow - The Tauri app window object.
 * @param {Object} options - The game options object.
 * @param {HTMLElement} timer - The timer element.
 */
async function startGame(appWindow, options, timer) {
    // Resize the window to 400x400px
    await _resizeWindow(appWindow, -200, -200, 200);

    const canvas = document.querySelector("canvas");
    const c = canvas.getContext("2d");

    canvas.width = innerWidth;
    canvas.height = innerHeight;

    const playerRadius = 10;
    let playerX = canvas.width / 2;
    let playerY = canvas.height / 2;

    const player = new C.Player(playerX, playerY, playerRadius, options.playerColor);
    const projectiles = [];
    let gameOver = false;

    const gameUtils = new GameUtils(appWindow, canvas, player, playerRadius, projectiles, gameOver);

    player.draw(c);
    gameUtils.updateCanvasSize();
    gameUtils.centerPlayer();

    // Timer logic
    let startTime = Date.now(); // Record the start time
    const timerInterval = setInterval(() => {
        if (gameUtils.gameOver) {
            clearInterval(timerInterval); // Stop the timer when the game is over
            gameUtils.score = Math.floor((Date.now() - startTime) / 1000); // Calculate score in seconds
        } else {
            const elapsedTime = Date.now() - startTime; // Calculate elapsed time in milliseconds
            const minutes = Math.floor(elapsedTime / 60000)
                .toString()
                .padStart(2, "0"); // Convert to minutes
            const seconds = Math.floor((elapsedTime % 60000) / 1000)
                .toString()
                .padStart(2, "0"); // Convert to seconds
            const milliseconds = (elapsedTime % 1000).toString().padStart(3, "0"); // Get milliseconds
            timer.innerText = `${minutes}:${seconds}:${milliseconds}`; // Update timer display
        }
    }, 10); // Update timer every 10ms for better precision

    // Resize canvas when window is resized
    window.addEventListener("resize", () => {
        gameUtils.updateCanvasSize();
        gameUtils.centerPlayer();
    });

    // Update player position when window is moved
    appWindow.onMoved(() => {
        gameUtils.centerPlayer();
    });

    document.addEventListener("click", (event) => {
        const angle = Math.atan2(event.clientY - player.y, event.clientX - player.x);
        const velocity = {
            x: Math.cos(angle) * 5,
            y: Math.sin(angle) * 5,
        };
        projectiles.push(new C.Projectile(player.x, player.y, 5, options.playerColor, velocity));
    });
    gameUtils.animate();
    gameUtils.shrinkWindow();
}

export { startGame, _resizeWindow };
