import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Sun, Moon, LogOut, Plus, Wallet, Pencil, Trash2, CircleDollarSign, TrendingUp, Briefcase, Languages, Settings, Users, Bell, UserPlus, X } from 'lucide-angular';
import { ThemeService } from '../../core/services/theme.service';
import { LanguageService } from '../../core/services/language.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStateService } from './dashboard-state.service';
import { Router } from '@angular/router';

import { AddAssetModalComponent } from './components/add-asset-modal/add-asset-modal.component';
import { EditAssetModalComponent } from './components/edit-asset-modal/edit-asset-modal.component';
import { ConfirmDeleteModalComponent } from './components/confirm-delete-modal/confirm-delete-modal.component';
import { TransactionHistoryComponent } from './components/transaction-history/transaction-history.component';
import { PortfolioDistributionComponent } from './components/portfolio-distribution/portfolio-distribution.component';
import { NotificationPanelComponent } from './components/notification-panel/notification-panel.component';
import { PortfolioService } from '../../core/services/portfolio.service';
import { ToastService } from '../../core/services/toast.service';
import { PortfolioAsset } from '../../core/models/asset.model';

import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AddAssetModalComponent, EditAssetModalComponent, ConfirmDeleteModalComponent, TransactionHistoryComponent, PortfolioDistributionComponent, NotificationPanelComponent, TranslatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  // Icons
  readonly icons = { Sun, Moon, LogOut, Plus, Wallet, Pencil, Trash2, CircleDollarSign, TrendingUp, Briefcase, Languages, Settings, Users, Bell, UserPlus, X };
  currentDate = new Date();
  
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private languageService = inject(LanguageService);
  private dashboardState = inject(DashboardStateService);
  private portfolioService = inject(PortfolioService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  currentUser = toSignal(this.authService.currentUser$);
  currentTheme = this.themeService.theme;
  currentLang = this.languageService.currentLang;
  
  // Dashboard State Signal with loaded portfolio data + market prices
  dashboard = this.dashboardState.state;
  
  // Notification Signals
  unreadCount = this.notificationService.unreadCount;
  notifications = this.notificationService.notifications;
  isNotificationPanelOpen = signal(false);

  // UI State
  isAddModalOpen = signal(false);
  editingAsset = signal<PortfolioAsset | null>(null);
  deletingAsset = signal<PortfolioAsset | null>(null);
  isDeleting = signal(false);

  ngOnInit(): void {
    console.log('Dashboard initialized with State Service');
    this.notificationService.loadNotifications();
  }

  // --- Notification Logic ---
  toggleNotifications(event: Event): void {
      console.log('Toggle notifications clicked', this.isNotificationPanelOpen());
      event.stopPropagation();
      this.isNotificationPanelOpen.update(v => !v);
      this.cdr.detectChanges();
      console.log('New state:', this.isNotificationPanelOpen());
  }

  closeNotifications(): void {
      this.isNotificationPanelOpen.set(false);
  }

  markRead(id: string, event: Event): void {
      event.stopPropagation();
      this.notificationService.markAsRead(id);
  }

  markAllRead(event: Event): void {
      event.stopPropagation();
      this.notificationService.markAllRead();
  }

  // Add Modal
  openAddModal(): void { this.isAddModalOpen.set(true); }
  closeAddModal(): void { this.isAddModalOpen.set(false); }
  onAssetAdded(asset: any): void {
    const msg = this.languageService.translate('common.success') + ': ' + asset.symbol;
    this.toastService.success(msg);
    this.closeAddModal();
  }

  // Edit Modal
  openEditModal(asset: PortfolioAsset): void {
    this.editingAsset.set(asset);
  }

  closeEditModal(): void { this.editingAsset.set(null); }
  
  onAssetUpdated(): void {
    this.toastService.success(this.languageService.translate('common.success'));
    this.closeEditModal();
  }

  // Delete Modal
  openDeleteModal(asset: PortfolioAsset): void { this.deletingAsset.set(asset); }
  closeDeleteModal(): void { this.deletingAsset.set(null); }

  confirmDelete(): void {
    const asset = this.deletingAsset();
    if (!asset || !asset.id) return; // Need DB ID here too

    this.isDeleting.set(true);

    // Prepare details for logging
    const assetDetails = {
      asset_id: asset.assetId,
      symbol: asset.symbol,
      asset_name: asset.name,
      amount: asset.quantity,
      purchase_price: asset.averageBuyPrice
    };

    this.portfolioService.removeAsset(asset.id, assetDetails).subscribe({
      next: () => {
        this.toastService.info(this.languageService.translate('common.success') + ': ' + asset.symbol);
        this.isDeleting.set(false);
        this.closeDeleteModal();
      },
      error: (err) => {
        console.error(err);
        this.toastService.error(this.languageService.translate('common.error'));
        this.isDeleting.set(false);
      }
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleLanguage(): void {
    const nextLang = this.currentLang() === 'es' ? 'en' : 'es';
    this.languageService.setLanguage(nextLang);
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }

  formatCurrency(value: number): string {
    const locale = this.currentLang() === 'es' ? 'es-MX' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  goToCommunity(): void {
    this.router.navigate(['/community']);
  }

  formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }
}
