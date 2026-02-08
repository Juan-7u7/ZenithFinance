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
  // Using pro-api (demo) endpoint which has better CORS support
  private readonly API_URL = 'https://api.coingecko.com/api/v3';
  private readonly USE_DEMO_MODE = true; // Fallback to demo data if API fails
  
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
      retry(1),
      catchError(error => {
        console.warn(`API failed for ${id} details, using demo data:`, error);
        
        // If DEMO_MODE is enabled or CORS error, return simulated data
        if (this.USE_DEMO_MODE || error.status === 0) {
          return of(this.generateDemoAssetDetails(id));
        }
        
        return throwError(() => new Error(`No se pudo obtener información de ${id}. Por favor intenta de nuevo.`));
      })
    );
  }

  /**
   * Generate demo asset details for fallback
   */
  private generateDemoAssetDetails(id: string): any {
    const basePrices: Record<string, number> = {
      'bitcoin': 45000,
      'ethereum': 2500,
      'binancecoin': 320,
      'solana': 100,
      'ripple': 0.55,
      'cardano': 0.48,
      'dogecoin': 0.08,
      'polkadot': 6.5,
      'matic-network': 0.85,
      'avalanche-2': 35,
      'chainlink': 15,
      'uniswap': 6.2
    };

    return {
      id,
      market_data: {
        current_price: {
          usd: basePrices[id] || 100
        }
      }
    };
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
      retry(1), // Only 1 retry to fail fast
      catchError(error => {
        console.warn(`API failed for ${id}, using demo data:`, error);
        
        // If DEMO_MODE is enabled or CORS error, return simulated data
        if (this.USE_DEMO_MODE || error.status === 0) {
          return of(this.generateDemoHistoryData(id, days));
        }
        
        return throwError(() => new Error(`No se pudo obtener el historial de precios. Por favor intenta de nuevo.`));
      })
    );
  }

  /**
   * Generate realistic demo historical data for development/fallback
   */
  private generateDemoHistoryData(id: string, days: number): any {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    // Base prices for different cryptos (approximate current prices)
    const basePrices: Record<string, number> = {
      'bitcoin': 45000,
      'ethereum': 2500,
      'binancecoin': 320,
      'solana': 100,
      'ripple': 0.55,
      'cardano': 0.48,
      'dogecoin': 0.08,
      'polkadot': 6.5,
      'matic-network': 0.85,
      'avalanche-2': 35,
      'chainlink': 15,
      'uniswap': 6.2
    };

    const basePrice = basePrices[id] || 100;
    const prices: [number, number][] = [];

    // Generate realistic price movement
    for (let i = 0; i < days; i++) {
      const timestamp = now - ((days - i) * dayMs);
      // Random walk with slight upward bias
      const variation = (Math.random() - 0.48) * 0.05; // -2.5% to +2.5%
      const price = basePrice * (1 + (variation * i / days));
      prices.push([timestamp, price]);
    }

    return { prices };
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
