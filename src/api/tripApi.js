// packsmart-mobile/src/api/tripApi.js
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
  return response?.data?.data ?? response?.data ?? [];
};

export const createTrip = async (payload) => {
  const response = await client.post("/trips", payload);
  return response?.data?.data ?? response?.data;
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

export const getAirlines = async () => {
  const response = await client.get("/airlines");
  return response?.data?.data ?? response?.data;
};

export const getAirlineBaggageRules = async (airlineId) => {
  const response = await client.get(`/airlines/${airlineId}/baggage-rules`);
  return response?.data?.data ?? response?.data;
};

export const calculateTrip = async (tripId) => {
  const response = await client.post(`/trips/${tripId}/calculate`);
  return response?.data?.data ?? response?.data;
};

export const getTripResults = async (tripId) => {
  const response = await client.get(`/trips/${tripId}/results`);
  if (response?.data && Object.prototype.hasOwnProperty.call(response.data, "data")) {
    return response.data.data;
  }
  return response?.data;};

export const getTripItems = async (tripId) => {
  const response = await client.get(`/trips/${tripId}/items`);
  return response?.data?.data ?? response?.data;
};

export const deleteTripItem = async (tripId, tripItemId) => {
  const response = await client.delete(`/trips/${tripId}/items/${tripItemId}`);
  return response?.data?.data ?? response?.data;
};

export const getTripSimulationScene = async (tripId) => {
  const response = await client.get(`/trips/${tripId}/simulation`);
  return response?.data?.data ?? response?.data;
}

