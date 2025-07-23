export const BACKEND_URL = 'http://localhost:8000'
export const getUserUrl = (userId: string) => `${BACKEND_URL}/users/${userId}`
export const updateProfileUrl = (userId: string) => `${BACKEND_URL}/users/${userId}/profile`
export const searchUsersUrl = (query: string) => `${BACKEND_URL}/users/search?query=${encodeURIComponent(query)}`
export const getCollabProfileUrl = (userId: string) => `${BACKEND_URL}/users/${userId}/collab_profile`
export const updateCollabProfileUrl = (userId: string) => `${BACKEND_URL}/users/${userId}/collab_profile`
