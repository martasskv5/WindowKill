import * as C from "./classes.js";
const { currentMonitor, LogicalSize, LogicalPosition } = window.__TAURI__.window;
const { exists, BaseDirectory, readTextFile, writeTextFile, mkdir } = window.__TAURI__.fs;

/**
 * Class containing utility functions for the game.
 */
class GameUtils {
    /**
     * Creates an instance of GameUtils.
     * @param {Object} appWindow - The Tauri app window object.
     * @param {HTMLCanvasElement} canvas - The canvas element.
     * @param {Object} player - The player object.
     * @param {number} playerRadius - The radius of the player.
     * @param {Array} projectiles - The array of projectiles.
     * @param {boolean} gameOver - The game over flag.
     * @param {number} score - The score of the game.
     */
    constructor(appWindow, canvas, player, playerRadius, projectiles, gameOver) {
        this.appWindow = appWindow;
        this.canvas = canvas;
        this.player = player;
        this.playerRadius = playerRadius;
        this.projectiles = projectiles;
        this.gameOver = gameOver;
        this.c = canvas.getContext("2d");
        this.score = 0;
        this.highScore = this.load_score();
        this.isPaused = false; // Nová premenná pre pause
    }

    /**
     * Updates the canvas size based on the window size.
     */
    updateCanvasSize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * Centers the player based on the monitor size and window position.
     */
    async centerPlayer() {
        const monitor = await currentMonitor();
        const windowPosition = await this.appWindow.outerPosition();
        if (monitor) {
            const monitorWidth = monitor.size.width;
            const monitorHeight = monitor.size.height;

            const windowX = windowPosition.x;
            const windowY = windowPosition.y;

            const previousPlayerX = this.player.x;
            const previousPlayerY = this.player.y;

            const playerX = monitorWidth / 2 - windowX;
            const playerY = monitorHeight / 2 - windowY;

            // Clear the old player position
            this.c.clearRect(
                previousPlayerX - this.playerRadius,
                previousPlayerY - this.playerRadius,
                this.playerRadius * 2,
                this.playerRadius * 2
            );

            this.player.move(playerX, playerY, this.c);
        }
    }

    /**
     * Updates the window size smoothly over time.
     * @param {number} increaseWidth - The amount to increase the window width.
     * @param {number} increaseHeight - The amount to increase the window height.
     * @param {number} durationMs - The duration of the animation in milliseconds.
     * @param {string} direction - The direction of the window expansion.
     * @returns {Promise<void>}
     */
    async animateWindowSize(increaseWidth, increaseHeight, durationMs, direction) {
        const startTime = Date.now();
        const startX = await this.appWindow.innerSize();
        const startPos = await this.appWindow.outerPosition();
        const targetWidth = startX.width + increaseWidth;
        const targetHeight = startX.height + increaseHeight;
        const deltaX = targetWidth - startX.width;
        const deltaY = targetHeight - startX.height;

        return new Promise((resolve) => {
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / durationMs, 1);

                // Calculate new size using linear interpolation
                const newWidth = startX.width + deltaX * progress;
                const newHeight = startX.height + deltaY * progress;

                // Calculate new position if expanding to the left or top
                let newX = startPos.x;
                let newY = startPos.y;
                if (direction === "left") {
                    newX = startPos.x - deltaX * progress;
                } else if (direction === "top") {
                    newY = startPos.y - deltaY * progress;
                }

                // Update window size and position
                this.appWindow.setSize(new LogicalSize(newWidth, newHeight)).catch(console.error);
                this.appWindow.setPosition(new LogicalPosition(newX, newY)).catch(console.error);

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
     * Expands the window in the specified direction.
     * @param {string} direction - The direction of the window expansion.
     */
    async expandWindow(direction) {
        const currentSize = await this.appWindow.innerSize();
        const increaseAmount = 20; // Amount to increase the window size

        let newWidth = currentSize.width;
        let newHeight = currentSize.height;

        if (direction === "left" || direction === "right") {
            newWidth += increaseAmount;
        } else if (direction === "top" || direction === "bottom") {
            newHeight += increaseAmount;
        }

        await this.animateWindowSize(newWidth - currentSize.width, newHeight - currentSize.height, 500, direction);
    }

    /**
     * Shrinks the window continuously.
     */
    async shrinkWindow() {
        if (this.gameOver || this.isPaused) return; // Zastaví zmenšovanie, ak je hra v pauze

        const currentSize = await this.appWindow.innerSize();
        const decreaseAmount = 3; // Amount to decrease the window size

        let newWidth = currentSize.width - decreaseAmount;
        let newHeight = currentSize.height - decreaseAmount;

        if (newWidth <= this.playerRadius * 2 || newHeight <= this.playerRadius * 2) {
            this.gameOver = true;
            this._gameOver();
            return;
        }

        // Calculate new position to shrink from all sides
        const newX = (await this.appWindow.outerPosition()).x + decreaseAmount / 2;
        const newY = (await this.appWindow.outerPosition()).y + decreaseAmount / 2;

        await this.animateWindowSize(-decreaseAmount, -decreaseAmount, 100, "shrink");
        await this.appWindow.setPosition(new LogicalPosition(newX, newY)).catch(console.error);

        setTimeout(() => this.shrinkWindow(), 100);
    }

    /**
     * Animates the game elements.
     */
    animate() {
        if (this.gameOver || this.isPaused) return; // Zastaví animáciu, ak je hra v pauze

        requestAnimationFrame(() => this.animate());
        this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.player.draw(this.c);
        this.projectiles.forEach((projectile, index) => {
            projectile.update(this.c);
            if (
                projectile.x + projectile.radius < 0 ||
                projectile.x - projectile.radius > this.canvas.width ||
                projectile.y + projectile.radius < 0 ||
                projectile.y - projectile.radius > this.canvas.height
            ) {
                // Expand window in the direction of the collision
                if (projectile.x + projectile.radius < 0) {
                    this.expandWindow("left");
                } else if (projectile.x - projectile.radius > this.canvas.width) {
                    this.expandWindow("right");
                } else if (projectile.y + projectile.radius < 0) {
                    this.expandWindow("top");
                } else if (projectile.y - projectile.radius > this.canvas.height) {
                    this.expandWindow("bottom");
                }

                setTimeout(() => {
                    this.projectiles.splice(index, 1);
                }, 0);
            }
        });

        // Check for collisions between player and canvas edges
        if (
            this.player.x - this.player.radius <= 0 ||
            this.player.x + this.player.radius >= this.canvas.width ||
            this.player.y - this.player.radius <= 0 ||
            this.player.y + this.player.radius >= this.canvas.height
        ) {
            this.gameOver = true;
            this._gameOver();
        }
    }

    /**
     * Displays the game over message.
     */
    async _gameOver() {
        // Get current window size and position
        const currentSize = await this.appWindow.innerSize();
        // Calculate the new size and position
        const newWidth = 600 - currentSize.width;
        await _resizeWindow(this.appWindow, newWidth, 100);
        console.log(this.score, this.highScore);
        (this.highScore, this.score);
        if (this.score > this.highScore) {
            this.highScore = this.score;
            await this.save_score(this.highScore);
            document.querySelector("#score").innerText = `Your new high score is: ${this.score}`;
            document.querySelector("#gameEnd").getElementsByTagName("h1")[0].innerText = "New High Score!";
        }
        else {
            document.querySelector("#score").innerText = `Your score is: ${this.score}`;
            document.querySelector("#scoreBest").innerText = `Your best score is: ${this.highScore}`;
        }
        document.querySelector("#gameEnd").classList.toggle("hidden");
    }

    /**
     * Saves the score to a file.
     * @param {number} score - The score to save.
     */
    async load_score() {
        try {
            if (await exists("score", { baseDir: BaseDirectory.AppLocalData })) {
                const data = await readTextFile("score", { baseDir: BaseDirectory.AppLocalData });
                this.highScore = parseInt(data);
            }
            else {
                this.highScore = 0; // Default score if file doesn't exist
            }
        } catch (error) {
            console.error("Error loading options:", error);
            this.highScore = 0; // Default score if file doesn't exist
        }
    }

    /**
     * Saves the score to a file.
     * * @param {number} score - The score to save.
     */
    async save_score(score) {
        try {
            await writeTextFile("score", score | this.score, { baseDir: BaseDirectory.AppLocalData });
        } catch (error) {
            console.error("Error saving options:", error);
        }
    }
}

/**
 * Helper function for resizing the window. Can shrink or expand the window while keeping it centered.
 * @param {Object} appWindow - The Tauri app window object.
 * @param {number} sizeChange - The amount to change the window size (positive for expand, negative for shrink).
 * @param {number} durationMs - The duration of the animation in milliseconds.
 * @returns {Promise<void>}
 */
async function _resizeWindow(appWindow, sizeChange, durationMs) {
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
            const newWidth = startSize.width + sizeChange * progress;
            const newHeight = startSize.height + sizeChange * progress;
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
    await _resizeWindow(appWindow, -200, 200);

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
    window.gameUtils = gameUtils; // Uložíme gameUtils do globálnej premennej

    player.draw(c);
    gameUtils.updateCanvasSize();
    gameUtils.centerPlayer();

    // Timer logic
    let startTime = Date.now(); // Record the start time
    const timerInterval = setInterval(() => {
        if (gameUtils.gameOver) {
            clearInterval(timerInterval); // Stop the timer when the game is over
            gameUtils.score = Math.floor((Date.now() - startTime) / 1000); // Calculate score in seconds
            timer.classList.toggle("hidden"); // Hide the timer display
        } else {
            const elapsedTime = Date.now() - startTime; // Calculate elapsed time in milliseconds
            const minutes = Math.floor(elapsedTime / 60000).toString().padStart(2, "0"); // Convert to minutes
            const seconds = Math.floor((elapsedTime % 60000) / 1000).toString().padStart(2, "0"); // Convert to seconds
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

export { startGame };
