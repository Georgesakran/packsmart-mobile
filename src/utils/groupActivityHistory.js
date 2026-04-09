import { formatActivityDate } from "./activityHistoryFormatter";

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getActivityGroupLabel(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Older";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (isSameDay(target, today)) return "Today";
  if (isSameDay(target, yesterday)) return "Yesterday";

  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function groupActivityHistory(items = []) {
  const groupsMap = new Map();

  items.forEach((item) => {
    const label = getActivityGroupLabel(item.created_at);

    if (!groupsMap.has(label)) {
      groupsMap.set(label, []);
    }

    groupsMap.get(label).push(item);
  });

  return Array.from(groupsMap.entries()).map(([label, events]) => ({
    label,
    events,
  }));
}