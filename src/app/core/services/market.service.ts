import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, timer, of, throwError } from 'rxjs';
import { map, shareReplay, switchMap, catchError, retry } from 'rxjs/operators';
import { Asset } from '../models/asset.model';

@Injectable({
  providedIn: 'root'
})
export class MarketService {
  private http = inject(HttpClient);
  private readonly API_URL = 'https://api.coingecko.com/api/v3';
  
  // Cache for market data to prevent rate limiting and optimize performance
  private marketData$: Observable<Asset[]> | null = null;
  private readonly REFRESH_INTERVAL = 60000; // 1 minute

  getMarketAssets(ids: string[] = ['bitcoin', 'ethereum', 'solana', 'cardano', 'polkadot'], currency: string = 'usd'): Observable<Asset[]> {
    // If we have a cached stream, verify if we should return it or create a new one?
    // For this implementation, we'll use a timer to auto-refresh constantly if subscribed
    
    if (!this.marketData$) {
      this.marketData$ = timer(0, this.REFRESH_INTERVAL).pipe(
        switchMap(() => this.fetchMarketData(ids, currency)),
        shareReplay(1) // Share the latest result with all subscribers
      );
    }
    
    return this.marketData$;
  }

  searchAssets(query: string): Observable<Partial<Asset>[]> {
    if (!query || query.length < 2) return of([]);
    
    return this.http.get<any>(`${this.API_URL}/search?query=${query}`).pipe(
      map(response => response.coins.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.large
      }))),
      catchError(err => {
        console.error('Error searching assets:', err);
        return of([]);
      })
    );
  }

  getAssetDetails(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`);
  }

  getAssetHistory(id: string, days: number = 7): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/coins/${id}/market_chart?vs_currency=usd&days=${days}`);
  }

  private fetchMarketData(ids: string[], currency: string): Observable<Asset[]> {
    const params = new HttpParams()
      .set('vs_currency', currency)
      .set('ids', ids.join(','))
      .set('order', 'market_cap_desc')
      .set('per_page', '100')
      .set('page', '1')
      .set('sparkline', 'false');

    return this.http.get<any[]>(`${this.API_URL}/coins/markets`, { params }).pipe(
      retry(2), // Retry failed requests twice
      map(data => data.map(coin => this.mapToAsset(coin))),
      catchError(error => {
        console.error('Market data fetch error:', error);
        // Fallback or rethrow depending on strategy. Here we act professional:
        return throwError(() => new Error('Failed to load market data. Please try again later.'));
      })
    );
  }

  private mapToAsset(data: any): Asset {
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      currentPrice: data.current_price,
      priceChange24h: data.price_change_24h,
      priceChangePercentage24h: data.price_change_percentage_24h,
      marketCap: data.market_cap,
      volume24h: data.total_volume,
      image: data.image,
      lastUpdate: new Date(data.last_updated)
    };
  }
}
