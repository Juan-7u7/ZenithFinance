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
  
  // Dynamic cache per unique set of IDs
  private cacheMap = new Map<string, Observable<Asset[]>>();
  private readonly REFRESH_INTERVAL = 60000; // 1 minute

  getMarketAssets(ids: string[] = ['bitcoin', 'ethereum', 'solana', 'cardano', 'polkadot'], currency: string = 'usd'): Observable<Asset[]> {
    // Create a unique key for this set of IDs
    const cacheKey = ids.sort().join(',');
    
    // If we don't have a stream for this exact set of IDs, create one
    if (!this.cacheMap.has(cacheKey)) {
      const stream$ = timer(0, this.REFRESH_INTERVAL).pipe(
        switchMap(() => this.fetchMarketData(ids, currency)),
        shareReplay(1) // Share the latest result with all subscribers
      );
      this.cacheMap.set(cacheKey, stream$);
    }
    
    return this.cacheMap.get(cacheKey)!;
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
    const params = new HttpParams()
      .set('localization', 'false')
      .set('tickers', 'false')
      .set('market_data', 'true')
      .set('community_data', 'false')
      .set('developer_data', 'false')
      .set('sparkline', 'false');

    return this.http.get<any>(`${this.API_URL}/coins/${id}`, { params }).pipe(
      retry(2),
      catchError(error => {
        console.error(`Error fetching details for ${id}:`, error);
        return throwError(() => new Error(`No se pudo obtener información de ${id}. Por favor intenta de nuevo.`));
      })
    );
  }

  /**
   * Clear the market data cache. Useful when assets are added/removed.
   */
  clearCache(): void {
    this.cacheMap.clear();
  }

  getAssetHistory(id: string, days: number = 7): Observable<any> {
    const params = new HttpParams()
      .set('vs_currency', 'usd')
      .set('days', days.toString())
      .set('interval', days > 90 ? 'daily' : undefined as any);

    return this.http.get<any>(`${this.API_URL}/coins/${id}/market_chart`, { params }).pipe(
      retry(2),
      catchError(error => {
        console.error(`Error fetching history for ${id}:`, error);
        return throwError(() => new Error(`No se pudo obtener el historial de precios. Por favor intenta de nuevo.`));
      })
    );
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
