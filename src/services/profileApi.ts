import { apiRequest, isApiConfigured } from './apiClient'
import type { ProfileDraft, ProfileRecord } from '../types/profile'

const auth = { requireAuthentication: true }
type Data<T> = { data: T }
export const isProfileApiEnabled = () => isApiConfigured()
  || import.meta.env.VITE_PROJECT_COLLABORATION_MODE === 'api'
  || import.meta.env.VITE_DEVELOPER_PASSPORT_MODE === 'api'

export function getMyProfile() {
  return apiRequest<Data<ProfileRecord>>('/profiles/me', auth).then((result) => result.data)
}

export function getProfileById(id: string) {
  return apiRequest<Data<ProfileRecord>>(`/profiles/${encodeURIComponent(id)}`, auth).then((result) => result.data)
}

export function updateMyProfile(profile: ProfileDraft) {
  return apiRequest<Data<ProfileRecord>>('/profiles/me', { ...auth, method: 'PUT', body: JSON.stringify(profile) }).then((result) => result.data)
}

export function getProfiles(ids: string[]) {
  if (ids.length === 0) return Promise.resolve([] as ProfileRecord[])
  const query = new URLSearchParams({ ids: [...new Set(ids)].slice(0, 50).join(',') })
  return apiRequest<Data<ProfileRecord[]>>(`/profiles?${query.toString()}`, auth).then((result) => result.data)
}

export async function uploadMyProfilePhoto(file: File, onProgress: (progress: number) => void) {
  const upload = await apiRequest<Data<{ key: string; url: string; fields: Record<string, string> }>>('/profiles/me/photo-upload', {
    ...auth, method: 'POST', body: JSON.stringify({ contentType: file.type, size: file.size }),
  })
  const formData = new FormData()
  Object.entries(upload.data.fields).forEach(([name, value]) => formData.append(name, value))
  formData.append('file', file)
  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', upload.data.url)
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    request.onerror = () => reject(new Error('Photo upload failed. Check your connection and try again.'))
    request.onload = () => request.status >= 200 && request.status < 300
      ? resolve()
      : reject(new Error('Photo upload was rejected. Choose a supported image and try again.'))
    request.send(formData)
  })
  return apiRequest<Data<ProfileRecord>>('/profiles/me/photo', { ...auth, method: 'POST', body: JSON.stringify({ key: upload.data.key }) }).then((result) => result.data)
}

export function removeMyProfilePhoto() {
  return apiRequest<Data<ProfileRecord>>('/profiles/me/photo', { ...auth, method: 'DELETE' }).then((result) => result.data)
}
