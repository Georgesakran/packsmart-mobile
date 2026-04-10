import client from "./client";

export const getTrips = async () => {
  const response = await client.get("/trips");
  return response.data.data;
};

export const getTripById = async (tripId) => {
  const response = await client.get(`/trips/${tripId}`);
  return response.data.data;
};

export const getTripSuitcases = async (tripId) => {
  const response = await client.get(`/trips/${tripId}/suitcases`);
  return response.data.data;
};

export const getTripItems = async (tripId) => {
  const response = await client.get(`/trips/${tripId}/items`);
  return response.data.data;
};

export const getTripChecklistSummary = async (tripId) => {
  const response = await client.get(`/trips/${tripId}/checklist-summary`);
  return response.data.data;
};

export const updateTripItemPackingStatus = async (tripId, itemId, packingStatus) => {
  const response = await client.put(
    `/trips/${tripId}/items/${itemId}/packing-status`,
    { packingStatus }
  );
  return response.data.data;
};

export const getTripTravelDaySummary = async (tripId) => {
  const response = await client.get(`/trips/${tripId}/travel-day-summary`);
  return response.data.data;
};

export const updateTripItemTravelDayMode = async (tripId, itemId, travelDayMode) => {
  const response = await client.put(
    `/trips/${tripId}/items/${itemId}/travel-day-mode`,
    { travelDayMode }
  );
  return response.data.data;
};

export const createTrip = async (payload) => {
  const response = await client.post("/trips", payload);
  return response?.data?.data ?? response?.data;
};

export const generateTripSuggestions = async (tripId) => {
  const response = await client.post(`/trips/${tripId}/generate-suggestions`, {});
  return response.data.data;
};

export const createTripBag = async (
  tripId,
  {
    suitcaseType,
    name,
    volumeCm3,
    maxWeightKg,
    lengthCm,
    widthCm,
    heightCm,
    isCustom,
    bagRole,
    isPrimary,
  }
) => {
  const response = await client.post(`/trips/${tripId}/suitcases`, {
    suitcaseType,
    name,
    volumeCm3,
    maxWeightKg,
    lengthCm,
    widthCm,
    heightCm,
    isCustom,
    bagRole,
    isPrimary,
  });

  return response.data.data;
};

export const createTripItem = async (tripId, payload) => {
  const response = await client.post(`/trips/${tripId}/items`, payload);
  return response?.data?.data ?? response?.data;
};

export const getPackingTemplates = async () => {
  const response = await client.get("/packing-templates");
  return response.data.data;
};

export const applyTemplateToTrip = async (
  tripId,
  templateId,
  { replaceExistingItems = false } = {}
) => {
  const response = await client.post(
    `/packing-templates/apply/${templateId}/trips/${tripId}`,
    { replaceExistingItems }
  );

  return response.data.data;
};

export const updateTripBag = async (
  tripId,
  bagId,
  {
    suitcaseType,
    name,
    volumeCm3,
    maxWeightKg,
    lengthCm,
    widthCm,
    heightCm,
    isCustom,
    bagRole,
    isPrimary,
  }
) => {
  const response = await client.put(`/trips/${tripId}/suitcases/${bagId}`, {
    suitcaseType,
    name,
    volumeCm3,
    maxWeightKg,
    lengthCm,
    widthCm,
    heightCm,
    isCustom,
    bagRole,
    isPrimary,
  });

  return response.data.data;
};

export const deleteTripBag = async (tripId, bagId) => {
  const response = await client.delete(`/trips/${tripId}/suitcases/${bagId}`);
  return response.data.data;
};

export const updateTripItem = async (
  tripId,
  itemId,
  {
    customName,
    quantity,
    category,
    sizeCode,
    packBehavior,
    baseVolumeCm3,
    baseWeightG,
    assignedBagId,
  }
) => {
  const response = await client.put(`/trips/${tripId}/items/${itemId}`, {
    sourceType: "custom",
    customName,
    quantity,
    category,
    sizeCode,
    packBehavior,
    baseVolumeCm3,
    baseWeightG,
    assignedBagId,
  });

  return response.data.data;
};

export const deleteTripItem = async (tripId, itemId) => {
  const response = await client.delete(`/trips/${tripId}/items/${itemId}`);
  return response.data.data;
};

export const getPackingTemplateById = async (templateId) => {
  const response = await client.get(`/packing-templates/${templateId}`);
  return response.data.data;
};

export const createPackingTemplate = async (payload) => {
  const response = await client.post("/packing-templates", payload);
  return response.data.data;
};

export const updatePackingTemplate = async (templateId, payload) => {
  const response = await client.put(`/packing-templates/${templateId}`, payload);
  return response.data.data;
};

export const deletePackingTemplate = async (templateId) => {
  const response = await client.delete(`/packing-templates/${templateId}`);
  return response.data.data;
};

export const saveTripAsTemplate = async (tripId, payload) => {
  const response = await client.post(`/packing-templates/from-trip/${tripId}`, payload);
  return response.data.data;
};

export const duplicateTrip = async (tripId) => {
  const response = await client.post(`/trips/${tripId}/duplicate`);
  return response.data.data;
};

export const archiveTrip = async (tripId) => {
  const response = await client.put(`/trips/${tripId}/archive`);
  return response.data.data;
};

export const unarchiveTrip = async (tripId) => {
  const response = await client.put(`/trips/${tripId}/unarchive`);
  return response.data.data;
};

export const deleteTrip = async (tripId) => {
  const response = await client.delete(`/trips/${tripId}`);
  return response.data.data;
};

export const bulkDeleteTrips = async (tripIds = []) => {
  const response = await client.post("/trips/bulk-delete", { tripIds });
  return response.data.data;
};

export const bulkArchiveTrips = async (tripIds = []) => {
  const response = await client.post("/trips/bulk-archive", { tripIds });
  return response.data.data;
};

export const bulkUnarchiveTrips = async (tripIds = []) => {
  const response = await client.post("/trips/bulk-unarchive", { tripIds });
  return response.data.data;
};

export const bulkDeletePackingTemplates = async (templateIds = []) => {
  const response = await client.post("/packing-templates/bulk-delete", {
    templateIds,
  });
  return response.data.data;
};

export const getTripActivityHistory = async (tripId) => {
  const response = await client.get(`/trips/${tripId}/activity-history`);
  return response.data.data;
};

export const getAirlines = async () => {
  const response = await client.get("/airlines");
  return response?.data?.data ?? response?.data;
};

export const getBagCatalog = async () => {
  const response = await client.get("/bags/catalog");
  return response?.data?.data ?? response?.data;
};

export const getAirlineBaggageRules = async (airlineId) => {
  const response = await client.get(`/airlines/${airlineId}/baggage-rules`);
  return response?.data?.data ?? response?.data;
};

export const recommendBagsForTrip = async (tripId) => {
  const response = await client.get(`/trips/${tripId}/recommend-bags`);
  return response?.data?.data ?? response?.data;
};

export const saveSelectedTripBags = async (tripId, selectedBags) => {
  const response = await client.post(`/trips/${tripId}/selected-bags`, {
    selectedBags,
  });
  return response?.data?.data ?? response?.data;
};

export const getSelectedTripBags = async (tripId) => {
  const response = await client.get(`/trips/${tripId}/selected-bags`);
  return response?.data?.data ?? response?.data;
};

export const getSuggestedItemsForTrip = async (tripId) => {
  const response = await client.get(`/trips/${tripId}/suggested-items`);
  return response?.data?.data ?? response?.data;
};

export const applySuggestedItemsToTrip = async (
  tripId,
  items,
  replaceExisting = true
) => {
  const response = await client.post(`/trips/${tripId}/apply-suggested-items`, {
    items,
    replaceExisting,
  });
  return response?.data?.data ?? response?.data;
};
export const calculateTrip = async (tripId) => {
  const response = await client.post(`/trips/${tripId}/calculate`);
  return response?.data?.data ?? response?.data;
};

export const getTripResults = async (tripId) => {
  const response = await client.get(`/trips/${tripId}/results`);
  return response?.data?.data ?? response?.data;
};

export const generatePackingSteps = async (tripId) => {
  const response = await client.post(`/trips/${tripId}/generate-packing-steps`);
  return response?.data?.data ?? response?.data;
};

export const getPackingSteps = async (tripId) => {
  const response = await client.get(`/trips/${tripId}/packing-steps`);
  return response?.data?.data ?? response?.data;
};

export const completePackingStep = async (tripId, stepId) => {
  const response = await client.put(`/trips/${tripId}/packing-steps/${stepId}/complete`);
  return response?.data?.data ?? response?.data;
};

export const getCustomItems = async () => {
  const response = await client.get("/custom-items");
  return response?.data?.data ?? response?.data;
};

export const getCustomItemById = async (customItemId) => {
  const response = await client.get(`/custom-items/${customItemId}`);
  return response?.data?.data ?? response?.data;
};

export const createCustomItem = async (payload) => {
  const response = await client.post("/custom-items", payload);
  return response?.data?.data ?? response?.data;
};

export const updateCustomItem = async (customItemId, payload) => {
  const response = await client.put(`/custom-items/${customItemId}`, payload);
  return response?.data?.data ?? response?.data;
};

export const deleteCustomItem = async (customItemId) => {
  const response = await client.delete(`/custom-items/${customItemId}`);
  return response?.data?.data ?? response?.data;
};