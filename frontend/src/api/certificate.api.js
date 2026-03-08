import API from './axios';

export const generateCertificate = (workshopId) =>
  API.post('/certificates/generate', { workshop_id: workshopId });

export const getMyCertificates = () =>
  API.get('/certificates/my');

export const downloadCertificate = (certificateId) =>
  API.get(`/certificates/download/${certificateId}`, { responseType: 'blob' });

export const verifyCertificate = (certificateId) =>
  API.get(`/certificates/verify/${certificateId}`);