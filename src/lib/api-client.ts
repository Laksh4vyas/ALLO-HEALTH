import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Products
export const fetchProducts = async () => {
  const { data } = await api.get("/products");
  return data.data;
};

// Warehouses
export const fetchWarehouses = async () => {
  const { data } = await api.get("/warehouses");
  return data.data;
};

// Reservations
export const createReservation = async (
  payload: { productId: string; warehouseId: string; quantity: number },
  idempotencyKey?: string
) => {
  const { data } = await api.post("/reservations", payload, {
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
  });
  return data.data;
};

export const fetchReservation = async (id: string) => {
  const { data } = await api.get(`/reservations/${id}`);
  return data.data;
};

export const confirmReservation = async (
  id: string,
  idempotencyKey?: string
) => {
  const { data } = await api.post(
    `/reservations/${id}/confirm`,
    {},
    {
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
    }
  );
  return data.data;
};

export const releaseReservation = async (id: string) => {
  const { data } = await api.post(`/reservations/${id}/release`, {});
  return data.data;
};

export default api;
