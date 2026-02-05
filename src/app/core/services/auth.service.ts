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
    this.recoverSession();
    this.initAuthListener();
  }

  private async recoverSession() {
    const { data } = await this.supabase.getClient().auth.getSession();
    if (data.session) {
      this.updateSession(data.session);
    }
  }

  private initAuthListener(): void {
    this.supabase.getClient().auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      if (event === 'SIGNED_IN' && session) {
        this.updateSession(session);
      } else if (event === 'SIGNED_OUT') {
        this.clearAuth();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        this.updateSession(session);
      }
    });
  }

  private updateSession(session: any): void {
    if (!session?.user) return;
    
    const user: User = {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.user_metadata?.['name'] || session.user.email!.split('@')[0],
      avatar: session.user.user_metadata?.['avatar_url'],
      createdAt: new Date(session.user.created_at)
    };
    
    const authResponse: AuthResponse = {
      user,
      token: session.access_token,
      refreshToken: session.refresh_token
    };

    this.setAuth(authResponse);
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
            this.updateSession(data.session);
            observer.next({
              user: this.getCurrentUser()!,
              token: data.session.access_token,
              refreshToken: data.session.refresh_token
            });
            observer.complete();
          } else {
            observer.error(new Error('No session data received'));
          }
        })
        .catch(error => observer.error(error));
    });
  }

  loginWithProvider(provider: 'google' | 'github'): Promise<void> {
    return this.supabase.getClient().auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    }).then(({ error }) => {
      if (error) throw error;
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
            this.updateSession(data.session);
            observer.next({
              user: this.getCurrentUser()!,
              token: data.session.access_token,
              refreshToken: data.session.refresh_token
            });
            observer.complete();
          } else if (data.user && !data.session) {
             // Case: Email confirmation required
             observer.error(new Error('Please confirm your email address to continue.'));
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

          this.updateSession(data.session);
          observer.next(data.session.access_token);
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
