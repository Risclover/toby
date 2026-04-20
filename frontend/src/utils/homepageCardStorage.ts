// All homepage card open/closed states live in two keys instead of N.
// Shape: { activity: true, "check-ins": false, ... }
const CARD_STATES_KEY = "collapsible-card-states";
// Shape: { "2": true, "7": false, ... }  (tasklist id → completed-section open)
const TASKLIST_COMPLETED_KEY = "collapsible-card-tasklist-completed";

function readObject(key: string): Record<string, boolean> {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        // Guard: stored value could be a boolean/null/array from a bad write or migration
        return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
            ? parsed
            : {};
    } catch {
        return {};
    }
}

function writeObject(key: string, states: Record<string, boolean>): void {
    try {
        localStorage.setItem(key, JSON.stringify(states));
    } catch { /* quota exceeded or SSR — silently skip */ }
}

export function getCardOpen(cardKey: string, defaultOpen = true): boolean {
    const states = readObject(CARD_STATES_KEY);
    return cardKey in states ? states[cardKey] : defaultOpen;
}

export function setCardOpen(cardKey: string, value: boolean): void {
    const states = readObject(CARD_STATES_KEY);
    states[cardKey] = value;
    writeObject(CARD_STATES_KEY, states);
}

export function getTasklistCompletedOpen(tasklistId: number, defaultOpen = true): boolean {
    const states = readObject(TASKLIST_COMPLETED_KEY);
    return String(tasklistId) in states ? states[String(tasklistId)] : defaultOpen;
}

export function setTasklistCompletedOpen(tasklistId: number, value: boolean): void {
    const states = readObject(TASKLIST_COMPLETED_KEY);
    states[String(tasklistId)] = value;
    writeObject(TASKLIST_COMPLETED_KEY, states);
}

/** Call once at app startup to migrate legacy per-key entries and remove them. */
export function migrateCardStates(): void {
    const legacyKeys = ["activity", "check-ins", "daily-habits", "events", "lists", "notice-board"];
    const existing = readObject(CARD_STATES_KEY);
    let changed = false;

    for (const k of legacyKeys) {
        const legacyKey = `homepage-card-${k}`;
        const raw = localStorage.getItem(legacyKey);
        if (raw !== null && !(k in existing)) {
            try {
                existing[k] = JSON.parse(raw);
                changed = true;
            } catch { /* malformed — skip */ }
            localStorage.removeItem(legacyKey);
        }
    }

    // Migrate tasklist-completed-{n} entries
    const tasklist = readObject(TASKLIST_COMPLETED_KEY);
    let tasklistChanged = false;
    for (const key of Object.keys(localStorage)) {
        const match = key.match(/^homepage-card-tasklist-completed-(\d+)$/);
        if (match) {
            const id = match[1];
            const raw = localStorage.getItem(key);
            if (raw !== null && !(id in tasklist)) {
                try {
                    tasklist[id] = JSON.parse(raw);
                    tasklistChanged = true;
                } catch { /* skip */ }
            }
            localStorage.removeItem(key);
        }
    }

    if (changed) writeObject(CARD_STATES_KEY, existing);
    if (tasklistChanged) writeObject(TASKLIST_COMPLETED_KEY, tasklist);
}