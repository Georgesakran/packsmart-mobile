export function getActivityEventMeta(eventType) {
    switch (eventType) {
      case "trip_created":
        return {
          label: "Trip Created",
          tone: "success",
        };
  
      case "trip_duplicated":
        return {
          label: "Trip Duplicated",
          tone: "info",
        };
  
      case "trip_archived":
        return {
          label: "Trip Archived",
          tone: "warning",
        };
  
      case "trip_restored":
        return {
          label: "Trip Restored",
          tone: "success",
        };
  
      case "template_applied":
        return {
          label: "Template Applied",
          tone: "info",
        };
  
      case "template_saved_from_trip":
        return {
          label: "Saved as Template",
          tone: "success",
        };
  
      case "suggestions_generated":
        return {
          label: "Suggestions Generated",
          tone: "info",
        };
  
      case "trip_calculated":
        return {
          label: "Trip Calculated",
          tone: "success",
        };
  
      case "checklist_updated":
        return {
          label: "Checklist Updated",
          tone: "info",
        };
  
      case "travel_day_updated":
        return {
          label: "Travel Day Updated",
          tone: "info",
        };
  
      case "item_added":
        return {
          label: "Item Added",
          tone: "success",
        };
  
      default:
        return {
          label: "Trip Activity",
          tone: "neutral",
        };
    }
  }
  
  export function formatActivityDate(value) {
    if (!value) return "—";
  
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
  
    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }