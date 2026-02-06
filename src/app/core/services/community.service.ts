import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { Observable, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface LeaderboardUser {
    user_id: string;
    username: string;
    name: string;
    avatar_url: string;
    roi_total: number;
    roi_24h: number;
    rank_position: number;
}

@Injectable({
  providedIn: 'root'
})
export class CommunityService {
  private supabase = inject(Supabase);
  private authService = inject(AuthService);

  // --- Follow System ---

  followUser(targetId: string): Observable<void> {
    const myId = this.authService.getCurrentUser()?.id;
    if (!myId) return of(void 0);

    return from(
      this.supabase.getClient()
        .from('follows')
        .insert({ follower_id: myId, following_id: targetId })
    ).pipe(
      // After successfully following, insert the notification manually
      switchMap(({ error }) => {
        if (error) throw error;
        
        return from(
            this.supabase.getClient()
                .from('notifications')
                .insert({
                    recipient_id: targetId,
                    sender_id: myId,
                    type: 'NEW_FOLLOWER',
                    is_read: false
                })
        );
      }),
      map(({ error }) => {
        if (error) console.error('Error creating notification:', error);
        // We don't throw blocking error for notification failure, follow is done
      }),
      catchError(err => {
        console.error('Follow error', err);
        return of(void 0);
      })
    );
  }

  unfollowUser(targetId: string): Observable<void> {
    const myId = this.authService.getCurrentUser()?.id;
    if (!myId) return of(void 0);

    return from(
      this.supabase.getClient()
        .from('follows')
        .delete()
        .eq('follower_id', myId)
        .eq('following_id', targetId)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError(err => {
        console.error('Unfollow error', err);
        return of(void 0);
      })
    );
  }

  checkIsFollowing(targetId: string): Observable<boolean> {
    const myId = this.authService.getCurrentUser()?.id;
    if (!myId) return of(false);

    return from(
      this.supabase.getClient()
        .from('follows')
        .select('*', { count: 'exact', head: true }) // optimized head request
        .eq('follower_id', myId)
        .eq('following_id', targetId)
    ).pipe(
      map(({ count, error }) => {
         return (count || 0) > 0;
      }),
      catchError(() => of(false))
    );
  }

  // --- Leaderboard System ---

  getLeaderboard(timeframe: '24h' | 'total' = 'total'): Observable<LeaderboardUser[]> {
    let query = this.supabase.getClient()
        .from('leaderboard_view')
        .select('*');
    
    // Default sorts by total, if 24h is requested we sort differently
    if (timeframe === '24h') {
        query = query.order('roi_24h', { ascending: false });
    } else {
        query = query.order('roi_total', { ascending: false });
    }

    return from(query.limit(50)).pipe(
        map(({ data, error }) => {
            if (error) throw error;
            return data as LeaderboardUser[];
        }),
        catchError(err => {
            console.error('Leaderboard error', err);
            return of([]);
        })
    );
  }

  // Called by Dashboard to update stats
  updateMyPerformance(roiTotal: number, roi24h: number): Observable<void> {
      const myId = this.authService.getCurrentUser()?.id;
      if (!myId) return of(void 0);

      return from(
          this.supabase.getClient()
            .from('user_performance')
            .upsert({ 
                user_id: myId,
                roi_total: roiTotal,
                roi_24h: roi24h,
                last_updated: new Date()
            })
      ).pipe(map(() => void 0));
  }
}
