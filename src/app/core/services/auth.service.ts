import { Injectable, signal } from '@angular/core';
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
  public authState$ = this.currentUser$; // Alias for compatibility

  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  public isInitialized = signal(false);

  constructor(private supabase: Supabase) {
    this.recoverSession();
    this.initAuthListener();
  }

  private async recoverSession() {
    try {
      const { data, error } = await this.supabase.getClient().auth.getSession();
      if (error) {
        // If there's an error with the session (like invalid refresh token), logout clean
        if (error.message.includes('refresh_token')) {
          await this.logout().toPromise();
        }
        return;
      }
      if (data.session) {
        this.updateSession(data.session);
      }
    } catch (e) {
      console.error('Session recovery failed:', e);
    } finally {
      this.isInitialized.set(true);
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
    if (!session?.user) {
      this.clearAuth();
      return;
    }
    
    const user: User = {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.user_metadata?.['name'] || session.user.email!.split('@')[0],
      avatar: session.user.user_metadata?.['avatar_url'],
      createdAt: new Date(session.user.created_at)
    };
    
    this.currentUserSubject.next(user);
    this.tokenSubject.next(session.access_token);
  }

  // loadStoredAuth removed as it caused conflicts with Supabase's internal persistence.

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

  forgotPassword(email: string): Observable<void> {
    return new Observable<void>(observer => {
      this.supabase.getClient()
        .auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        })
        .then(({ error }) => {
          if (error) {
            observer.error(error);
          } else {
            observer.next();
            observer.complete();
          }
        })
        .catch(error => observer.error(error));
    });
  }

  updatePassword(password: string): Observable<void> {
    return new Observable<void>(observer => {
      this.supabase.getClient()
        .auth.updateUser({ password })
        .then(({ error }) => {
          if (error) {
            observer.error(error);
          } else {
            observer.next();
            observer.complete();
          }
        })
        .catch(error => observer.error(error));
    });
  }

  updateProfile(updates: { name: string }): Observable<void> {
    const user = this.getCurrentUser();
    if (!user) {
      return throwError(() => new Error('No user logged in'));
    }

    return new Observable<void>(observer => {
      // Update both auth metadata AND users table
      Promise.all([
        // 1. Update auth.users metadata
        this.supabase.getClient()
          .auth.updateUser({
            data: { name: updates.name }
          }),
        // 2. Update users table (visible to other users)
        this.supabase.getClient()
          .from('users')
          .update({ name: updates.name })
          .eq('id', user.id)
      ])
      .then(([authResult, dbResult]) => {
        if (authResult.error) {
          observer.error(authResult.error);
          return;
        }
        if (dbResult.error) {
          observer.error(dbResult.error);
          return;
        }
        
        // Update local state
        this.currentUserSubject.next({
          ...user,
          name: updates.name
        });
        
        observer.next();
        observer.complete();
      })
      .catch(error => observer.error(error));
    });
  }

  private clearAuth(): void {
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
  }

  // Explicit setAuth removed to favor Supabase's automatic session persistence.
}
