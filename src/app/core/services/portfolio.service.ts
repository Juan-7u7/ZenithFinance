import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Supabase } from './supabase';
import { AuthService } from './auth.service';
import { DatabaseAsset } from '../models/asset.model';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private _assets = new BehaviorSubject<DatabaseAsset[]>([]);
  public assets$ = this._assets.asObservable();

  private _loading = new BehaviorSubject<boolean>(false);
  public loading$ = this._loading.asObservable();

  constructor(
    private supabase: Supabase,
    private authService: AuthService
  ) {
    this.loadPortfolio();
  }

  loadPortfolio(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this._loading.next(true);

    from(
      this.supabase.getClient()
        .from('user_assets')
        .select('*')
        .eq('user_id', user.id)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as DatabaseAsset[];
      }),
      tap(data => {
        this._assets.next(data || []);
        this._loading.next(false);
      }),
      catchError(error => {
        console.error('Error loading portfolio:', error);
        this._loading.next(false);
        return throwError(() => error);
      })
    ).subscribe();
  }

  addAsset(asset: DatabaseAsset): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!user) return throwError(() => new Error('User not authenticated'));

    // Ensure we send snake_case to Supabase as per interface
    const newAsset = { 
      ...asset, 
      user_id: user.id 
    };

    return from(
      this.supabase.getClient()
        .from('user_assets')
        .upsert(newAsset)
        .select()
    ).pipe(
      tap(({ data, error }) => {
        if (error) throw error;
        this.loadPortfolio(); 
      })
    );
  }

  updateAsset(asset: DatabaseAsset): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!user) return throwError(() => new Error('User not authenticated'));

    // We rely on asset.id being present for update
    if (!asset.id) return throwError(() => new Error('Asset ID required for update'));

    const updates = {
      amount: asset.amount,
      purchase_price: asset.purchase_price
    };

    return from(
      this.supabase.getClient()
        .from('user_assets')
        .update(updates)
        .eq('id', asset.id)
        .eq('user_id', user.id) // Security check RLS
    ).pipe(
      tap(({ error }) => {
        if (error) throw error;
        this.loadPortfolio();
      })
    );
  }

  removeAsset(id: string): Observable<any> {
    return from(
      this.supabase.getClient()
        .from('user_assets')
        .delete()
        .eq('id', id)
    ).pipe(
      tap(({ error }) => {
        if (error) throw error;
        this.loadPortfolio();
      })
    );
  }
}
