export function buildTripActivityInsights(activityHistory = []) {
    const findLatest = (eventType) =>
      activityHistory.find((event) => event.event_type === eventType) || null;
  
    const latestActivity = activityHistory[0] || null;
    const lastCalculated = findLatest("trip_calculated");
    const lastTemplateApplied = findLatest("template_applied");
    const lastChecklistUpdate = findLatest("checklist_updated");
    const lastTravelDayUpdate = findLatest("travel_day_updated");
    const lastSuggestionsGenerated = findLatest("suggestions_generated");
  
    return {
      latestActivity,
      lastCalculated,
      lastTemplateApplied,
      lastChecklistUpdate,
      lastTravelDayUpdate,
      lastSuggestionsGenerated,
    };
  }