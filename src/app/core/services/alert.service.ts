import { Injectable, inject, signal } from '@angular/core';
import { Supabase } from './supabase';
import { AuthService } from './auth.service';
import { from, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { PriceAlert } from '../models/automation.model';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private supabase = inject(Supabase);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  alerts = signal<PriceAlert[]>([]);

  constructor() {
    this.loadAlerts();
  }

  loadAlerts() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    from(
      this.supabase.getClient()
        .from('price_alerts')
        .select('*')
        .eq('user_id', user.id)
    ).subscribe(({ data, error }) => {
      if (!error && data) {
        this.alerts.set(data);
        // Cleanup old triggered alerts (older than 24 hours)
        this.cleanupOldAlerts();
      }
    });
  }

  private cleanupOldAlerts() {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const alertsToDelete = this.alerts().filter(alert => 
      !alert.is_active && 
      alert.triggered_at && 
      new Date(alert.triggered_at) < twentyFourHoursAgo
    );

    alertsToDelete.forEach(alert => {
      this.deleteAlert(alert.id).subscribe();
    });
  }

  addAlert(alert: Partial<PriceAlert>): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!user) return of(null);

    const newAlert = {
      ...alert,
      user_id: user.id,
      is_active: true
    };

    return from(
      this.supabase.getClient()
        .from('price_alerts')
        .insert(newAlert)
        .select()
        .single()
    ).pipe(
      tap(({ data, error }) => {
        if (!error && data) {
          this.alerts.update(curr => [...curr, data]);
        }
      })
    );
  }

  deleteAlert(id: string): Observable<any> {
    return from(
      this.supabase.getClient()
        .from('price_alerts')
        .delete()
        .eq('id', id)
    ).pipe(
      tap(({ error }) => {
        if (!error) {
          this.alerts.update(curr => curr.filter(a => a.id !== id));
        }
      })
    );
  }

  checkAlerts(assetId: string, currentPrice: number) {
    const activeAlerts = this.alerts().filter(a => a.asset_id === assetId && a.is_active);
    
    activeAlerts.forEach(alert => {
      let triggered = false;
      if (alert.condition === 'ABOVE' && currentPrice >= alert.target_price) {
        triggered = true;
      } else if (alert.condition === 'BELOW' && currentPrice <= alert.target_price) {
        triggered = true;
      }

      if (triggered) {
        this.triggerAlertNotification(alert, currentPrice);
        this.toggleAlertStatus(alert.id, false);
      }
    });
  }

  private triggerAlertNotification(alert: PriceAlert, price: number) {
    const message = `¡Alerta de Precio! ${alert.symbol} ha llegado a $${price}`;
    
    // In a real app, we'd insert into the 'notifications' table in Supabase
    // to trigger the Realtime subscription in NotificationService.
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.supabase.getClient()
      .from('notifications')
      .insert({
        recipient_id: user.id,
        type: 'ASSET_ALERT',
        is_read: false,
        created_at: new Date().toISOString()
      })
      .then();
  }

  private toggleAlertStatus(id: string, active: boolean) {
    const updateData: any = { is_active: active };
    
    // If deactivating (triggered), record the timestamp
    if (!active) {
      updateData.triggered_at = new Date().toISOString();
    }

    this.supabase.getClient()
      .from('price_alerts')
      .update(updateData)
      .eq('id', id)
      .then(() => {
        this.alerts.update(curr => curr.map(a => a.id === id ? { ...a, ...updateData } : a));
      });
  }
}
