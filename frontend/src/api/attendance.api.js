import API from './axios';

export const generateQR = (workshopId, type) =>
  API.post(`/attendance/generate-qr/${workshopId}`, { type });

export const scanQR = (data) =>
  API.post('/attendance/scan', data);

export const getAttendanceByWorkshop = (workshopId) =>
  API.get(`/attendance/workshop/${workshopId}`);

export const getMyAttendance = () =>
  API.get('/attendance/my');

export const lockAttendance = (workshopId) =>
  API.patch(`/attendance/lock/${workshopId}`);

export const exportAttendanceExcel = (workshopId) =>
  API.get(`/attendance/export/${workshopId}`, { responseType: 'blob' });