import API from './axios';

export const createWorkshop = (data) =>
  API.post('/workshops', data);

export const getAllWorkshops = () =>
  API.get('/workshops');

export const getWorkshopById = (id) =>
  API.get(`/workshops/${id}`);

export const updateWorkshop = (id, data) =>
  API.put(`/workshops/${id}`, data);

export const updateWorkshopStatus = (id, status) =>
  API.patch(`/workshops/${id}/status`, { status });

export const deleteWorkshop = (id) =>
  API.delete(`/workshops/${id}`);