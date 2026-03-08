import API from './axios';

export const studentLogin = (data) =>
  API.post('/auth/student/login', data);

export const facultyLogin = (data) =>
  API.post('/auth/faculty/login', data);

export const getMe = () =>
  API.get('/auth/me');

export const logout = () =>
  API.post('/auth/logout');