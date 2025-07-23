export const BACKEND_URL = 'http://localhost:8000'
export const getUserUrl = (userId: string) => `${BACKEND_URL}/users/${userId}`
export const updateProfileUrl = (userId: string) => `${BACKEND_URL}/users/${userId}/profile`
