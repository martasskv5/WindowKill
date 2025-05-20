import { _sendNotification } from "./functions.js";
const { availableMonitors } = window.__TAURI__.window
const { exists, BaseDirectory, readTextFile, writeTextFile, mkdir } = window.__TAURI__.fs;

/**
 * Options class to manage game settings
 * such as difficulty, volume, and player color.
 * This class handles loading, saving, and updating options from a JSON file.
 * It uses the Tauri API to read and write files in the local data directory.
 * The options are stored in a JSON file named "options.json" in the local data directory.
 * The default options are:
 * - difficulty: "normal"
 * - volume: 0.5
 * - playerColor: "ffffff"
 * The options can be loaded from the file, saved to the file, and updated with new values.
 * The options are loaded when the game starts and saved when the user changes them.
 * The options can be accessed and modified through the class methods.
 * The class uses the Tauri API to read and write files in the local data directory.
 * The class is designed to be used in a Tauri application.
 * The class is exported for use in other modules.
 */
class Options {
    /**
     * Constructor for the Options class.
     * Initializes default options and sets up the config file path.
     * @constructor
     * @param {string} config - The path to the config file.
     * @param {number} defaultWidth - The default width of the game window.
     * @param {number} screenMultiplier - The multiplier for the screen size.
     * @param {number} newWidth - The new width of the game window.
     * @param {Difficulties} difficulty - The difficulty settings for the game.
     * @param {Achievements} achievements - The achievements settings for the game.
     * @param {string} volume - The volume level for the game.
     * @param {string} playerColor - The color of the player.
     */
    constructor() {
        // Default options
        this.difficulty = new Difficulties();
        this.achievements = new Achievements();
        this.volume = "50";
        this.playerColor = "#ffffff";
        this.config = "options.json";
        this.defaultWidth = 600;
        this.screenMultiplier = 1;
        this.newWidth = 600;
    }

    /**
     * Initialize the options by setting up the config file path
     * Must be called before any other methods
     * @returns {Promise<void>}
     */
    async initialize() {
        // Create the WindowKill directory if it doesn't exist
        if (!(await exists("", { baseDir: BaseDirectory.AppLocalData }))) {
            await mkdir("", { baseDir: BaseDirectory.AppLocalData, recursive: true });
        }
        // await mkdir("WindowKill", { baseDir: BaseDirectory.AppLocalData, recursive: true });

        await this.loadOptions();
    }

    /**
     * Load options from the config file
     * @returns {Promise<void>}
     */
    async loadOptions() {
        try {
            if (await exists(this.config, { baseDir: BaseDirectory.AppLocalData })) {
                const data = await readTextFile(this.config, { baseDir: BaseDirectory.AppLocalData });
                const options = JSON.parse(data);
                console.log(options);
                this.difficulty.setDifficulty(options.difficulty || this.difficulty.difficulty);
                this.volume = options.volume || this.volume;
                this.playerColor = options.playerColor || this.playerColor;

                // Update the UI with loaded options
                document.querySelector("#difficulty").value = this.difficulty.difficulty;
                document.querySelector("#volume").value = this.volume;
                document.querySelector("#volumeValue").innerHTML = this.volume;
                document.querySelector("#playerColor").value = this.playerColor;
            } else {
                // Create default options file if it doesn't exist
                await this.saveOptions();
            }
        } catch (error) {
            console.error("Error loading options:", error);
            // On error, use defaults and try to save them
            await this.saveOptions();
        }
    }

    /**
     * Save options to the config file
     * @returns {Promise<void>}
     */
    async saveOptions() {
        const options = {
            difficulty: this.difficulty.difficulty,
            volume: this.volume,
            playerColor: this.playerColor,
        };
        const data = JSON.stringify(options, null, 4);

        try {
            await writeTextFile(this.config, data, { baseDir: BaseDirectory.AppLocalData });
        } catch (error) {
            console.error("Error saving options:", error);
        }
    }

    /**
     * Update options with new values
     * @param {Object} newOptions - New options to apply
     * @returns {Promise<void>}
     */
    async updateOptions(newOptions) {
        this.difficulty.setDifficulty(newOptions.difficulty || this.difficulty.difficulty);
        this.volume = newOptions.volume || this.volume;
        this.playerColor = newOptions.playerColor || this.playerColor;
        await this.saveOptions();
    }

    /**
     * Check if there are unsaved changes in the options
     * Compares current form values with saved options
     * @returns {boolean} True if there are unsaved changes, false otherwise
     */
    unsavedChanges() {
        // Get current form values
        const formDifficulty = document.querySelector("#difficulty")?.value;
        const formVolume = document.querySelector("#volume")?.value;
        const formPlayerColor = document.querySelector("#playerColor")?.value;

        // Compare with saved options
        if (formDifficulty !== this.difficulty.difficulty) return true;
        if (formVolume !== String(this.volume)) return true;
        if (formPlayerColor !== this.playerColor) return true;

        // No changes detected
        return false;
    }
}

/**
 * Class to manage game difficulty settings.
 * Handles initialization and updates of difficulty levels.
 */
class Difficulties {
    /**
     * Constructor for the Difficulties class.
     * Initializes default difficulty settings and sets up the difficulty levels.
     * @constructor
     * @param {string} difficulty - The current difficulty level.
     * @param {Object} difficulties - The available difficulty levels and their settings.
     * @param {number} increasePower - The power increase for the current difficulty.
     * @param {number} decreasePower - The power decrease for the current difficulty.
     * @param {number} decreaseMax - The maximum power decrease for the current difficulty.
     * @param {number} decreaseMultiplier - The multiplier for the power decrease.
     * @param {number} enemySpawnSpeed - The speed of enemy spawn for the current difficulty.
     * @param {number} enemyMinSpawn - The minimum spawn time for enemies.
     * @param {number} enemySpawnDecrease - The amount to decrease the spawn time.
     * @param {number} scoreMultiplier - The score multiplier for the current difficulty.
     * @param {boolean} transparent - Whether the background is transparent for the current difficulty.
     */
    constructor() {
        this.difficulty = "normal"; // Default difficulty
        this.difficulties = {
            normal: {
                increasePower: 20,
                decreasePower: 2,
                decreaseMax: 6,
                decreaseMultiplier: 1.1,
                enemySpawnSpeed: 1,
                enemyMinSpawn: 750,
                enemySpawnDecrease: 10,
                scoreMultiplier: 0.5,
                transparent: false,
                timeMultiplier: 1.5,
            },
            impossible: {
                increasePower: 30,
                decreasePower: 3,
                decreaseMax: 10,
                decreaseMultiplier: 1.3,
                enemySpawnSpeed: 0.75,
                enemyMinSpawn: 500,
                enemySpawnDecrease: 30,
                scoreMultiplier: 2,
                transparent: true,
                timeMultiplier: 1.7,
            },
        };
        this.updateDifficulty(); // Initialize with default difficulty
    }

    /**
     * Updates the current difficulty settings based on the selected difficulty.
     */
    updateDifficulty() {
        const currentSettings = this.difficulties[this.difficulty];
        Object.assign(this, currentSettings); // Dynamically copy properties

        // Update the background color based on transparency
        const backgroundColor = currentSettings.transparent ? "rgba(0, 0, 0, 0)" : "#303030";
        document.body.style.setProperty("--background-color", backgroundColor);
    }

    /**
     * Sets a new difficulty level and updates settings.
     * @param {string} newDifficulty - The new difficulty level to set.
     */
    setDifficulty(newDifficulty) {
        if (this.difficulties[newDifficulty]) {
            this.difficulty = newDifficulty;
            this.updateDifficulty();
        } else {
            console.error(`Invalid difficulty: ${newDifficulty}`);
        }
    }

    /**
     * Gets the current difficulty settings.
     * @returns {Object} The current difficulty settings.
     */
    getCurrentSettings() {
        return this.difficulties[this.difficulty];
    }
}

/**
 * Class to manage achievements.
 * Handles loading, saving, updating, and unlocking achievements.
 */
class Achievements {
    /**
     * Constructor for the Achievements class.
     * Initializes default achievements and sets up the achievements file path.
     * @constructor
     * @param {string} file - The path to the achievements file.
     * @param {string} schema - The URL of the achievements schema.
     */
    constructor() {
        this.file = 'achievements.json'
        this.schema = "https://raw.githubusercontent.com/Openlab-2-2023/WindowKill/refs/heads/achievements/achievements_schema.json"
        this.achievements = {}
        this.load()
    }

    /**
     * Loads achievements from file.
     * @returns {Promise<void>}
     */
    async load() {
        if (await exists(this.file, { baseDir: BaseDirectory.AppLocalData })) {
            const data = await readTextFile(this.file, { baseDir: BaseDirectory.AppLocalData })
            this.achievements = JSON.parse(data)

            // Normalize: ensure all .current fields that should be arrays are arrays
            for (const key in this.achievements) {
                const ach = this.achievements[key]
                if (Array.isArray(ach.required)) {
                    if (!Array.isArray(ach.current)) ach.current = ach.current ? [ach.current] : []
                }
            }
            console.log(this.achievements);
            

        } else {
            // Download the schema file from the URL
            const response = await fetch(this.schema)
            if (!response.ok) {
                throw new Error(`Failed to fetch schema: ${response.statusText}`);
            }
            const data = await response.json()
            this.achievements = data
            // Save the downloaded schema to the local file
            await writeTextFile(this.file, JSON.stringify(data, null, 4), { baseDir: BaseDirectory.AppLocalData })
        }
    }

    /**
     * Saves achievements to file.
     * @returns {Promise<void>}
     */
    async save() {
        const data = JSON.stringify(this.achievements, null, 4)
        // console.log('Saving achievements:', data)
        await writeTextFile(this.file, data, { baseDir: BaseDirectory.AppLocalData })
    }

    /**
     * Updates progress for an achievement.
     * @param {string} key - Achievement key
     * @param {any} value - New progress value
     */
    async update(key, value) {
        if (!this.achievements[key]) return
        this.achievements[key].current = value
        if (this.achievements[key].required !== null && value >= this.achievements[key].required) {
            this.achievements[key].unlocked = true
        }
        await this.save()
    }

    /**
     * Unlocks an achievement directly.
     * @param {string} key - Achievement key
     */
    async unlock(key) {
        if (!this.achievements[key]) return
        this.achievements[key].unlocked = true
        _sendNotification("Achievement Unlocked", this.achievements[key].name)
        await this.save()
    }

    /**
     * Handles achievement progress based on game events.
     * @param {boolean} noSpace - Indicates if there is no space
     * @param {string} playerColor - Player color
     * @param {number} kills - Number of kills
     * @param {number} time - Time survived
     * @param {number} score - Score achieved
     * @returns {Promise<void>}
     */
    async handle(noSpace, playerColor, kills, time, score) {
        console.log("Saving achievements:", this.achievements);
        console.log("Player color:", playerColor);

        // openWorld
        const monitors = await availableMonitors();
        if (
            monitors.length > this.achievements["openWorld"].current
            && !this.achievements["openWorld"].unlocked
        ) {
            this.update("openWorld", monitors.length);
        }

        // noSpace
        noSpace ? this.unlock("noSpace") : null;

        // colorful
        if (
            this.achievements["colorful"].required.includes(playerColor) // Check if the player color is in the required colors
            && !this.achievements["colorful"].current.includes(playerColor) // Check if the player color is not already in the current colors
            && !this.achievements["colorful"].unlocked // Check if the achievement is not already unlocked
        ) {
            this.achievements["colorful"].current.push(playerColor);
            this.update("colorful", this.achievements["colorful"].current); // Update the achievement progress
        }

        // godOfColors
        console.log(this.achievements["godOfColors"].current.includes(playerColor));

        if (
            !this.achievements["godOfColors"].current.includes(playerColor) // Check if the player color is not already in the current colors
            && this.achievements["godOfColors"].current.length != this.achievements["godOfColors"].required // Check if the current colors length is not equal to the required colors length
            && !this.achievements["godOfColors"].unlocked // Check if the achievement is not already unlocked
        ) {
            this.achievements["godOfColors"].current.push(playerColor);
            this.update("godOfColors", this.achievements["godOfColors"].current); // Update the achievement progress
        }

        // killE
        const killE = ["kill100e", "kill1000e"]
        killE.forEach((key) => {
            if (
                this.achievements[key].required > this.achievements[key].current // Check if the required kills are greater than the current kills
                && kills > this.achievements[key].current // Check if the kills are greater than or equal to the required kills
                && !this.achievements[key].unlocked // Check if the achievement is not already unlocked
            ) {
                this.achievements[key].current = kills; // Increment the current kills
                this.update(key, this.achievements[key].current); // Update the achievement progress
            }
        })

        // surviveM
        const surviveM = ["survive1m", "survive5m", "survive10m", "survive20m"]
        surviveM.forEach((key) => {
            if (
                this.achievements[key].required > this.achievements[key].current // Check if the required time is greater than the current time
                && time > this.achievements[key].current // Check if the time is greater than or equal to the required time
                && !this.achievements[key].unlocked // Check if the achievement is not already unlocked
            ) {
                this.achievements[key].current = time; // Increment the current time
                this.update(key, this.achievements[key].current); // Update the achievement progress
            }
        })

        // scoreP
        const scoreP = ["score1000", "score5000", "score10000"]
        scoreP.forEach((key) => {
            if (
                this.achievements[key].required > this.achievements[key].current // Check if the required score is greater than the current score
                && score > this.achievements[key].current // Check if the score is greater than or equal to the required score
                && !this.achievements[key].unlocked // Check if the achievement is not already unlocked
            ) {
                this.achievements[key].current = score; // Increment the current score
                this.update(key, this.achievements[key].current); // Update the achievement progress
            }
        })

        localStorage.setItem("achievements", JSON.stringify(this.achievements)); // Save achievements to local storage
    }
}


export { Options };
