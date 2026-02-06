import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { LucideAngularModule, Lock, Eye, EyeOff, CheckCircle } from 'lucide-angular';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  resetForm: FormGroup;
  isLoading = signal(false);
  isSubmitted = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  errorMessage = signal<string | null>(null);
  readonly icons = { Lock, Eye, EyeOff, CheckCircle };

  constructor() {
    this.resetForm = this.fb.group({
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
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.updatePassword(this.resetForm.value.password)
      .pipe(
        tap(() => {
          this.isLoading.set(false);
          this.isSubmitted.set(true);
          this.toastService.show('success', 'Contraseña actualizada con éxito');
        }),
        catchError(error => {
          this.isLoading.set(false);
          this.errorMessage.set(error.message || 'Error al actualizar la contraseña');
          return of(null);
        })
      )
      .subscribe();
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(v => !v);
  }

  getErrorMessage(field: string): string {
    const control = this.resetForm.get(field);
    if (!control || !control.touched) return '';

    if (control.hasError('required')) return 'Este campo es requerido';
    if (control.hasError('minlength')) return 'Mínimo 8 caracteres';
    if (control.hasError('pattern')) return 'Debe tener mayús., minús., número y símbolo';
    
    if (field === 'confirmPassword' && this.resetForm.hasError('passwordMismatch')) {
      return 'Las contraseñas no coinciden';
    }

    return '';
  }
}
