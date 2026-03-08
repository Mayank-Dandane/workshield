import API from './axios';

export const generateReport = (workshopId) =>
  API.get(`/reports/${workshopId}`, { responseType: 'blob' });