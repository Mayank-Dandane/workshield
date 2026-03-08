import API from './axios';

export const submitFeedback = (data) =>
  API.post('/feedback', data);

export const getMyFeedback = () =>
  API.get('/feedback/my');

export const getFeedbackByWorkshop = (workshopId) =>
  API.get(`/feedback/workshop/${workshopId}`);

export const getFeedbackAnalytics = (workshopId) =>
  API.get(`/feedback/analytics/${workshopId}`);