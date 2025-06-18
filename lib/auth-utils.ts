import { User } from './database-types'

export const AUTH_STORAGE_KEY = 'interview_app_user'

export function setAuthUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
  }
}

export function getAuthUser(): User | null {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem(AUTH_STORAGE_KEY)
    if (userData) {
      try {
        return JSON.parse(userData)
      } catch {
        return null
      }
    }
  }
  return null
}

export function clearAuthUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}

export function isAuthenticated(): boolean {
  return getAuthUser() !== null
} 