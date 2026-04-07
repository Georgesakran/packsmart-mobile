export function buildHomeInsights(trips = [], notifications = []) {
    const normalizeTrip = (trip) => {
      const bagsCount = Number(trip.bagsCount || trip.bags_count || 0);
      const itemsCount = Number(trip.itemsCount || trip.items_count || 0);
      const hasResults = !!trip.hasResults || !!trip.has_results;
      const overallFits =
        trip.overallFits === true || trip.overall_fits === true;
  
      const checklistStarted =
        trip.checklistStarted === true || trip.checklist_started === true;
  
      const travelDayConfigured =
        trip.travelDayConfigured === true || trip.travel_day_configured === true;
  
      let score = 0;
      if (bagsCount > 0) score += 25;
      if (itemsCount > 0) score += 20;
      if (hasResults) score += 20;
      if (checklistStarted) score += 20;
      if (travelDayConfigured) score += 15;
  
      let nextAction = "Open trip";
      if (bagsCount === 0) nextAction = "Add a bag";
      else if (itemsCount === 0) nextAction = "Add items";
      else if (!hasResults) nextAction = "Calculate trip";
      else if (!overallFits) nextAction = "Fix packing issues";
      else if (!checklistStarted) nextAction = "Start checklist";
      else if (!travelDayConfigured) nextAction = "Set travel-day items";
      else nextAction = "Final review";
  
      return {
        ...trip,
        bagsCount,
        itemsCount,
        hasResults,
        overallFits,
        checklistStarted,
        travelDayConfigured,
        readinessScore: score,
        nextAction,
      };
    };
  
    const normalizedTrips = trips.map(normalizeTrip);
  
    const activeTrips = [...normalizedTrips].sort((a, b) => {
      if (b.readinessScore !== a.readinessScore) {
        return b.readinessScore - a.readinessScore;
      }
      return (a.trip_name || "").localeCompare(b.trip_name || "");
    });
  
    const urgentNotifications = notifications.filter(
      (item) => item.tone === "danger" || item.type === "urgent"
    );
  
    return {
      totalTrips: trips.length,
      totalNotifications: notifications.length,
      urgentNotifications,
      activeTrips,
      topTrip: activeTrips[0] || null,
    };
  }