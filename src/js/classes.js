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
     */
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
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

export { Player, Projectile };
