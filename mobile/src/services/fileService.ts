import api from './api';
import { API_BASE_URL } from '@/config/env';
import { session } from './session';

// Ported from frontend/src/services/fileService.js (Phase 24's real avatar-upload
// backend) - mobile never got a caller for it, so Settings had no avatar UI at all.
// Unlike web, RN's <Image> supports authenticated requests directly via a headers
// object on the source, so there's no need for the browser-only blob-URL dance
// web's getBlobUrl() does.
export const fileService = {
  // Multipart body - same Content-Type gotcha as web's fileService.js: api.ts's
  // instance sets a default 'application/json' Content-Type on every request,
  // which axios treats as already-explicit and won't override. Clearing it here
  // lets the RN/axios multipart encoder set its own boundary.
  async upload(fileUri: string, fileName: string, mimeType: string): Promise<{ filePath: string }> {
    const formData = new FormData();
    // React Native's FormData accepts this {uri, name, type} shape directly -
    // not a real Blob/File, but RN's networking layer knows how to stream it.
    formData.append('file', { uri: fileUri, name: fileName, type: mimeType } as unknown as Blob);
    const res = await api.post('/api/v1/files/upload', formData, {
      headers: { 'Content-Type': undefined },
    });
    return res?.data?.data;
  },

  // RN's <Image source={{uri, headers}}/> can attach a bearer token directly,
  // unlike a plain web <img> - no blob-URL fetch-and-revoke dance needed.
  async getAuthenticatedImageSource(filePath: string): Promise<{ uri: string; headers: Record<string, string> } | null> {
    const token = await session.getToken();
    if (!token) return null;
    return {
      uri: `${API_BASE_URL}/api/v1/files/download?path=${encodeURIComponent(filePath)}`,
      headers: { Authorization: `Bearer ${token}` },
    };
  },

  async remove(filePath: string): Promise<void> {
    await api.delete('/api/v1/files', { params: { path: filePath } });
  },
};
