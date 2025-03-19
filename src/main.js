import * as C from "./js/classes.js";
import GameUtils from "./js/functions.js";
const { getCurrentWindow } = window.__TAURI__.window;
const { invoke } = window.__TAURI__.core;

window.addEventListener("DOMContentLoaded", async () => {
    let appWindow = await getCurrentWindow();

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
});