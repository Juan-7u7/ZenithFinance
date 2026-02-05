import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Eye, EyeOff } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);
  readonly icons = { Eye, EyeOff };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password })
      .pipe(
        tap(() => {
          this.isLoading.set(false);
          this.router.navigate(['/dashboard']);
        }),
        catchError(error => {
          this.isLoading.set(false);
          this.errorMessage.set(error.message || 'Error al iniciar sesión');
          return of(null);
        })
      )
      .subscribe();
  }

  async loginWithProvider(provider: 'google' | 'github') {
    this.isLoading.set(true);
    try {
      await this.authService.loginWithProvider(provider);
    } catch (error: any) {
      this.isLoading.set(false);
      this.errorMessage.set(error.message);
    }
  }

  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    if (!control || !control.touched) return '';

    if (control.hasError('required')) return 'Este campo es requerido';
    if (control.hasError('email')) return 'Email inválido';
    if (control.hasError('minlength')) return 'Mínimo 6 caracteres';

    return '';
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }
}
