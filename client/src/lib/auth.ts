import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export class AuthService {
  private static TOKEN_KEY = 'fittracker_token';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static async login(username: string, password: string): Promise<AuthResponse> {
    const response = await apiRequest('POST', '/api/auth/login', { username, password });
    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  static async register(userData: {
    username: string;
    email: string;
    password: string;
    name: string;
  }): Promise<AuthResponse> {
    const response = await apiRequest('POST', '/api/auth/register', userData);
    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  static async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.removeToken();
      }
      throw new Error('Failed to get current user');
    }

    return response.json();
  }

  static logout(): void {
    this.removeToken();
    window.location.href = '/login';
  }
}
