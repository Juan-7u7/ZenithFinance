import { Injectable, inject, signal } from '@angular/core';
import { Supabase } from './supabase';
import { AuthService } from './auth.service';
import { from, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface AppNotification {
  id: string;
  type: 'NEW_FOLLOWER' | 'ASSET_ALERT' | 'SYSTEM';
  created_at: string;
  is_read: boolean;
  sender?: {
      name: string;
      avatar_url: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private supabase = inject(Supabase);
  private authService = inject(AuthService);

  // State
  unreadCount = signal(0);
  notifications = signal<AppNotification[]>([]);

  constructor() {
     // Initial load if user exists
     if (this.authService.getCurrentUser()) {
         this.loadNotifications();
     }
  }

  loadNotifications() {
      const myId = this.authService.getCurrentUser()?.id;
      if (!myId) return;

      from(
          this.supabase.getClient()
            .from('notifications')
            .select('*, sender:sender_id(name, avatar_url)')
            .eq('recipient_id', myId)
            .order('created_at', { ascending: false })
            .limit(20)
      ).subscribe(({ data, error }) => {
          if (!error && data) {
              const notifs = data as any[]; // Type cast for join result
              this.notifications.set(notifs);
              this.unreadCount.set(notifs.filter(n => !n.is_read).length);
          }
      });
  }

  markAsRead(id: string) {
      // Optimistic update
      this.notifications.update(list => list.map(n => n.id === id ? {...n, is_read: true} : n));
      this.unreadCount.update(c => Math.max(0, c - 1));

      this.supabase.getClient()
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .then();
  }
  
  markAllRead() {
      this.notifications.update(list => list.map(n => ({...n, is_read: true})));
      this.unreadCount.set(0);

      const myId = this.authService.getCurrentUser()?.id;
      if (!myId) return;

      this.supabase.getClient()
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', myId)
        .eq('is_read', false)
        .then();
  }
}
