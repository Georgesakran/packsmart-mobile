export function buildQuickInsightBadges(trip = {}) {
    const badges = [];
  
    const hasResults = !!trip.hasResults || !!trip.has_results;
    const overallFits = trip.overallFits === true || trip.overall_fits === true;
    const checklistStarted =
      trip.checklistStarted === true || trip.checklist_started === true;
    const travelDayConfigured =
      trip.travelDayConfigured === true || trip.travel_day_configured === true;
    const status = (trip.status || "").toLowerCase();
  
    if (status === "archived") {
      badges.push({ label: "Archived", tone: "warning" });
    }
  
    if (hasResults) {
      badges.push({
        label: overallFits ? "Calculated" : "Needs Fix",
        tone: overallFits ? "success" : "danger",
      });
    }
  
    if (checklistStarted) {
      badges.push({ label: "Checklist Active", tone: "info" });
    }
  
    if (travelDayConfigured) {
      badges.push({ label: "Travel Day Ready", tone: "info" });
    }
  
    return badges.slice(0, 3);
  }