/**
 * @class
 * @classdesc Represents a player in the game.
 */
class Player {
    /**
     * Creates a new player.
     * @param {number} x - The x-coordinate of the player.
     * @param {number} y - The y-coordinate of the player.
     * @param {number} radius - The radius of the player.
     * @param {string} color - The color of the player.
	 * @param {Object} velocity - The velocity of the player.
	 * @param {number} velocity.x - The x-component of the velocity.
	 * @param {number} velocity.y - The y-component of the velocity.
     */
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
		this.velocity = velocity || { x: 0, y: 0 };
    }

    /**
     * Draws the player on the canvas.
     * @param {CanvasRenderingContext2D} c - The canvas rendering context.
     */
    draw(c) {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    /**
     * Moves the player to a new position and redraws it.
     * @param {number} x - The new x-coordinate of the player.
     * @param {number} y - The new y-coordinate of the player.
     * @param {CanvasRenderingContext2D} c - The canvas rendering context.
     */
    move(x, y, c) {
        this.x = x;
        this.y = y;
        this.draw(c);
    }

    /**
     * Updates the player's position based on its velocity and redraws it.
     * @param {CanvasRenderingContext2D} c - The canvas rendering context.
     */
    update(c) {
        this.draw(c);
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

/**
 * Represents a projectile in the game.
 */
class Projectile {
    /**
     * Creates a new projectile.
     * @param {number} x - The x-coordinate of the projectile.
     * @param {number} y - The y-coordinate of the projectile.
     * @param {number} radius - The radius of the projectile.
     * @param {string} color - The color of the projectile.
     * @param {Object} velocity - The velocity of the projectile.
     * @param {number} velocity.x - The x-component of the velocity.
     * @param {number} velocity.y - The y-component of the velocity.
     */
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    /**
     * Draws the projectile on the canvas.
     * @param {CanvasRenderingContext2D} c - The canvas rendering context.
     */
    draw(c) {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    /**
     * Updates the position of the projectile and redraws it.
     * @param {CanvasRenderingContext2D} c - The canvas rendering context.
     */
    update(c) {
        this.draw(c);
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

/**
 * This class is used to create a confetti-like effect on the screen.
 * It uses the Anime.js library for animation.
 */
class ParticleSystem {
    constructor() {
        this.container = document.getElementsByTagName("body")[0];
        this.particles = [];
        this.colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"];
    }

    /**
     * Creates a particle element and adds it to the container.
     * @param {number} x - The x-coordinate of the particle.
     * @param {number} y - The y-coordinate of the particle.
     * @return {HTMLElement} The created particle element.
     */
    createParticle(x, y) {
        const particle = document.createElement("div");
        particle.className = "particle";

        // Random color and size
        particle.style.backgroundColor =
            this.colors[Math.floor(Math.random() * this.colors.length)];
        particle.style.width = `${Math.random() * 10 + 10}px`; // Wider rectangles
        particle.style.height = `${Math.random() * 5 + 5}px`; // Taller than wide

        // Make particles rectangular
        particle.style.borderRadius = "0%";

        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        this.container.appendChild(particle);
        this.particles.push(particle);

        return particle;
    }

    /**
     * Explodes particles from a given point on the screen.
     * @param {number} x - The x-coordinate of the explosion.
     * @param {number} y - The y-coordinate of the explosion.
     * @param {number} count - The number of particles to create.
     * @return {void}
     */
    explode(x, y, count = 50) {
        // Create particles
        for (let i = 0; i < count; i++) {
            const particle = this.createParticle(x, y);

            // Physics parameters
            const angle = Math.random() * 45 - 22.5; // Narrower angle for downward motion
            const speed = Math.random() * 3 + 2;

            // Initial velocity
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed + 5; // Extra downward force

            anime({
                targets: particle,
                translateX: [
                    {
                        value: velocityX * 200,
                        duration: 1500,
                        easing: "easeInOutQuad",
                    },
                ],
                translateY: [
                    {
                        value: velocityY * 200,
                        duration: 1500,
                        easing: "easeInQuad", // Accelerates downward
                    },
                ],
                rotate: {
                    value: Math.random() * 360,
                    duration: 1500,
                    easing: "linear",
                    delay: Math.random() * 300, // Random rotation start
                },
                opacity: [
                    { value: 1 },
                    { value: 0, duration: 500, delay: 1200 },
                ],
                complete: () => particle.remove(),
            });
        }
    }

    /**
     * Cleans up the particles by removing them from the DOM.
     * @return {void}
     */
    cleanup() {
        this.particles.forEach((particle) => particle.remove());
        this.particles = [];
    }
}

export { Player, Projectile, ParticleSystem };
