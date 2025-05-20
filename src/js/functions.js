import * as C from "./classes.js";
import { GameUtils } from "./gameUtils.js";
const { LogicalSize, LogicalPosition } = window.__TAURI__.window;
const { isPermissionGranted, requestPermission, sendNotification, } = window.__TAURI__.notification;

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
 * Sends a notification with the given title and body.
 * @param {string} title - The title of the notification.
 * @param {string} body - The body of the notification.
 * @return {Promise<void>}
 * @throws {Error} If the notification fails to send.
 */
async function _sendNotification(title, body) {
    // Do you have permission to send a notification?
    let permissionGranted = await isPermissionGranted();

    // If not we need to request it
    if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
    }

    // Once permission has been granted we can send the notification
    if (permissionGranted) {
        sendNotification({ title: title, body: body });
    }
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

    const gameUtils = new GameUtils(appWindow, canvas, player, playerRadius, options);

    player.draw(c);
    gameUtils.updateCanvasSize();
    gameUtils.centerPlayer();

    // Timer logic
    let startTime = Date.now() // Record the start time
    let pausedTime = 0 // Total time spent paused
    let pauseStart = null // When pause started

    const timerInterval = setInterval(() => {
        if (gameUtils.gameOver) {
            clearInterval(timerInterval) // Stop the timer when the game is over
            gameUtils.score = Math.floor((Date.now() - startTime - pausedTime) / 1000) // Calculate score in seconds
        } else if (gameUtils.paused) {
            if (!pauseStart) pauseStart = Date.now() // Mark when pause started
        } else {
            if (pauseStart) {
                pausedTime += Date.now() - pauseStart // Add paused duration
                pauseStart = null
            }
            const elapsedTime = Date.now() - startTime - pausedTime // Exclude paused time
            const minutes = Math.floor(elapsedTime / 60000).toString().padStart(2, "0")
            const seconds = Math.floor((elapsedTime % 60000) / 1000).toString().padStart(2, "0")
            const milliseconds = (elapsedTime % 1000).toString().padStart(3, "0")
            timer.innerText = `${minutes}:${seconds}:${milliseconds}` // Update timer display
        }
    }, 10) // Update timer every 10ms for better precision

    // Resize canvas when window is resized
    window.addEventListener("resize", () => {
        gameUtils.updateCanvasSize();
        gameUtils.centerPlayer();
        gameUtils.updateEnemies();
    });

    // Update player position when window is moved
    appWindow.onMoved(() => {
        gameUtils.centerPlayer();
        gameUtils.updateEnemies();
    });

    document.addEventListener("click", (event) => {
        if (!gameUtils.gameOver || !gameUtils.paused) {
            const angle = Math.atan2(event.clientY - player.y, event.clientX - player.x);
            const velocity = {
                x: Math.cos(angle) * 5,
                y: Math.sin(angle) * 5,
            };
            gameUtils.projectiles.push(new C.Projectile(player.x, player.y, 5, options.playerColor, velocity));
        }
    });

    // Add event listener for the Escape key
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !gameUtils.gameOver) {
            gameUtils.paused ? gameUtils.resume() : gameUtils.pause();
        }
    });

    appWindow.onFocusChanged(({ payload: focused }) => {
        !focused && !gameUtils.paused && !gameUtils.gameOver ? gameUtils.pause() : null;
    });

    gameUtils.animate();
    gameUtils.spawnEnemies()
    gameUtils.shrinkWindow();
}

export { startGame, _resizeWindow, _sendNotification };
