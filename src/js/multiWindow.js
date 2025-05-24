// Logic for handling multiple windows aka "Random Windows"

const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

const id = await invoke("get_current_window_id")
await invoke('subscribe_sync');

const backgroundColor = localStorage.getItem("transparent") ? "rgba(0, 0, 0, 0)" : "rgb(24, 24, 24)";
document.body.style.setProperty("--background", backgroundColor);

let paused = false;
listen('sync-message', event => {
        try {
            const data = JSON.parse(event.payload)
            
            if (data.type === 'paused') {
                paused = data.paused;
            }
        } catch { }
    })

setTimeout(async () => {
    // Notify all windows to remove this window from their list
    await invoke("send_sync_message", { msg: JSON.stringify({ type: "window_closed", id: id }) })
    await invoke("close_window", { id: id })
}, 10000)