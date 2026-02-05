import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to be initialized from Supabase
  return toObservable(authService.isInitialized).pipe(
    filter(initialized => initialized), // Only proceed when initialized is true
    take(1), // Complete after first true
    map(() => {
      if (authService.isAuthenticated()) {
        return true;
      }

      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    })
  );
};
