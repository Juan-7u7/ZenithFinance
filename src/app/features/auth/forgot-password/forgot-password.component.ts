import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { LucideAngularModule, ArrowLeft, Mail, CheckCircle } from 'lucide-angular';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  isLoading = signal(false);
  isSubmitted = signal(false);
  errorMessage = signal<string | null>(null);
  readonly icons = { ArrowLeft, Mail, CheckCircle };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.forgotPassword(this.forgotForm.value.email)
      .pipe(
        tap(() => {
          this.isLoading.set(false);
          this.isSubmitted.set(true);
        }),
        catchError(error => {
          this.isLoading.set(false);
          this.errorMessage.set(error.message || 'Error al enviar el correo');
          return of(null);
        })
      )
      .subscribe();
  }

  getErrorMessage(field: string): string {
    const control = this.forgotForm.get(field);
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return 'Este campo es requerido';
    if (control.hasError('email')) return 'Email inválido';
    return '';
  }
}
