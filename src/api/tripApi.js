import client from "./client";

export const getTrips = async () => {
  const response = await client.get("/trips");
  return response.data;
};

export const getTripById = async (tripId) => {
  const response = await client.get(`/trips/${tripId}`);
  return response.data;
};

export const getTripSuitcases = async (tripId) => {
  const response = await client.get(`/trips/${tripId}/suitcases`);
  return response.data;
};

export const getTripItems = async (tripId) => {
  const response = await client.get(`/trips/${tripId}/items`);
  return response.data;
};

export const getTripResults = async (tripId) => {
  const response = await client.get(`/trips/${tripId}/results`);
  return response.data;
};

export const getTripChecklistSummary = async (tripId) => {
  const response = await client.get(`/trips/${tripId}/checklist-summary`);
  return response.data;
};

export const updateTripItemPackingStatus = async (tripId, itemId, packingStatus) => {
  const response = await client.put(
    `/trips/${tripId}/items/${itemId}/packing-status`,
    { packingStatus }
  );
  return response.data;
};

export const getTripTravelDaySummary = async (tripId) => {
  const response = await client.get(`/trips/${tripId}/travel-day-summary`);
  return response.data;
};

export const updateTripItemTravelDayMode = async (tripId, itemId, travelDayMode) => {
  const response = await client.put(
    `/trips/${tripId}/items/${itemId}/travel-day-mode`,
    { travelDayMode }
  );
  return response.data;
};

export const createTrip = async ({
  tripName,
  destination,
  durationDays,
  travelType,
  weatherType,
  travelerCount,
}) => {
  const response = await client.post("/trips", {
    tripName,
    destination,
    durationDays,
    travelType,
    weatherType,
    travelerCount,
  });
  return response.data;
};

export const generateTripSuggestions = async (tripId) => {
  const response = await client.post(`/trips/${tripId}/generate-suggestions`, {});
  return response.data;
};

export const calculateTrip = async (tripId) => {
  const response = await client.post(`/trips/${tripId}/calculate`, {});
  return response.data;
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

  return response.data;
};

export const createTripItem = async (
  tripId,
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
  const response = await client.post(`/trips/${tripId}/items`, {
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

  return response.data;
};

export const getPackingTemplates = async () => {
  const response = await client.get("/packing-templates");
  return response.data;
};

export const applyTemplateToTrip = async (
  tripId,
  templateId,
  { replaceExistingItems = false } = {}
) => {
  const response = await client.post(`/trips/${tripId}/apply-template`, {
    templateId,
    replaceExistingItems,
  });

  return response.data;
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

  return response.data;
};

export const deleteTripBag = async (tripId, bagId) => {
  const response = await client.delete(`/trips/${tripId}/suitcases/${bagId}`);
  return response.data;
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

  return response.data;
};

export const deleteTripItem = async (tripId, itemId) => {
  const response = await client.delete(`/trips/${tripId}/items/${itemId}`);
  return response.data;
};