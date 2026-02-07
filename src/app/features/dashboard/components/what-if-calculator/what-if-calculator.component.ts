import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Calculator, TrendingUp, DollarSign, Calendar } from 'lucide-angular';
import { MarketService } from '../../../../core/services/market.service';
import { ToastService } from '../../../../core/services/toast.service';
import { trigger, transition, style, animate } from '@angular/animations';

interface WhatIfResult {
  invested: number;
  currentValue: number;
  profit: number;
  profitPercentage: number;
  priceAtStart: number;
  priceNow: number;
  quantity: number;
}

@Component({
  selector: 'app-what-if-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './what-if-calculator.component.html',
  styleUrls: ['./what-if-calculator.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class WhatIfCalculatorComponent {
  private marketService = inject(MarketService);
  private toastService = inject(ToastService);

  visible = signal(false);
  isCalculating = signal(false);
  result = signal<WhatIfResult | null>(null);

  // Form inputs - using regular properties for ngModel
  amountValue = 1000;
  symbolValue = 'BTC';
  timeframeValue = 365;

  // Signals for reactive UI
  symbol = signal('BTC');
  timeframe = signal(365);

  readonly icons = { X, Calculator, TrendingUp, DollarSign, Calendar };

  readonly popularAssets = [
    { symbol: 'BTC', name: 'Bitcoin', id: 'bitcoin' },
    { symbol: 'ETH', name: 'Ethereum', id: 'ethereum' },
    { symbol: 'BNB', name: 'Binance Coin', id: 'binancecoin' },
    { symbol: 'SOL', name: 'Solana', id: 'solana' },
    { symbol: 'XRP', name: 'Ripple', id: 'ripple' },
    { symbol: 'ADA', name: 'Cardano', id: 'cardano' },
    { symbol: 'DOGE', name: 'Dogecoin', id: 'dogecoin' },
    { symbol: 'DOT', name: 'Polkadot', id: 'polkadot' },
    { symbol: 'MATIC', name: 'Polygon', id: 'matic-network' },
    { symbol: 'AVAX', name: 'Avalanche', id: 'avalanche-2' },
    { symbol: 'LINK', name: 'Chainlink', id: 'chainlink' },
    { symbol: 'UNI', name: 'Uniswap', id: 'uniswap' }
  ];

  readonly timeframes = [
    { days: 30, label: '1 mes' },
    { days: 90, label: '3 meses' },
    { days: 180, label: '6 meses' },
    { days: 365, label: '1 año' },
    { days: 730, label: '2 años' }
  ];

  open() {
    this.visible.set(true);
    this.result.set(null);
  }

  close() {
    this.visible.set(false);
    this.result.set(null);
  }

  selectAsset(symbol: string) {
    this.symbolValue = symbol;
    this.symbol.set(symbol);
  }

  selectTimeframe(days: number) {
    this.timeframeValue = days;
    this.timeframe.set(days);
  }

  async calculate() {
    if (this.amountValue <= 0) {
      this.toastService.show('error', 'Por favor ingresa una cantidad válida');
      return;
    }

    this.isCalculating.set(true);
    this.result.set(null);

    try {
      const symbol = this.symbolValue;
      const invested = this.amountValue;
      const daysAgo = this.timeframeValue;

      // Find asset ID from symbol
      const asset = this.popularAssets.find(a => a.symbol === symbol);
      if (!asset) throw new Error('Asset not found');

      // Get current price
      const currentData = await this.marketService.getAssetDetails(asset.id).toPromise();
      if (!currentData || !currentData.market_data) {
        throw new Error('Could not fetch current price');
      }

      const priceNow = currentData.market_data.current_price.usd;

      // Get historical price
      const historicalData = await this.marketService.getAssetHistory(asset.id, daysAgo).toPromise();
      if (!historicalData || !historicalData.prices || historicalData.prices.length === 0) {
        throw new Error('Could not fetch historical price');
      }

      // Get price from the start of the period (first data point)
      const priceAtStart = historicalData.prices[0][1];

      // Calculate what-if scenario
      const quantity = invested / priceAtStart;
      const currentValue = quantity * priceNow;
      const profit = currentValue - invested;
      const profitPercentage = (profit / invested) * 100;

      this.result.set({
        invested,
        currentValue,
        profit,
        profitPercentage,
        priceAtStart,
        priceNow,
        quantity
      });

      this.toastService.show('success', 'Cálculo completado');

    } catch (error: any) {
      console.error('What-if calculation error:', error);
      this.toastService.show('error', error.message || 'Error al calcular. Intenta de nuevo.');
    } finally {
      this.isCalculating.set(false);
    }
  }
}
