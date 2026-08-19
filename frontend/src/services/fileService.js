import api from './api';

export const fileService = {
  // Multipart body - axios normally sets the multipart boundary
  // automatically for a FormData body, but only when no Content-Type header
  // is already present. api.js's instance sets a default 'application/json'
  // Content-Type for every request, which axios treats as already-explicit
  // and does NOT override - without clearing it per-request here, every
  // upload went out labeled application/json with a multipart body inside
  // it, and Spring's multipart resolver correctly (if confusingly) rejected
  // it as "not a multipart request" regardless of file size. Found live
  // while reproducing a broken avatar upload.
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return (await api.post('/api/v1/files/upload', formData, { headers: { 'Content-Type': undefined } }))?.data?.data;
  },

  // The download endpoint requires a bearer token, which a plain <img src>
  // can't attach - fetch the bytes via the authenticated api instance instead
  // and hand back a local object URL for display. Callers are responsible for
  // revoking the URL (URL.revokeObjectURL) once it's no longer displayed.
  getBlobUrl: async (filePath) => {
    const res = await api.get('/api/v1/files/download', { params: { path: filePath }, responseType: 'blob' });
    return URL.createObjectURL(res.data);
  },

  remove: async (filePath) => {
    return await api.delete('/api/v1/files', { params: { path: filePath } });
  },
};
