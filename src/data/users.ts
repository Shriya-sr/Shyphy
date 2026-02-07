import { User } from '@/types/auth';

// DEPRECATED: User authentication is now handled by the backend API
// Passwords are no longer stored in the frontend code
// All authentication requests are sent to: /api/auth/login

// This array is now only used for reference and should not contain passwords
// In a real application, this file can be removed entirely
export const initialUsers: User[] = [];

