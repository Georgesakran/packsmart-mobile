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