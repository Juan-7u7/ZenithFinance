import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Supabase } from './supabase';
import { AuthService } from './auth.service';

export interface UserAsset {
  id?: string;
  user_id?: string;
  asset_id: string; // e.g., 'bitcoin'
  symbol: string;
  quantity: number;
  avg_buy_price: number;
  created_at?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private _assets = new BehaviorSubject<UserAsset[]>([]);
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
        return data as UserAsset[];
      }),
      tap(data => {
        this._assets.next(data || []);
        this._loading.next(false);
      }),
      catchError(error => {
        console.error('Error loading portfolio:', error);
        this._loading.next(false);
        // If table doesn't exist yet, we might want to handle it gracefully or init empty
        return throwError(() => error);
      })
    ).subscribe();
  }

  addAsset(asset: UserAsset): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!user) return throwError(() => new Error('User not authenticated'));

    const newAsset = { ...asset, user_id: user.id };

    return from(
      this.supabase.getClient()
        .from('user_assets')
        .upsert(newAsset)
        .select()
    ).pipe(
      tap(({ data, error }) => {
        if (error) throw error;
        // Refresh local stateoptimistically or fetch again
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
  
  getPortfolioValue(marketPrices: any): number {
    const assets = this._assets.value;
    return assets.reduce((total, asset) => {
      const price = marketPrices[asset.asset_id]?.current_price || 0;
      return total + (asset.quantity * price);
    }, 0);
  }
}
