// Logic for handling multiple windows aka "Random Windows"

import { Entity, NGon } from "./classes.js";
import { generateRandomHexColor, canvasToMonitor, monitorToCanvas } from "./functions.js";
const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;
const { currentMonitor, getCurrentWindow } = window.__TAURI__.window;

await invoke('subscribe_sync');
const backgroundColor = localStorage.getItem("transparent") ? "rgba(0, 0, 0, 0)" : "rgb(24, 24, 24)";
document.body.style.setProperty("--background", backgroundColor);

const id = await invoke("get_current_window_id")
const monitor = await currentMonitor();
const screenWidth = monitor.size.width;
const screenHeight = monitor.size.height;
// console.log(`Current monitor size: ${screenWidth}x${screenHeight}`);
let appWindow = await getCurrentWindow();
const outerPos = await appWindow.outerPosition()
// console.log(`Outer position: (${outerPos.x}, ${outerPos.y})`);

const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

let enemies = [];
let paused = false;
let screenMultiplier = localStorage.getItem("screenMultiplier") ? parseFloat(localStorage.getItem("screenMultiplier")) : 1;
let playerColor = localStorage.getItem("playerColor") || "#00ff00"; // Default player color
let animateId;
listen('sync-message', event => {
    try {
        const data = JSON.parse(event.payload)
        // console.log(data);        

        if (data.type === 'paused') {
            paused = data.paused;
        }
    } catch { }
})

// setTimeout(async () => {
//     // Notify all windows to remove this window from their list
//     await invoke("send_sync_message", { msg: JSON.stringify({ type: "window_closed", id: id }) })
//     await invoke("close_window", { id: id })
// }, 5000)


function spawnEnemy(radius = ((Math.random() * (30 - 10) + 4) / screenMultiplier), x = null, y = null, color = getColor(), velocityMultiplier = 0.25) {
    // Randomly determine spawn position, always fully inside the canvas
    if (!x || !y) {
        if (Math.random() < 0.5) {
            // Spawn along left or right, but not at the edge
            x = Math.random() * (canvas.width - 2 * radius) + radius
            y = Math.random() * (canvas.height - 2 * radius) + radius
        } else {
            // Spawn along top or bottom, but not at the edge
            x = Math.random() * (canvas.width - 2 * radius) + radius
            y = Math.random() * (canvas.height - 2 * radius) + radius
        }
    }

    const dest = monitorToCanvas(screenWidth / 2, screenHeight / 2, outerPos);
    // console.log(`Destination position: (${dest.x}, ${dest.y})`);

    // Calculate angle towards the player's current position
    const angle = Math.atan2(dest.y - y, dest.x - x)

    // Set velocity based on the angle
    const velocity = {
        x: Math.cos(angle) * velocityMultiplier,
        y: Math.sin(angle) * velocityMultiplier,
    }
    console.log(`Spawning enemy at (${x}, ${y}) with angle ${angle} and color ${color} and velocity (${velocity.x}, ${velocity.y})`);

    // Spawn the enemy targeting the player
    const enemy = new Entity(x, y, radius, color, velocity)
    // enemy.draw(c);
    enemies.push(enemy);
}

/**
 * Generates a random hex color string.
 * @returns {string} A random hex color string in the format "#RRGGBB".
 */
function getColor() {
    let color;
    do {
        color = generateRandomHexColor()
    } while (color === playerColor)

    return color;
}

async function animate() {
    if (paused) return;
    animateId = requestAnimationFrame(() => animate());
    c.clearRect(0, 0, canvas.width, canvas.height);
    // Update and handle enemies
    for (let index = enemies.length - 1; index >= 0; index--) {
        const enemy = enemies[index];
        enemy.update(c);

        // Check if enemy is off-screen
        if (enemy.x - enemy.radius < 0 || enemy.x + enemy.radius > canvas.width ||
            enemy.y - enemy.radius < 0 || enemy.y + enemy.radius > canvas.height) {
            // Transfer enemy
            const { x, y } = canvasToMonitor(enemy.x, enemy.y, outerPos);

            let newEnemy = enemy;
            newEnemy.x = x;
            newEnemy.y = y;
            await invoke("send_sync_message", {
                msg: JSON.stringify({
                    type: "enemy_transfer",
                    enemy: newEnemy,
                    messageId: `m_${Math.floor(Math.random() * 1e8)}`,
                })
            });

            enemies.splice(index, 1); // Remove off-screen enemy

            if (enemies.length == 0) {
                await invoke("send_sync_message", { msg: JSON.stringify({ type: "window_closed", id: id, messageId: `m_${Math.floor(Math.random() * 1e8)}` }) })
                await invoke("close_window", { id: id })
            }
        }


        // Check for collision between projectiles and enemy
        // for (let projectilesIndex = projectiles.length - 1; projectilesIndex >= 0; projectilesIndex--) {
        //     const projectile = projectiles[projectilesIndex];
        //     const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

        //     // When projectile hits enemy
        //     if (dist - enemy.radius - projectile.radius < 1) {
        //         if (enemy.radius - 10 > 5) {
        //             enemy.radius -= 10;
        //             projectiles.splice(projectilesIndex, 1);
        //         } else {
        //             // Remove enemy if too small
        //             killCount++;
        //             document.querySelector("#killCount").innerHTML = killCount;
        //             enemies.splice(index, 1);
        //             projectiles.splice(projectilesIndex, 1);
        //         }
        //     }
        // }
    }
}

animate();
// spawnEnemy();
// setInterval(() => {
//     if (paused) return;
//     spawnEnemy();
// }, 1000 * Math.random() * 5 + 5000);

enemies.push(new NGon(canvas.width / 2, canvas.height / 2, 50, playerColor, 5));