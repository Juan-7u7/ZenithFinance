import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, throwError, of } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { Supabase } from './supabase';
import { AuthService } from './auth.service';
import { DatabaseAsset, Transaction } from '../models/asset.model';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private _assets = new BehaviorSubject<DatabaseAsset[]>([]);
  public assets$ = this._assets.asObservable();

  private _transactions = new BehaviorSubject<Transaction[]>([]);
  public transactions$ = this._transactions.asObservable();

  private _loading = new BehaviorSubject<boolean>(false);
  public loading$ = this._loading.asObservable();

  constructor(
    private supabase: Supabase,
    private authService: AuthService
  ) {
    this.loadPortfolio();
    this.loadTransactions();
    this.subscribeToRealtimeUpdates();
  }

  private subscribeToRealtimeUpdates() {
    const client = this.supabase.getClient();
    const user = this.authService.getCurrentUser();
    
    if (!user) return;

    client.channel('portfolio_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_assets', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('Realtime update received:', payload);
          // Reload data to ensure consistency (simpler than merging delta manually)
          this.loadPortfolio();
        }
      )
      .subscribe();
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

  loadTransactions(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    // Use 'user_transactions' table
    from(
      this.supabase.getClient()
        .from('user_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(50) // Load last 50 transactions
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          // If table doesn't exist, we just return empty array silently (graceful degradation)
          if (error.code === '42P01') return []; 
          throw error;
        }
        return data as Transaction[];
      }),
      tap(data => this._transactions.next(data || [])),
      catchError(err => {
        console.warn('Could not load transactions', err);
        return of([]);
      })
    ).subscribe();
  }

  private saveTransaction(tx: Partial<Transaction>): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const transaction: Transaction = {
      ...tx,
      user_id: user.id,
      date: new Date(),
      total: (tx.amount || 0) * (tx.price_per_unit || 0)
    } as Transaction;

    this.supabase.getClient()
      .from('user_transactions')
      .insert(transaction)
      .then(({ error }) => {
        if (!error) this.loadTransactions();
        else console.warn('Failed to log transaction', error);
      });
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
        
        // Log Transaction
        this.saveTransaction({
          asset_id: asset.asset_id,
          symbol: asset.symbol,
          asset_name: asset.asset_name,
          type: 'buy',
          amount: asset.amount,
          price_per_unit: asset.purchase_price
        });
      })
    );
  }

  updateAsset(asset: DatabaseAsset): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!user) return throwError(() => new Error('User not authenticated'));

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
        .eq('user_id', user.id)
    ).pipe(
      tap(({ error }) => {
        if (error) throw error;
        this.loadPortfolio();

        // Log Update
        this.saveTransaction({
          asset_id: asset.asset_id || 'unknown', // Might be missing if partial update? No, we pass full object from modal
          symbol: asset.symbol,
          asset_name: asset.asset_name,
          type: 'update',
          amount: asset.amount,
          price_per_unit: asset.purchase_price
        });
      })
    );
  }

  removeAsset(id: string, assetDetails?: Partial<DatabaseAsset>): Observable<any> {
    return from(
      this.supabase.getClient()
        .from('user_assets')
        .delete()
        .eq('id', id)
    ).pipe(
      tap(({ error }) => {
        if (error) throw error;
        this.loadPortfolio();

        if (assetDetails) {
          this.saveTransaction({
            asset_id: assetDetails.asset_id,
            symbol: assetDetails.symbol,
            asset_name: assetDetails.asset_name,
            type: 'sell', // Or 'delete', but 'sell' implies closing position
            amount: assetDetails.amount,
            price_per_unit: assetDetails.purchase_price
          });
        }
      })
    );
  }
}
