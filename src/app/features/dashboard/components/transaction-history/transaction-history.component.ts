import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule, ArrowUpRight, ArrowDownLeft, RefreshCw, Trash2 } from 'lucide-angular';
import { PortfolioService } from '../../../../core/services/portfolio.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe],
  templateUrl: './transaction-history.component.html',
  styleUrl: './transaction-history.component.scss'
})
export class TransactionHistoryComponent {
  private portfolioService = inject(PortfolioService);
  transactions = toSignal(this.portfolioService.transactions$, { initialValue: [] });
  
  readonly icons = { ArrowUpRight, ArrowDownLeft, RefreshCw, Trash2 };

  getTypeLabel(type: string): string {
    return 'dashboard.' + type;
  }
}
