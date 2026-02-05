import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Sun, Moon, LogOut, Plus, Wallet } from 'lucide-angular';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStateService } from './dashboard-state.service';
import { Router } from '@angular/router';

import { AddAssetModalComponent } from './components/add-asset-modal/add-asset-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AddAssetModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  // Icons
  readonly icons = { Sun, Moon, LogOut, Plus, Wallet };
  
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private dashboardState = inject(DashboardStateService);
  private router = inject(Router);

  currentUser = toSignal(this.authService.currentUser$);
  currentTheme = this.themeService.theme;
  
  // Dashboard State Signal with loaded portfolio data + market prices
  dashboard = this.dashboardState.state;
  
  // UI State
  isAddModalOpen = signal(false);

  ngOnInit(): void {
    console.log('Dashboard initialized with State Service');
  }

  // ... (existing toggleTheme and logout methods)

  openAddModal(): void {
    this.isAddModalOpen.set(true);
  }

  closeAddModal(): void {
    this.isAddModalOpen.set(false);
  }

  onAssetAdded(asset: any): void {
    // The service updates the BehaviorSubject, and DashboardStateService 
    // reacts automatically via combineLatest, so we might not need explicit refresh 
    // if architecture is purely reactive.
    // However, showing a feedback toast would be nice here.
    console.log('Asset added:', asset);
    this.closeAddModal();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  }

  formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }
}
