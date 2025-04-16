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
    constructor() {
        // Default options
        this.difficulty = "easy";
        this.volume = "50";
        this.playerColor = "#ffffff";
        this.config = "options.json";
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
                this.difficulty = options.difficulty || this.difficulty;
                this.volume = options.volume || this.volume;
                this.playerColor = options.playerColor || this.playerColor;

                // Update the UI with loaded options
                document.querySelector("#difficulty").value = this.difficulty;
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
            difficulty: this.difficulty,
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
        this.difficulty = newOptions.difficulty || this.difficulty;
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
        if (formDifficulty !== this.difficulty) return true;
        if (formVolume !== String(this.volume)) return true;
        if (formPlayerColor !== this.playerColor) return true;

        // No changes detected
        return false;
    }
}

export { Options };
