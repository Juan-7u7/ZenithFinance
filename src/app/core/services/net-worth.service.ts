import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Supabase } from './supabase';

export interface NetWorthSnapshot {
  id?: string;
  user_id: string;
  total_value: number;
  profit_loss: number;
  profit_loss_percentage: number;
  timestamp: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NetWorthService {
  private supabase = inject(Supabase);

  /**
   * Save current portfolio snapshot
   */
  saveSnapshot(userId: string, totalValue: number, profitLoss: number, profitLossPercentage: number): Observable<void> {
    return from(
      this.supabase.getClient()
        .from('net_worth_history')
        .insert({
          user_id: userId,
          total_value: totalValue,
          profit_loss: profitLoss,
          profit_loss_percentage: profitLossPercentage,
          timestamp: new Date().toISOString()
        })
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  /**
   * Get net worth history for a user
   * Now returns the last N snapshots regardless of date range
   * This ensures users see data even if they haven't been using the app for long
   */
  getHistory(userId: string, days: number = 30): Observable<NetWorthSnapshot[]> {
    // Calculate limit based on days (approximate: 1 snapshot per day)
    const limit = Math.max(days, 7); // Minimum 7 snapshots
    
    return from(
      this.supabase.getClient()
        .from('net_worth_history')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        // Return in ascending order for chart display
        return (data || []).reverse();
      })
    );
  }

  /**
   * Get latest snapshot
   */
  getLatestSnapshot(userId: string): Observable<NetWorthSnapshot | null> {
    return from(
      this.supabase.getClient()
        .from('net_worth_history')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        return data;
      })
    );
  }

  /**
   * Delete old snapshots (keep last 90 days)
   */
  cleanupOldSnapshots(userId: string): Observable<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    return from(
      this.supabase.getClient()
        .from('net_worth_history')
        .delete()
        .eq('user_id', userId)
        .lt('timestamp', cutoffDate.toISOString())
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }
}
