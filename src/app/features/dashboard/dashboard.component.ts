import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Sun, Moon, LogOut, Plus, Wallet, Pencil, Trash2 } from 'lucide-angular';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStateService } from './dashboard-state.service';
import { Router } from '@angular/router';

import { AddAssetModalComponent } from './components/add-asset-modal/add-asset-modal.component';
import { EditAssetModalComponent } from './components/edit-asset-modal/edit-asset-modal.component';
import { ConfirmDeleteModalComponent } from './components/confirm-delete-modal/confirm-delete-modal.component';
import { PortfolioService } from '../../core/services/portfolio.service';
import { PortfolioAsset } from '../../core/models/asset.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AddAssetModalComponent, EditAssetModalComponent, ConfirmDeleteModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  // Icons
  readonly icons = { Sun, Moon, LogOut, Plus, Wallet, Pencil, Trash2 };
  
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private dashboardState = inject(DashboardStateService);
  private portfolioService = inject(PortfolioService);
  private router = inject(Router);

  currentUser = toSignal(this.authService.currentUser$);
  currentTheme = this.themeService.theme;
  
  // Dashboard State Signal with loaded portfolio data + market prices
  dashboard = this.dashboardState.state;
  
  // UI State
  isAddModalOpen = signal(false);
  editingAsset = signal<PortfolioAsset | null>(null);
  deletingAsset = signal<PortfolioAsset | null>(null);
  isDeleting = signal(false);

  ngOnInit(): void {
    console.log('Dashboard initialized with State Service');
  }

  // Add Modal
  openAddModal(): void { this.isAddModalOpen.set(true); }
  closeAddModal(): void { this.isAddModalOpen.set(false); }
  onAssetAdded(asset: any): void { this.closeAddModal(); }

  // Edit Modal
  openEditModal(asset: PortfolioAsset): void {
    // We need the original database ID for the update, NOT the CoinGecko assetId.
    // However, PortfolioAsset interface currently has `assetId` mapping to CoinGecko ID.
    // DashboardStateService maps `assetId` to `ua.asset_id`.
    // Wait... DashboardStateService enrichedAssets doesn't include the DB ID explicitly in the interface!
    // I need to update PortfolioAsset interface or pass the DB ID somehow.
    // Let's assume for now I can find it in the raw userAssets from portfolioService.
    // BETTER FIX: Let's update PortfolioAsset to include `id` (database ID).
    
    this.editingAsset.set(asset);
  }

  closeEditModal(): void { this.editingAsset.set(null); }
  onAssetUpdated(): void { this.closeEditModal(); }

  // Delete Modal
  openDeleteModal(asset: PortfolioAsset): void { this.deletingAsset.set(asset); }
  closeDeleteModal(): void { this.deletingAsset.set(null); }

  confirmDelete(): void {
    const asset = this.deletingAsset();
    if (!asset || !asset.id) return; // Need DB ID here too

    this.isDeleting.set(true);
    this.portfolioService.removeAsset(asset.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
      },
      error: (err) => {
        console.error(err);
        this.isDeleting.set(false);
      }
    });
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
