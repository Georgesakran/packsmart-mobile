import { isNowInsideQuietHours, shouldIncludeReminderByMode } from "./reminderTiming";

export function buildNotificationsFromTrips(trips = [], preferences = {}) {
  const notifications = [];
  const now = new Date();
  const inQuietHours = isNowInsideQuietHours(preferences);
  const {
    enabled = true,
    checklistReminders = true,
    travelDayReminders = true,
    scheduleReminders = true,
    readyReminders = true,
  } = preferences;
  
  if (!enabled) return [];

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const getDaysUntilTrip = (startDateValue) => {
    if (!startDateValue) return null;

    const tripDate = new Date(startDateValue);
    if (Number.isNaN(tripDate.getTime())) return null;

    const tripDay = new Date(
      tripDate.getFullYear(),
      tripDate.getMonth(),
      tripDate.getDate()
    );

    const diffMs = tripDay.getTime() - startOfToday.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  };

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

    const daysUntilTrip = getDaysUntilTrip(trip.start_date || trip.startDate);

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

    if (checklistReminders && hasResults && overallFits === true && !checklistStarted) {
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

    if (
      travelDayReminders &&
      hasResults &&
      overallFits === true &&
      checklistStarted &&
      !travelDayConfigured) {
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

      if (
        readyReminders &&
        hasResults &&
        overallFits === true &&
        checklistStarted &&
        travelDayConfigured
        ) {
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

    // Time-aware reminders (v1)
    if (scheduleReminders && daysUntilTrip !== null && daysUntilTrip >= 0) {
        if (daysUntilTrip >= 7) {
        notifications.push({
          id: `trip-${tripId}-schedule-plan`,
          tripId,
          type: "schedule",
          tone: "info",
          title: "Start planning early",
          message: `${tripName} is coming up in ${daysUntilTrip} days. This is a good time to build or review the trip setup.`,
          priority: 40,
        });
      }

      if (daysUntilTrip >= 2 && daysUntilTrip <= 6) {
        notifications.push({
          id: `trip-${tripId}-schedule-pack`,
          tripId,
          type: "schedule",
          tone: "warning",
          title: "Packing window is open",
          message: `${tripName} is in ${daysUntilTrip} days. Finalize bags, items, and calculation soon.`,
          priority: 75,
        });
      }

      if (daysUntilTrip === 1) {
        notifications.push({
          id: `trip-${tripId}-schedule-tonight`,
          tripId,
          type: "urgent",
          tone: "danger",
          title: "Final review tonight",
          message: `${tripName} is tomorrow. Finish your checklist and review travel-day items tonight.`,
          priority: 98,
        });
      }

      if (daysUntilTrip === 0) {
        notifications.push({
          id: `trip-${tripId}-schedule-today`,
          tripId,
          type: "urgent",
          tone: "danger",
          title: "Travel day is today",
          message: `${tripName} starts today. Open your travel-day plan and keep essentials accessible.`,
          priority: 110,
        });
      }
    }
  });

  const filtered = notifications.filter((item) => {
    if (inQuietHours && item.type !== "urgent" && item.tone !== "danger") {
      return false;
    }
  
    return shouldIncludeReminderByMode(item, preferences);
  });
  
  return filtered.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.title.localeCompare(b.title);
  });
}