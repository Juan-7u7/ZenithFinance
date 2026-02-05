import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, of } from 'rxjs';
import { map, shareReplay, startWith, switchMap, catchError } from 'rxjs/operators';
import { MarketService } from '../../core/services/market.service';
import { PortfolioService } from '../../core/services/portfolio.service';
import { PortfolioAsset, Portfolio } from '../../core/models/asset.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardStateService {
  private marketService = inject(MarketService);
  private portfolioService = inject(PortfolioService);

  // 1. Get raw user assets
  private userAssets$ = this.portfolioService.assets$;

  // 2. Derive the list of IDs to fetch prices for
  private assetIds$ = this.userAssets$.pipe(
    map(assets => {
      const ids = assets.map(a => a.asset_id);
      // Default to major coins if empty to show something on dashboard
      return ids.length > 0 ? ids : ['bitcoin', 'ethereum', 'solana'];
    })
  );

  // 3. Fetch real-time market data for those IDs
  private marketData$ = this.assetIds$.pipe(
    switchMap(ids => this.marketService.getMarketAssets(ids)),
    startWith([]),
    shareReplay(1)
  );

  // 4. Combine User Assets + Market Prices = Rich Portfolio Data
  public portfolio$ = combineLatest([
    this.userAssets$,
    this.marketData$
  ]).pipe(
    map(([userAssets, marketPrices]) => {
      const enrichedAssets: PortfolioAsset[] = userAssets.map(ua => {
        const marketData = marketPrices.find(m => m.id === ua.asset_id);
        const currentPrice = marketData?.currentPrice || 0;
        const totalValue = ua.amount * currentPrice;
        
        // Calculate Profit/Loss
        const initialInvestment = ua.amount * ua.purchase_price;
        const profitLoss = totalValue - initialInvestment;
        const profitLossPercentage = initialInvestment > 0 
          ? (profitLoss / initialInvestment) * 100 
          : 0;

        return {
          assetId: ua.asset_id,
          symbol: ua.symbol,
          name: marketData?.name || ua.asset_name || ua.asset_id,
          quantity: ua.amount,
          averageBuyPrice: ua.purchase_price,
          currentPrice: currentPrice,
          totalValue: totalValue,
          profitLoss: profitLoss,
          profitLossPercentage: profitLossPercentage,
          image: marketData?.image,
          change24h: marketData?.priceChangePercentage24h
        };
      });

      // Calculate Totals
      const totalValue = enrichedAssets.reduce((acc, curr) => acc + curr.totalValue, 0);
      const totalInvestment = userAssets.reduce((acc, curr) => acc + (curr.amount * curr.purchase_price), 0);
      const totalProfitLoss = totalValue - totalInvestment;
      const totalProfitLossPercentage = totalInvestment > 0 
        ? (totalProfitLoss / totalInvestment) * 100 
        : 0;

      return {
        assets: enrichedAssets,
        totalValue,
        totalInvestment,
        totalProfitLoss,
        totalProfitLossPercentage,
        isLoading: false
      };
    }),
    startWith({
      assets: [],
      totalValue: 0,
      totalInvestment: 0,
      totalProfitLoss: 0,
      totalProfitLossPercentage: 0,
      isLoading: true
    })
  );

  // Expose as Signal for Angular 18+ easy consumption in templates
  public state = toSignal(this.portfolio$, { 
    initialValue: {
      assets: [],
      totalValue: 0,
      totalInvestment: 0,
      totalProfitLoss: 0,
      totalProfitLossPercentage: 0,
      isLoading: true
    } 
  });
}
