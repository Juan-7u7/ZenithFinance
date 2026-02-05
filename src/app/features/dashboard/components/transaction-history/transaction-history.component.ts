import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule, ArrowUpRight, ArrowDownLeft, RefreshCw, Trash2 } from 'lucide-angular';
import { PortfolioService } from '../../../../core/services/portfolio.service';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './transaction-history.component.html',
  styleUrl: './transaction-history.component.scss'
})
export class TransactionHistoryComponent {
  private portfolioService = inject(PortfolioService);
  transactions = toSignal(this.portfolioService.transactions$, { initialValue: [] });
  
  readonly icons = { ArrowUpRight, ArrowDownLeft, RefreshCw, Trash2 };

  getTypeLabel(type: string): string {
    switch (type) {
      case 'buy': return 'Compra';
      case 'sell': return 'Venta';
      case 'update': return 'Ajuste';
      case 'delete': return 'Eliminación';
      default: return type;
    }
  }
}
