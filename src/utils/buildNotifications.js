export function buildNotificationsFromTrips(trips = []) {
  const notifications = [];

  trips.forEach((trip) => {
    const tripId = trip.id;
    const tripName = trip.trip_name || "Unnamed Trip";

    const bagsCount = Number(trip.bagsCount || trip.bags_count || 0);
    const itemsCount = Number(trip.itemsCount || trip.items_count || 0);
    const hasResults = !!trip.hasResults || !!trip.has_results;
    const overallFits =
      trip.overallFits === true || trip.overall_fits === true;

    const checklistStarted =
      trip.checklistStarted === true || trip.checklist_started === true;

    const travelDayConfigured =
      trip.travelDayConfigured === true || trip.travel_day_configured === true;

    if (bagsCount === 0) {
      notifications.push({
        id: `trip-${tripId}-bags`,
        tripId,
        type: "setup",
        tone: "danger",
        title: "Add a bag",
        message: `${tripName} still has no bags configured.`,
        priority: 100,
      });
    }

    if (itemsCount === 0) {
      notifications.push({
        id: `trip-${tripId}-items`,
        tripId,
        type: "setup",
        tone: "warning",
        title: "Add items",
        message: `${tripName} does not have any items yet.`,
        priority: 90,
      });
    }

    if (bagsCount > 0 && itemsCount > 0 && !hasResults) {
      notifications.push({
        id: `trip-${tripId}-calculate`,
        tripId,
        type: "action",
        tone: "info",
        title: "Calculate trip",
        message: `${tripName} is ready for calculation.`,
        priority: 80,
      });
    }

    if (hasResults && overallFits === false) {
      notifications.push({
        id: `trip-${tripId}-fix`,
        tripId,
        type: "warning",
        tone: "danger",
        title: "Trip needs adjustment",
        message: `${tripName} currently does not fit well and needs review.`,
        priority: 95,
      });
    }

    if (hasResults && overallFits === true && !checklistStarted) {
      notifications.push({
        id: `trip-${tripId}-checklist`,
        tripId,
        type: "progress",
        tone: "warning",
        title: "Start checklist",
        message: `${tripName} looks good. Start the packing checklist.`,
        priority: 70,
      });
    }

    if (hasResults && overallFits === true && checklistStarted && !travelDayConfigured) {
      notifications.push({
        id: `trip-${tripId}-travelday`,
        tripId,
        type: "travel-day",
        tone: "info",
        title: "Set travel-day items",
        message: `${tripName} is almost ready. Mark what to wear or keep accessible.`,
        priority: 60,
      });
    }

    if (hasResults && overallFits === true && checklistStarted && travelDayConfigured) {
      notifications.push({
        id: `trip-${tripId}-ready`,
        tripId,
        type: "ready",
        tone: "success",
        title: "Trip looks ready",
        message: `${tripName} is in a strong state for travel.`,
        priority: 20,
      });
    }
  });

  return notifications.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.title.localeCompare(b.title);
  });
}