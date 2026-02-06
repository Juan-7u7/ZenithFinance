import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, User, Mail, Calendar, Shield, Trash2, Save, ArrowLeft, Languages, Moon, Sun, CheckCircle } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { ThemeService } from '../../core/services/theme.service';
import { PortfolioService } from '../../core/services/portfolio.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, LucideAngularModule, TranslatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private languageService = inject(LanguageService);
  private themeService = inject(ThemeService);
  private portfolioService = inject(PortfolioService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Icons
  readonly icons = { User, Mail, Calendar, Shield, Trash2, Save, ArrowLeft, Languages, Moon, Sun, CheckCircle };

  // UI State
  isLoading = signal(false);
  isSaving = signal(false);
  
  // Data Signals
  currentUser = toSignal(this.authService.currentUser$);
  assets = toSignal(this.portfolioService.assets$, { initialValue: [] });
  currentTheme = this.themeService.theme;
  currentLang = this.languageService.currentLang;

  profileForm!: FormGroup;

  ngOnInit(): void {
    const user = this.currentUser();
    this.profileForm = this.fb.group({
      name: [user?.name || '', [Validators.required, Validators.minLength(2)]],
      email: [{ value: user?.email || '', disabled: true }]
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.isSaving()) return;

    this.isSaving.set(true);
    const { name } = this.profileForm.value;

    this.authService.updateProfile({ name }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastService.success(this.languageService.translate('profile.update_success'));
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toastService.error(err.message || 'Error updating profile');
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

  getMemberSince(): Date {
    return this.currentUser()?.createdAt || new Date();
  }

  getPortfolioStats() {
    const assets = this.assets();
    return {
      count: assets.length,
      totalInvested: assets.reduce((sum, a) => sum + (a.amount * a.purchase_price), 0)
    };
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
