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
              this.ngZone.run(() => {
                this.notifications.set(notifs);
                this.unreadCount.set(notifs.filter(n => !n.is_read).length);
              });
          }
      });
  }

  private setupRealtimeSubscription() {
    const myId = this.authService.getCurrentUser()?.id;
    if (!myId) return;

    if (this.realtimeChannel) {
        this.supabase.getClient().removeChannel(this.realtimeChannel);
    }

    this.realtimeChannel = this.supabase.getClient()
      .channel('public:notifications')
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${myId}` }, 
        (payload) => {
          console.log('New notification received:', payload);
          this.ngZone.run(() => {
            this.handleNewNotification(payload.new);
          });
        }
      )
      .subscribe();
      
    console.log('Realtime notifications subscribed for user:', myId);
  }

  private handleNewNotification(record: any) {
      // Fetch full details to get sender info (JOIN)
      this.supabase.getClient()
          .from('notifications')
          .select('*, sender:sender_id(name, avatar_url)')
          .eq('id', record.id)
          .single()
          .then(({ data, error }) => {
              if (data && !error) {
                  this.ngZone.run(() => {
                      this.notifications.update(curr => [data, ...curr]);
                      this.unreadCount.update(c => c + 1);
                  });
              } else {
                  console.error('Error fetching new notification details:', error);
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
