import client from "./client";

export const loginUser = async ({ email, password }) => {
  const response = await client.post("/auth/login", { email, password });
  return response.data;
};

export const registerUser = async ({
  fullName,
  email,
  password,
}) => {
  const response = await client.post("/auth/register", {
    fullName,
    email,
    password,
  });
  return response.data;
};