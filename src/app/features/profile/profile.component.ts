import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, User, Mail, Calendar, Shield, Trash2, Save, ArrowLeft, Languages, Moon, Sun, CheckCircle, Share2, Globe, Check } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { UserService, UserProfile } from '../../core/services/user.service';
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
  private userService = inject(UserService);
  private router = inject(Router);
  
  // Icons
  readonly icons = { User, Mail, Calendar, Shield, Trash2, Save, ArrowLeft, Languages, Moon, Sun, CheckCircle, Share2, Globe, Check };

  // UI State
  isLoading = signal(false);
  isSaving = signal(false);
  
  // Data Signals
  currentUser = toSignal(this.authService.currentUser$);
  assets = toSignal(this.portfolioService.assets$, { initialValue: [] });
  currentTheme = this.themeService.theme;
  currentLang = this.languageService.currentLang;
  
  // Extended Profile Data
  fullProfile = signal<UserProfile | null>(null);

  profileForm!: FormGroup;
  privacyForm!: FormGroup;

  ngOnInit(): void {
    const user = this.currentUser();
    this.profileForm = this.fb.group({
      name: [user?.name || '', [Validators.required, Validators.minLength(2)]],
      email: [{ value: user?.email || '', disabled: true }]
    });

    this.privacyForm = this.fb.group({
        show_balance: [false],
        show_assets: [true],
        show_analytics: [true],
        show_followers: [false]
    });

    // Load full profile with username and settings
    if (user?.email) {
       // We can search by name or logic to get the profile ID mostly handled by authService but userService has direct table access
       // Wait, authService.currentUser$ only has basic data from metadata. Need DB profile.
       const userId = user.id;
       // We'll reuse getProfileByUsername but we need our own username first or fetch by ID
       // Let's add getMyProfile to UserService or just rely on what we have. 
       // Actually authentication user metadata might not have the username we just generated in SQL.
       // We need to fetch the profile from DB.
       this.userService.getUsers(undefined).subscribe(users => {
          const myProfile = users.find(u => u.id === userId);
          if (myProfile) {
              this.fullProfile.set(myProfile);
              if (myProfile.privacy_settings) {
                  this.privacyForm.patchValue(myProfile.privacy_settings);
              }
          }
       });
    }
  }

  savePrivacy() {
      if (this.privacyForm.dirty) {
          const settings = this.privacyForm.value;
          this.userService.updatePrivacySettings(settings).subscribe(() => {
             this.toastService.success('Privacidad actualizada');
             this.privacyForm.markAsPristine();
             // Update local state
             this.fullProfile.update(p => p ? {...p, privacy_settings: settings} : null);
          });
      }
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
