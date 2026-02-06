import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, User, Mail, Calendar, Shield, Trash2, Save, ArrowLeft, Languages, Moon, Sun, CheckCircle, Share2, Globe, Check, Palette, ExternalLink, Download } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { UserService, UserProfile } from '../../core/services/user.service';
import { CommunityService } from '../../core/services/community.service';
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
  private communityService = inject(CommunityService);
  
  // Icons
  readonly icons = { User, Mail, Calendar, Shield, Trash2, Save, ArrowLeft, Languages, Moon, Sun, CheckCircle, Share2, Globe, Check, Palette, ExternalLink, Download };

  // UI State
  isLoading = signal(false);
  isSaving = signal(false);
  isGeneratingSnapshot = signal(false);
  followerCount = signal(0);
  
  // Data Signals
  currentUser = toSignal(this.authService.currentUser$);
  assets = toSignal(this.portfolioService.assets$, { initialValue: [] });
  currentTheme = this.themeService.theme;
  currentLang = this.languageService.currentLang;
  
  // Extended Profile Data
  fullProfile = signal<UserProfile | null>(null);
  bannerColors = signal<string[]>(['#4f46e5', '#7c3aed', '#db2777']);

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
              if (myProfile.banner_colors && myProfile.banner_colors.length === 3) {
                  this.bannerColors.set(myProfile.banner_colors);
              }
              this.communityService.getFollowerCount(userId).subscribe(c => this.followerCount.set(c));
          }
       });
    }
  }

  bannerPalettes = [
    { name: 'Zenith', colors: ['#4f46e5', '#7c3aed', '#db2777'] },
    { name: 'Cyberpunk', colors: ['#f472b6', '#a855f7', '#6366f1'] },
    { name: 'Ocean', colors: ['#06b6d4', '#3b82f6', '#1d4ed8'] },
    { name: 'Fire', colors: ['#f97316', '#ef4444', '#991b1b'] },
    { name: 'Forest', colors: ['#10b981', '#059669', '#064e3b'] },
    { name: 'Slate', colors: ['#475569', '#1e293b', '#0f172a'] }
  ];

  updateColor(index: number, event: Event) {
    const color = (event.target as HTMLInputElement).value;
    const newColors = [...this.bannerColors()];
    newColors[index] = color;
    this.bannerColors.set(newColors);
    this.saveBannerColors();
  }

  applyPalette(colors: string[]) {
    this.bannerColors.set([...colors]);
    this.saveBannerColors();
  }

  async shareProfile() {
    if (this.isGeneratingSnapshot()) return;
    
    this.isGeneratingSnapshot.set(true);
    const username = this.fullProfile()?.username;
    if (!username) {
        this.isGeneratingSnapshot.set(false);
        return;
    }

    const shareUrl = `${window.location.origin}/u/${username}`;
    const text = `¡Mira mi portafolio en Zenith Finance! 🚀 Sigue mi progreso aquí:`;
    const title = `Zenith Finance - ${this.fullProfile()?.name || 'Inversor'}`;

    try {
      // 1. Copy link to clipboard immediately
      await navigator.clipboard.writeText(`${text} ${shareUrl}`);
      
      // 2. Try to generate and share the image card
      const element = document.getElementById('share-card-template');
      if (element && navigator.share) {
        const h2c = (await import('html2canvas')).default;
        const canvas = await h2c(element, { useCORS: true, scale: 2, backgroundColor: null });
        
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
          const file = new File([blob], 'ZenithProfile.png', { type: 'image/png' });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: title,
              text: text,
              url: shareUrl
            });
            this.toastService.success('¡Portafolio compartido!');
            return;
          }
        }
      }

      // Fallback: system share or just copy link
      if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
        this.toastService.success('¡Enlace compartido!');
      } else {
        this.toastService.success('¡Enlace de perfil copiado!');
      }

    } catch (error) {
      console.warn('Share interaction failed:', error);
      this.toastService.info('Enlace copiado al portapapeles');
    } finally {
      this.isGeneratingSnapshot.set(false);
    }
  }

  saveBannerColors() {
    this.userService.updateBannerColors(this.bannerColors()).subscribe(() => {
        this.toastService.success('Banner actualizado');
    });
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
