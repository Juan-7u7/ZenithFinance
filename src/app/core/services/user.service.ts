import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { Supabase } from './supabase';

export interface PrivacySettings {
  show_balance: boolean;
  show_assets: boolean;
  show_analytics: boolean;
  show_followers: boolean;
}

export interface UserProfile {
  id: string;
  name?: string;
  username?: string;
  avatar_url?: string;
  email?: string;
  privacy_settings?: PrivacySettings;
  banner_colors?: string[];
}

export interface PublicAsset {
  asset_id: string;
  symbol: string;
  name: string;
  quantity: number;
  current_price: number;
  value: number;
  allocation_percentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private supabase: Supabase) { }

  getUsers(excludeId?: string): Observable<UserProfile[]> {
    let query = this.supabase.getClient()
      .from('profiles')
      .select('*');

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
           console.error('Error loading profiles:', error); 
           return [];
        }
        return (data || []) as UserProfile[];
      }),
      catchError(err => {
        console.error('Error fetching users:', err);
        return of([]);
      })
    );
  }

  searchUsers(queryStr: string, excludeId?: string): Observable<UserProfile[]> {
    if (!queryStr) {
      return this.getUsers(excludeId);
    }
    
    let query = this.supabase.getClient()
        .from('profiles')
        .select('*')
        .ilike('name', `%${queryStr}%`);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []) as UserProfile[];
      }),
      catchError(err => {
        console.error('Error searching users:', err);
        return of([]);
      })
    );
  }

  // Get Public Profile by Username
  getProfileByUsername(username: string): Observable<UserProfile | null> {
    return from(
      this.supabase.getClient()
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) return null;
        return data as UserProfile;
      }),
      catchError(() => of(null))
    );
  }

  // Get Public Portfolio via RPC
  getPublicPortfolio(username: string): Observable<PublicAsset[]> {
    return from(
      this.supabase.getClient()
        .rpc('get_public_portfolio', { target_username: username })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
           console.error('Error fetching public portfolio:', error);
           return [];
        }
        return (data || []) as PublicAsset[];
      }),
      catchError(err => {
        console.error('Error in public portfolio RPC:', err);
        return of([]);
      })
    );
  }

  // Update Privacy Settings
  updatePrivacySettings(settings: PrivacySettings): Observable<void> {
    return from(this.supabase.getClient().auth.getUser()).pipe(
         map(res => {
             const uid = res.data.user?.id;
             if (!uid) throw new Error('No user');
             return uid;
         }),
         switchMap(uid => {
             return from(
                 this.supabase.getClient()
                    .from('profiles')
                    .update({ privacy_settings: settings })
                    .eq('id', uid)
             );
         }),
         map(() => void 0),
         catchError(err => {
             console.error('Error updating privacy:', err);
             return of(void 0);
         })
    );
  }

  updateBannerColors(colors: string[]): Observable<void> {
    return from(this.supabase.getClient().auth.getUser()).pipe(
        map(res => res.data.user?.id),
        switchMap(uid => {
            if (!uid) return of(null);
            return from(
                this.supabase.getClient()
                    .from('profiles')
                    .update({ banner_colors: colors })
                    .eq('id', uid)
            );
        }),
        map(() => void 0),
        catchError(() => of(void 0))
    );
  }
}
