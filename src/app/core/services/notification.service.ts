import { Injectable, inject, signal, NgZone } from '@angular/core';
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
  private ngZone = inject(NgZone);

  // State
  unreadCount = signal(0);
  notifications = signal<AppNotification[]>([]);

  private realtimeChannel: any;

  constructor() {
     // Listen to auth state changes to setup/teardown subscription
     this.authService.authState$.subscribe((user: any) => {
         if (user) {
             this.loadNotifications();
             this.setupRealtimeSubscription();
         } else {
             // Cleanup on logout if necessary
             if (this.realtimeChannel) {
                 this.ngZone.run(() => {
                    this.supabase.getClient().removeChannel(this.realtimeChannel);
                    this.realtimeChannel = null;
                 });
             }
             this.ngZone.run(() => {
                this.notifications.set([]);
                this.unreadCount.set(0);
             });
         }
     });
  }

  loadNotifications() {
      const myId = this.authService.getCurrentUser()?.id;
      if (!myId) {
          console.warn('Cannot load notifications: No user ID found');
          return;
      }

      console.log('Fetching notifications for user:', myId);

      from(
          this.supabase.getClient()
            .from('notifications')
            .select(`
                *,
                sender:sender_id (
                    name,
                    avatar_url
                )
            `)
            .eq('recipient_id', myId)
            .order('created_at', { ascending: false })
            .limit(20)
      ).subscribe(({ data, error }) => {
          if (error) {
              console.error('CRITICAL: Error loading notifications:', error);
              // Fallback simple query if JOIN fails
              this.loadNotificationsSimple(myId);
              return;
          }
          
          if (data) {
              console.log('Notifications loaded successfully:', data.length);
              this.ngZone.run(() => {
                this.notifications.set(data);
                this.unreadCount.set(data.filter((n: any) => !n.is_read).length);
              });
          }
      });
  }

  private loadNotificationsSimple(myId: string) {
      from(
          this.supabase.getClient()
            .from('notifications')
            .select('*')
            .eq('recipient_id', myId)
            .order('created_at', { ascending: false })
      ).subscribe(({ data }) => {
          if (data) {
              this.ngZone.run(() => {
                this.notifications.set(data);
                this.unreadCount.set(data.filter((n: any) => !n.is_read).length);
              });
          }
      });
  }

  private setupRealtimeSubscription() {
    const myId = this.authService.getCurrentUser()?.id;
    if (!myId) return;

    // Cleanup previous
    if (this.realtimeChannel) {
        this.supabase.getClient().removeChannel(this.realtimeChannel);
    }

    this.realtimeChannel = this.supabase.getClient()
      .channel('notifications-realtime')
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${myId}` }, 
        (payload) => {
          console.log('REALTIME INSERT DETECTED!', payload.new);
          this.ngZone.run(() => {
            this.handleNewNotification(payload.new);
          });
        }
      )
      .subscribe((status) => {
          console.log('Realtime subscription status:', status);
      });
  }

  private handleNewNotification(record: any) {
      this.supabase.getClient()
          .from('notifications')
          .select('*, sender:sender_id(name, avatar_url)')
          .eq('id', record.id)
          .single()
          .then(({ data, error }) => {
              if (data) {
                  this.ngZone.run(() => {
                      this.notifications.update(curr => [data, ...curr]);
                      this.unreadCount.update(c => c + 1);
                  });
              } else {
                  // If join fails, just add the raw record
                  this.ngZone.run(() => {
                    this.notifications.update(curr => [record, ...curr]);
                    this.unreadCount.update(c => c + 1);
                  });
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
