export function buildReminderCandidates(trips = []) {
    const reminders = [];
    const now = new Date();
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
  
      const checklistStarted =
        trip.checklistStarted === true || trip.checklist_started === true;
  
      const travelDayConfigured =
        trip.travelDayConfigured === true || trip.travel_day_configured === true;
  
      const daysUntilTrip = getDaysUntilTrip(trip.start_date || trip.startDate);
  
      if (daysUntilTrip === 1) {
        reminders.push({
          id: `trip-${tripId}-tomorrow`,
          tripId,
          title: "Trip is tomorrow",
          body: `${tripName} starts tomorrow. Finish your checklist tonight.`,
          seconds: 5,
          targetScreen: "TripChecklist",
        });
      }
  
      if (daysUntilTrip === 0) {
        reminders.push({
          id: `trip-${tripId}-today`,
          tripId,
          title: "Travel day is today",
          body: `${tripName} starts today. Open travel-day plan now.`,
          seconds: 8,
          targetScreen: "TripTravelDay",
        });
      }
  
      if (bagsCount > 0 && itemsCount > 0 && hasResults && !checklistStarted) {
        reminders.push({
          id: `trip-${tripId}-checklist-reminder`,
          tripId,
          title: "Start your checklist",
          body: `${tripName} is ready. Start packing execution now.`,
          seconds: 12,
          targetScreen: "TripChecklist",
        });
      }
  
      if (
        bagsCount > 0 &&
        itemsCount > 0 &&
        hasResults &&
        checklistStarted &&
        !travelDayConfigured
      ) {
        reminders.push({
          id: `trip-${tripId}-travel-day-reminder`,
          tripId,
          title: "Set travel-day items",
          body: `${tripName} is almost ready. Mark wear-today and accessible items.`,
          seconds: 15,
          targetScreen: "TripTravelDay",
        });
      }
    });
  
    return reminders;
  }