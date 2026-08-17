import api from './api';

export const fileService = {
  // Multipart body - axios sets the multipart boundary automatically as long
  // as no explicit Content-Type header is passed alongside a FormData body.
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return (await api.post('/api/v1/files/upload', formData))?.data?.data;
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
