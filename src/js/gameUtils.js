import * as C from "./classes.js";
import { _resizeWindow } from "./functions.js";
const { currentMonitor, LogicalSize, LogicalPosition } =
    window.__TAURI__.window;
const { exists, BaseDirectory, readTextFile, writeTextFile } =
    window.__TAURI__.fs;

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
     */
    constructor(
        appWindow,
        canvas,
        player,
        playerRadius,
        projectiles,
        gameOver,
        enemies
    ) {
        this.appWindow = appWindow;
        this.canvas = canvas;
        this.player = player;
        this.playerRadius = playerRadius;
        this.projectiles = projectiles;
        this.gameOver = gameOver;
        this.c = canvas.getContext("2d");
        this.score = 0;
        this.highScore = this.load_score();
        this.scaleFactor = this.appWindow.scaleFactor();
        this.enemies = enemies;
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
    async animateWindowSize(
        increaseWidth,
        increaseHeight,
        durationMs,
        direction
    ) {
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
                this.appWindow
                    .setSize(new LogicalSize(newWidth, newHeight))
                    .catch(console.error);
                this.appWindow
                    .setPosition(new LogicalPosition(newX, newY))
                    .catch(console.error);

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

        await this.animateWindowSize(
            newWidth - currentSize.width,
            newHeight - currentSize.height,
            500,
            direction
        );
    }

    /**
     * Shrinks the window continuously.
     */
    async shrinkWindow() {
        if (this.gameOver) return;

        const currentSize = await this.appWindow.innerSize();
        const decreaseAmount = 3; // Amount to decrease the window size

        let newWidth = currentSize.width - decreaseAmount;
        let newHeight = currentSize.height - decreaseAmount;

        if (
            newWidth <= this.playerRadius * 2 ||
            newHeight <= this.playerRadius * 2
        ) {
            this.gameOver = true;
            this._gameOver();
            return;
        }

        // Calculate new position to shrink from all sides
        const newX =
            (await this.appWindow.outerPosition()).x + decreaseAmount / 2;
        const newY =
            (await this.appWindow.outerPosition()).y + decreaseAmount / 2;

        await this.animateWindowSize(
            -decreaseAmount,
            -decreaseAmount,
            100,
            "shrink"
        );
        // await this.appWindow.setPosition(new LogicalPosition(newX, newY)).catch(console.error);

        setTimeout(() => this.shrinkWindow(), 100);
    }

    /**
     * Animates the game elements.
     */
        animate() {
        if (this.gameOver) return;
    
        requestAnimationFrame(() => this.animate());
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
                this._gameOver();
                return;
            }
    
            // Check for collision between projectiles and enemy
            for (let projectilesIndex = this.projectiles.length - 1; projectilesIndex >= 0; projectilesIndex--) {
                const projectile = this.projectiles[projectilesIndex];
                const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
    
                // When projectile hits enemy
                if (dist - enemy.radius - projectile.radius < 1) {
                    if (enemy.radius - 10 > 5) {
                        this.score += 100;
                        document.querySelector("#score").innerHTML = this.score;
                        enemy.radius -= 10;
                        this.projectiles.splice(projectilesIndex, 1);
                    } else {
                        // Remove enemy if too small
                        this.score += 150;
                        document.querySelector("#score").innerHTML = this.score;
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
        const newHeight = 600 - currentSize.height;
        await _resizeWindow(this.appWindow, newWidth, newHeight, 100);
        console.log(this.score, this.highScore);
        this.highScore, this.score;
        document.querySelector("#timer").classList.toggle("hidden"); // Hide the timer display
        if (this.score > this.highScore) {
            this.highScore = this.score;
            await this.save_score(this.highScore);
            document.querySelector(
                "#score"
            ).innerText = `Your new high score is: ${this.score}`;
            document
                .querySelector("#gameEnd")
                .getElementsByTagName("h1")[0].innerText = "New High Score!";
            const particleSystem = new C.ParticleSystem();
            particleSystem.explode(0, 0);
            particleSystem.explode(this.canvas.width, 0);
        } else {
            document.querySelector(
                "#score"
            ).innerText = `Your score is: ${this.score}`;
            document.querySelector(
                "#scoreBest"
            ).innerText = `Your best score is: ${this.highScore}`;
        }
        document.querySelector("#gameEnd").classList.toggle("hidden");
    }

    /**
     * Saves the score to a file.
     * @param {number} score - The score to save.
     */
    async load_score() {
        try {
            if (
                await exists("score", { baseDir: BaseDirectory.AppLocalData })
            ) {
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
    async save_score(score) {
        try {
            await writeTextFile("score", score | this.score, {
                baseDir: BaseDirectory.AppLocalData,
            });
        } catch (error) {
            console.error("Error saving options:", error);
        }
    }

    /**
     * Spawns enemies at random intervals and positions.
     */
    spawnEnemies() {
        setInterval(() => {
            const radius = Math.random() * (30 - 4) + 4;

            let x;
            let y;

            if (Math.random() < 0.5) {
                x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
                y = Math.random() * canvas.height;
            } else {
                x = Math.random() * canvas.width;
                y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
            }

            const color = `hsl(${Math.random() * 360}, 50%, 50%)`;

            const angle = Math.atan2(
                canvas.height / 2 - y,
                canvas.width / 2 - x
            );

            const velocity = {
                x: Math.cos(angle),
                y: Math.sin(angle),
            };

            this.enemies.push(new Enemy(x, y, radius, color, velocity));
        }, 1000);
    }
}

export { GameUtils };
