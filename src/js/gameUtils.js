import { Entity, ParticleSystem } from "./classes.js";
import { _resizeWindow } from "./functions.js";
const { invoke } = window.__TAURI__.core;
const { currentMonitor, getAllWindows, LogicalSize, LogicalPosition } = window.__TAURI__.window;
const { exists, BaseDirectory, readTextFile, writeTextFile } = window.__TAURI__.fs;

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
     * @param {number} highScore - The high score of the game.
     * @param {Array} enemies - The array of enemies.
     * @param {number} killCount - The number of enemies killed.
     * @param {Object} options - The game options object.
     * @param {number} animationFrameId - The ID of the animation frame.
     * @param {number} enemySpawnTimeout - The timeout ID for enemy spawning.
     * @param {number} shrinkInterval - The interval ID for shrinking the window.
     * @param {boolean} paused - The paused state of the game.
     * @param {Array} windows - The array of windows in the game.
     */
    constructor(appWindow, canvas, player, playerRadius, options) {
        this.appWindow = appWindow;
        this.canvas = canvas;
        this.player = player;
        this.playerRadius = playerRadius;
        this.projectiles = [];
        this.gameOver = false;
        this.c = canvas.getContext("2d");
        this.score = 0;
        this.highScore = this.loadScore();
        this.scaleFactor = this.appWindow.scaleFactor();
        this.enemies = [];
        this.killCount = 0;
        this.options = options;
        this.animationFrameId = null;
        this.enemySpawnTimeout = null;
        this.shrinkInterval = null;
        this.paused = false;
        this.windows = [];
    }

    /**
     * Pauses the game, stops animations, and clears intervals.
     */
    async pause() {
        this.paused = true;
        cancelAnimationFrame(this.animationFrameId);
        clearInterval(this.enemySpawnTimeout);
        clearInterval(this.shrinkInterval);
        await invoke("send_sync_message", { msg: JSON.stringify({ type: "paused", value: true }) })
        document.querySelector("#pauseMenu").classList.toggle("hidden");
    }
    
    /**
     * Resumes the game, restarts animations, and spawns enemies.
     */
    async resume() {
        if (this.gameOver) return;
        this.paused = false;
        this.animate();
        this.spawnEnemies();
        this.shrinkWindow();
        await invoke("send_sync_message", { msg: JSON.stringify({ type: "paused", value: false }) })
        document.querySelector("#pauseMenu").classList.toggle("hidden");
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
        console.log(this.scaleFactor);

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
        const increaseAmount = this.options.difficulty.increasePower; // Amount to increase the window size

        let newWidth = currentSize.width;
        let newHeight = currentSize.height;

        if (direction === "left" || direction === "right") {
            newWidth += increaseAmount;
        } else if (direction === "top" || direction === "bottom") {
            newHeight += increaseAmount;
        }

        await this.animateWindowSize(newWidth - currentSize.width, newHeight - currentSize.height, 250, direction);
    }

    /**
     * Shrinks the window continuously.
     * Pauses and resumes correctly, keeping the decreaseAmount value.
     */
    async shrinkWindow() {
        // Only initialize decreaseAmount if not already set (so it doesn't reset on resume)
        if (typeof this.decreaseAmount !== 'number') {
            this.decreaseAmount = this.options.difficulty.decreasePower / this.options.screenMultiplier
        }
        const decreaseMax = this.options.difficulty.decreaseMax / this.options.screenMultiplier
        const decreaseMultiplier = this.options.difficulty.decreaseMultiplier / this.options.screenMultiplier

        const shrink = async () => {
            if (this.gameOver || this.paused) return

            const currentSize = await this.appWindow.innerSize()
            let newWidth = currentSize.width - this.decreaseAmount
            let newHeight = currentSize.height - this.decreaseAmount

            if (newWidth <= this.playerRadius * 2 || newHeight <= this.playerRadius * 2) {
                this.gameOver = true
                this._gameOver(true)
                return
            }

            // Calculate new position to shrink from all sides
            const outerPos = await this.appWindow.outerPosition()
            const newX = outerPos.x + this.decreaseAmount / 2
            const newY = outerPos.y + this.decreaseAmount / 2

            await this.animateWindowSize(-this.decreaseAmount, -this.decreaseAmount, 50, "shrink")
            await this.appWindow.setPosition(new LogicalPosition(newX, newY)).catch(console.error)

            this.decreaseAmount = Math.min(this.decreaseAmount * decreaseMultiplier, decreaseMax) // Decrease the amount for the next iteration

            this.shrinkTimeout = setTimeout(shrink, 50)
        }

        // Clear any previous timeout before starting
        if (this.shrinkTimeout) clearTimeout(this.shrinkTimeout)
        this.shrinkTimeout = setTimeout(shrink, 50)
    }

    /**
     * Animates the game elements.
     */
    animate() {
        if (this.gameOver || this.paused) return;

        this.animationFrameId = requestAnimationFrame(() => this.animate());
        this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.player.draw(this.c);

        // Update and handle projectiles
        this.projectiles.forEach((projectile, projectilesIndex) => {
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
                    this.projectiles.splice(projectilesIndex, 1);
                }, 0);
            }
        });

        // Update and handle enemies
        for (let index = this.enemies.length - 1; index >= 0; index--) {
            const enemy = this.enemies[index];
            enemy.update(this.c);

            // Check for collision between player and enemy
            const dist = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
            if (dist - enemy.radius - this.player.radius < 1) {
                this.gameOver = true;
                this._gameOver(false);
                return;
            }

            // Check for collision between projectiles and enemy
            for (let projectilesIndex = this.projectiles.length - 1; projectilesIndex >= 0; projectilesIndex--) {
                const projectile = this.projectiles[projectilesIndex];
                const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

                // When projectile hits enemy
                if (dist - enemy.radius - projectile.radius < 1) {
                    if (enemy.radius - 10 > 5) {
                        enemy.radius -= 10;
                        this.projectiles.splice(projectilesIndex, 1);
                    } else {
                        // Remove enemy if too small
                        this.killCount++;
                        document.querySelector("#killCount").innerHTML = this.killCount;
                        this.enemies.splice(index, 1);
                        this.projectiles.splice(projectilesIndex, 1);
                    }
                }
            }
        }

        // Check for collisions between player and canvas edges
        if (
            this.player.x - this.player.radius <= 0 ||
            this.player.x + this.player.radius >= this.canvas.width ||
            this.player.y - this.player.radius <= 0 ||
            this.player.y + this.player.radius >= this.canvas.height
        ) {
            this.gameOver = true;
            this._gameOver(true);
        }
    }

    /**
     * Displays the game over message.
     * @param {boolean} canvasCollision - Indicates if the game ended due to a canvas collision.
     */
    async _gameOver(canvasCollision) {
        this.animationFrameId = null;
        this.enemySpawnTimeout = null;
        this.shrinkInterval = null;
        this.paused = false;
        // Define the original size (e.g., 600x600)
        const originalWidth = this.options.newWidth;

        this.windows.forEach(async (id) => {
            // Notify all windows to remove this window from their list
            // await invoke("send_sync_message", { msg: JSON.stringify({ type: "window_closed", id: id }) });
            await invoke("close_window", { id: id });
            this.windows.slice(this.windows.indexOf(id), 1);
        });

        // Get the current monitor and calculate the center position
        const monitor = await currentMonitor();
        if (monitor) {
            const monitorWidth = monitor.size.width;
            const monitorHeight = monitor.size.height;

            // Calculate the new position to center the window
            const newX = (monitorWidth - originalWidth) / 2;
            const newY = (monitorHeight - originalWidth) / 2;

            // Smoothly resize and center the window
            await this.animateWindowSize(
                originalWidth - (await this.appWindow.innerSize()).width,
                originalWidth - (await this.appWindow.innerSize()).height,
                250,
                "center"
            );
            await this.appWindow.setPosition(new LogicalPosition(newX, newY)).catch(console.error);
        }
        console.log(`score: ${this.score}, highScore: ${this.highScore}, killCount: ${this.killCount}`);
        // this.highScore, this.score;

        const score = this.score * Math.round(this.killCount * this.options.difficulty.scoreMultiplier); // 0 kills = 0 score

        document.querySelector("#timer").classList.toggle("hidden"); // Hide the timer display
        document.querySelector("#killCount").classList.toggle("hidden");
        if (score > this.highScore) {
            this.highScore = score;
            await this.saveScore(this.highScore);
            document.querySelector("#score").innerText = `Your new high score is: ${score}`;
            document.querySelector("#gameEnd").getElementsByTagName("h1")[0].innerText = "New High Score!";
            const particleSystem = new ParticleSystem();
            particleSystem.explode(0, 0);
            particleSystem.explode(this.canvas.width, 0);
        } else {
            document.querySelector("#score").innerText = `Your score is: ${score}`;
            document.querySelector("#scoreBest").innerText = `Your best score is: ${this.highScore}`;
        }
        document.querySelector("#gameEnd").classList.toggle("hidden");
        console.log(this.options.achievements.achievements.colorful.current);
        this.options.achievements.handle(canvasCollision, this.player.color, this.killCount, this.score, score);
    }

    /**
     * Saves the score to a file.
     * @param {number} score - The score to save.
     */
    async loadScore() {
        try {
            if (await exists("score", { baseDir: BaseDirectory.AppLocalData })) {
                const data = await readTextFile("score", {
                    baseDir: BaseDirectory.AppLocalData,
                });
                this.highScore = parseInt(data);
            } else {
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
    async saveScore(score) {
        try {
            await writeTextFile("score", score | this.score, {
                baseDir: BaseDirectory.AppLocalData,
            });
        } catch (error) {
            console.error("Error saving options:", error);
        }
    }

    /**
     * Spawns enemies at random intervals and positions, targeting the player.
     * The spawn interval decreases over time to increase difficulty.
     */
    spawnEnemies() {
        if (this.enemySpawnTimeout) clearTimeout(this.enemySpawnTimeout) // Clear any previous timeout

        // Only initialize spawnInterval if not already set (so it doesn't reset on resume)
        if (typeof this.spawnInterval !== 'number') {
            this.spawnInterval = 1000 * this.options.difficulty.enemySpawnSpeed
        }

        const minInterval = this.options.difficulty.enemyMinSpawn
        const intervalDecrement = this.options.difficulty.enemySpawnDecrease

        const spawn = () => {
            if (this.gameOver || this.paused) return // Stop spawning if the game is over or paused

            const radius = ((Math.random() * (30 - 4) + 4) / this.options.screenMultiplier)

            let x, y

            // Randomly determine spawn position (left/right or top/bottom)
            if (Math.random() < 0.5) {
                x = Math.random() < 0.5 ? 0 - radius : this.canvas.width + radius
                y = Math.random() * this.canvas.height
            } else {
                x = Math.random() * this.canvas.width
                y = Math.random() < 0.5 ? 0 - radius : this.canvas.height + radius
            }

            // Generate a random hex color that is not the player's color
            let color
            do {
                color = this.generateRandomHexColor()
            } while (color === this.player.color)

            // Calculate angle towards the player's current position
            const angle = Math.atan2(this.player.y - y, this.player.x - x)

            // Set velocity based on the angle
            const velocity = {
                x: Math.cos(angle),
                y: Math.sin(angle),
            }

            // Spawn the enemy targeting the player
            this.enemies.push(new Entity(x, y, radius, color, velocity))

            // Decrease the spawn interval over time, but don't go below minInterval
            this.spawnInterval = Math.max(this.spawnInterval - intervalDecrement, minInterval)

            // Schedule the next spawn and keep reference to timeout
            this.enemySpawnTimeout = setTimeout(spawn, this.spawnInterval)
        }

        this.enemySpawnTimeout = setTimeout(spawn, this.spawnInterval)
    }

    /**
     * Updates the enemies to target the player.
     */
    updateEnemies() {
        this.enemies.forEach((enemy) => {
            const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
            const velocity = {
                x: Math.cos(angle),
                y: Math.sin(angle),
            };
            enemy.velocity = velocity;
        });
    }

    /**
     * Generates a random hex color string.
     * @returns {string} The generated hex color (e.g., "#ff5733").
     */
    generateRandomHexColor() {
        const randomColor = Math.floor(Math.random() * 16777215).toString(16); // Generate a random number and convert to hex
        return `#${randomColor.padStart(6, "0")}`; // Ensure the hex color is 6 characters long
    }

    /**
     * Spawns a new window at a random position and size, adds its ID to the list,
     * waits 10 seconds, closes the window, and sends a sync message to remove it from the list.
     * Ensures the new window does not overlap with the main window.
     */
    spawnRandomWindow() {
        setInterval(async () => {
            // if (this.windows.length >= 6 || this.gameOver || this.paused) return

            // Calculate overlapping with all existing windows
            const allWindows = await getAllWindows()
            const windowRects = []

            // Gather rectangles for all open windows
            for (let win of allWindows) {
                const pos = await win.outerPosition()
                const size = await win.innerSize()
                windowRects.push({
                    x: pos.x,
                    y: pos.y,
                    w: size.width,
                    h: size.height
                })
            }

            const screenW = window.screen.width
            const screenH = window.screen.height
            const maxAttempts = 20
            let x, y, w, h, tries = 0, overlaps

            do {
                w = Math.floor(Math.random() * 200) + 300
                h = Math.floor(Math.random() * 200) + 300
                x = Math.floor(Math.random() * (screenW - w))
                y = Math.floor(Math.random() * (screenH - h))
                overlaps = windowRects.some(rect =>
                    x < rect.x + rect.w &&
                    x + w > rect.x &&
                    y < rect.y + rect.h &&
                    y + h > rect.y
                )
                tries++
            } while (overlaps && tries < maxAttempts)

            if (overlaps) return // Could not find a non-overlapping spot


            const id = `win_${Math.floor(Math.random() * 1e8)}`

            await invoke('create_window', {
                id,
                url: 'html/canvas.html',
                x,
                y,
                w,
                h,
                title: 'Canvas',
                decorations: false,
                focused: false
            })

            this.windows.push(id)
            // }, Math.random() * 10000 + 5000)
        }, 5000)
    }
}

export { GameUtils };