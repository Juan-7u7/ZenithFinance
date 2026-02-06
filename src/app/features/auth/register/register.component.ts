import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Eye, EyeOff, Mail } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule, TranslatePipe],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  errorMessage = signal<string | null>(null);
  readonly icons = { Eye, EyeOff, Mail };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { name, email, password } = this.registerForm.value;

    this.authService.register({ name, email, password })
      .pipe(
        tap(() => {
          this.isLoading.set(false);
          this.router.navigate(['/dashboard']);
        }),
        catchError(error => {
          this.isLoading.set(false);
          // Handle 'user_already_exists' or other specific errors efficiently
          this.errorMessage.set(error.message || 'Error al registrar usuario');
          return of(null);
        })
      )
      .subscribe();
  }

  async loginWithProvider(provider: 'google' | 'github') {
    this.isLoading.set(true);
    try {
      await this.authService.loginWithProvider(provider);
      // Redirect happens automatically by Supabase/Browser
    } catch (error: any) {
      this.isLoading.set(false);
      this.errorMessage.set(error.message);
    }
  }

  getErrorMessage(field: string): string {
    const control = this.registerForm.get(field);
    if (!control || !control.touched) return '';

    if (control.hasError('required')) return 'common.required';
    if (control.hasError('email')) return 'common.invalid_email';
    if (control.hasError('minlength')) return 'common.min_length';
    
    if (control.hasError('pattern') && field === 'password') {
      return 'common.password_pattern';
    }

    if (field === 'confirmPassword' && this.registerForm.hasError('passwordMismatch')) {
      return 'common.password_mismatch';
    }

    return '';
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(v => !v);
  }
}
