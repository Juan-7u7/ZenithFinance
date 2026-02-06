import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, User, UserPlus } from 'lucide-angular';
import { UserService, UserProfile } from '../../../../core/services/user.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { Router } from '@angular/router';
import { ThemeService } from '../../../../core/services/theme.service';
import { LanguageService } from '../../../../core/services/language.service';
import { Settings, LogOut, Moon, Sun, Languages, ArrowLeft } from 'lucide-angular';
import { AuthService } from '../../../../core/services/auth.service';

import { UserCardComponent } from '../../../../shared/components/user-card/user-card.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslatePipe, UserCardComponent],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  public languageService = inject(LanguageService);
  private authService = inject(AuthService);

  searchQuery = signal('');
  users = signal<UserProfile[]>([]);
  loading = signal(false);
  
  currentTheme = this.themeService.theme;
  currentLang = this.languageService.currentLang;

  readonly icons = {
    Search,
    User,
    UserPlus,
    LogOut,
    Moon,
    Sun,
    Languages,
    ArrowLeft
  };

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    const userId = this.authService.getCurrentUser()?.id;
    this.userService.getUsers(userId).subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch() {
    const query = this.searchQuery();
    const userId = this.authService.getCurrentUser()?.id;
    this.loading.set(true);
    this.userService.searchUsers(query, userId).subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  goBack(): void {
      this.router.navigate(['/dashboard']);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleLanguage(): void {
    const nextLang = this.currentLang() === 'es' ? 'en' : 'es';
    this.languageService.setLanguage(nextLang);
  }

  goToProfile(): void {
      this.router.navigate(['/profile']);
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}
