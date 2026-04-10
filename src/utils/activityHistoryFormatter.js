export function getActivityEventMeta(eventType) {
    switch (eventType) {
      case "trip_created":
        return { label: "Trip Created", tone: "success" };
  
      case "trip_duplicated":
        return { label: "Trip Duplicated", tone: "info" };
  
      case "trip_archived":
        return { label: "Trip Archived", tone: "warning" };
  
      case "trip_restored":
        return { label: "Trip Restored", tone: "success" };
  
      case "template_applied":
        return { label: "Template Applied", tone: "info" };
  
      case "template_saved_from_trip":
        return { label: "Saved as Template", tone: "success" };
  
      case "suggestions_generated":
        return { label: "Suggestions Ready", tone: "info" };
  
      case "trip_calculated":
        return { label: "Calculation Complete", tone: "success" };
  
      case "checklist_updated":
        return { label: "Checklist Updated", tone: "info" };
  
      case "travel_day_updated":
        return { label: "Travel Day Updated", tone: "info" };
  
      case "item_added":
        return { label: "Item Added", tone: "success" };
  
      case "packing_steps_generated":
        return {
          label: "Packing Steps Ready",
          tone: "success",
       };
       
      default:
        return { label: "Trip Activity", tone: "neutral" };
    }
  }

  export function prettifyActivityDetails(details = "") {
    return details
      .replace(/wear_on_travel_day/g, "wear on travel day")
      .replace(/keep_accessible/g, "keep accessible")
      .replace(/skip/g, "skip")
      .replace(/packed/g, "packed")
      .replace(/pending/g, "pending");
  }