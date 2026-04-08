export function parseTimeToMinutes(value) {
    if (!value || typeof value !== "string" || !value.includes(":")) return null;
  
    const [h, m] = value.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
  
    return h * 60 + m;
  }
  
  export function isNowInsideQuietHours(preferences, now = new Date()) {
    if (!preferences?.quietModeEnabled) return false;
  
    const start = parseTimeToMinutes(preferences?.quietHoursStart);
    const end = parseTimeToMinutes(preferences?.quietHoursEnd);
  
    if (start === null || end === null) return false;
  
    const current = now.getHours() * 60 + now.getMinutes();
  
    // normal daytime range
    if (start < end) {
      return current >= start && current < end;
    }
  
    // overnight range like 22:00 -> 08:00
    return current >= start || current < end;
  }
  
  export function shouldIncludeReminderByMode(reminder, preferences) {
    const mode = preferences?.reminderMode || "normal";
  
    if (mode === "normal") return true;
  
    if (mode === "minimal") {
      return reminder.tone === "danger" || reminder.type === "urgent";
    }
  
    if (mode === "important_only") {
      return (
        reminder.type === "urgent" ||
        reminder.type === "warning" ||
        reminder.tone === "danger"
      );
    }
  
    return true;
  }