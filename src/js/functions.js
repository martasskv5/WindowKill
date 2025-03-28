import * as C from "./classes.js";
const { currentMonitor, LogicalSize, LogicalPosition } = window.__TAURI__.window;

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
     */
    constructor(appWindow, canvas, player, playerRadius, projectiles, gameOver) {
        this.appWindow = appWindow;
        this.canvas = canvas;
        this.player = player;
        this.playerRadius = playerRadius;
        this.projectiles = projectiles;
        this.gameOver = gameOver;
        this.c = canvas.getContext("2d");
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
        if (this.gameOver) return;

        const currentSize = await this.appWindow.innerSize();
        const decreaseAmount = 3; // Amount to decrease the window size

        let newWidth = currentSize.width - decreaseAmount;
        let newHeight = currentSize.height - decreaseAmount;

        if (newWidth <= this.playerRadius * 2 || newHeight <= this.playerRadius * 2) {
            this.gameOver = true;
            alert("Game Over");
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
        if (this.gameOver) return;

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
            alert("Game Over");
        }
    }
}

/**
 * Helper function for starting the game. Shrinks the window continuously while keeping it centered.
 * @param {Object} appWindow - The Tauri app window object.
 * @param {number} decreaseAmount - The amount to decrease the window size.
 * @param {number} durationMs - The duration of the animation in milliseconds.
 */
async function _shrinkWindow(appWindow, decreaseAmount, durationMs) {
    // Get the initial window size and position
    const startSize = await appWindow.innerSize();
    const startPos = await appWindow.outerPosition();

    // Ensure startSize and startPos are valid
    if (!startSize || !startPos) {
        throw new Error("Failed to retrieve window size or position.");
    }

    // Animate the shrinking process
    const startTime = Date.now();
    return new Promise((resolve) => {
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / durationMs, 1);

            // Calculate new size and position to keep the window centered
            const newWidth = startSize.width - decreaseAmount * progress;
            const newHeight = startSize.height - decreaseAmount * progress;
            const newX = startPos.x + (startSize.width - newWidth) / 2;
            const newY = startPos.y + (startSize.height - newHeight) / 2;

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
 */
async function startGame(appWindow) {
    // Resize the window to 400x400px
    await _shrinkWindow(appWindow, 200, 200, 100);

    const canvas = document.querySelector("canvas");
    const c = canvas.getContext("2d");

    canvas.width = innerWidth;
    canvas.height = innerHeight;

    const playerRadius = 10;
    let playerX = canvas.width / 2;
    let playerY = canvas.height / 2;

    const player = new C.Player(playerX, playerY, playerRadius, "white");
    const projectiles = [];
    let gameOver = false;

    const gameUtils = new GameUtils(appWindow, canvas, player, playerRadius, projectiles, gameOver);

    player.draw(c);
    gameUtils.updateCanvasSize();
    gameUtils.centerPlayer();

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
        projectiles.push(new C.Projectile(player.x, player.y, 5, "white", velocity));
    });
    gameUtils.animate();
    gameUtils.shrinkWindow();
}

export { startGame };
