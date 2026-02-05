import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Supabase } from './supabase';
import { AuthResponse, LoginCredentials, User } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  constructor(private supabase: Supabase) {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('current_user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.tokenSubject.next(token);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error loading stored auth:', error);
        this.clearAuth();
      }
    }
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return new Observable<AuthResponse>(observer => {
      this.supabase.getClient()
        .auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password
        })
        .then(({ data, error }) => {
          if (error) {
            observer.error(error);
            return;
          }

          if (data.session && data.user) {
            const user: User = {
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.['name'] || data.user.email!.split('@')[0],
              avatar: data.user.user_metadata?.['avatar_url'],
              createdAt: new Date(data.user.created_at)
            };

            const authResponse: AuthResponse = {
              user,
              token: data.session.access_token,
              refreshToken: data.session.refresh_token
            };

            this.setAuth(authResponse);
            observer.next(authResponse);
            observer.complete();
          } else {
            observer.error(new Error('No session data received'));
          }
        })
        .catch(error => observer.error(error));
    });
  }

  register(credentials: LoginCredentials & { name: string }): Observable<AuthResponse> {
    return new Observable<AuthResponse>(observer => {
      this.supabase.getClient()
        .auth.signUp({
          email: credentials.email,
          password: credentials.password,
          options: {
            data: {
              name: credentials.name
            }
          }
        })
        .then(({ data, error }) => {
          if (error) {
            observer.error(error);
            return;
          }

          if (data.session && data.user) {
            const user: User = {
              id: data.user.id,
              email: data.user.email!,
              name: credentials.name,
              createdAt: new Date(data.user.created_at)
            };

            const authResponse: AuthResponse = {
              user,
              token: data.session.access_token,
              refreshToken: data.session.refresh_token
            };

            this.setAuth(authResponse);
            observer.next(authResponse);
            observer.complete();
          } else {
            observer.error(new Error('Registration successful but no session created'));
          }
        })
        .catch(error => observer.error(error));
    });
  }

  logout(): Observable<void> {
    return new Observable<void>(observer => {
      this.supabase.getClient()
        .auth.signOut()
        .then(() => {
          this.clearAuth();
          observer.next();
          observer.complete();
        })
        .catch(error => {
          this.clearAuth();
          observer.error(error);
        });
    });
  }

  refreshToken(): Observable<string> {
    return new Observable<string>(observer => {
      this.supabase.getClient()
        .auth.refreshSession()
        .then(({ data, error }) => {
          if (error || !data.session) {
            observer.error(error || new Error('Failed to refresh session'));
            return;
          }

          const newToken = data.session.access_token;
          this.tokenSubject.next(newToken);
          localStorage.setItem('auth_token', newToken);
          observer.next(newToken);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value && !!this.currentUserSubject.value;
  }

  private setAuth(authResponse: AuthResponse): void {
    this.currentUserSubject.next(authResponse.user);
    this.tokenSubject.next(authResponse.token);

    localStorage.setItem('auth_token', authResponse.token);
    localStorage.setItem('refresh_token', authResponse.refreshToken);
    localStorage.setItem('current_user', JSON.stringify(authResponse.user));
  }

  private clearAuth(): void {
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);

    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
  }
}
