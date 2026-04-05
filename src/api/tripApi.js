import client from "./client";

export const getTrips = async () => {
  const response = await client.get("/trips");
  return response.data;
};

export const getTripById = async (tripId) => {
  const response = await client.get(`/trips/${tripId}`);
  return response.data;
};