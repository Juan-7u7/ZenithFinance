import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Supabase } from './supabase';

export interface UserProfile {
  id: string;
  name?: string;
  avatar_url?: string;
  email?: string; // Optional depending on privacy
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
}
