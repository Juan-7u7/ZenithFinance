import { Injectable, inject, signal } from '@angular/core';
import { Supabase } from './supabase';
import { AuthService } from './auth.service';
import { from, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { FinancialGoal } from '../models/automation.model';

@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private supabase = inject(Supabase);
  private authService = inject(AuthService);

  goals = signal<FinancialGoal[]>([]);

  constructor() {
    this.loadGoals();
  }

  loadGoals() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    from(
      this.supabase.getClient()
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id)
    ).subscribe(({ data, error }) => {
      if (!error && data) {
        this.goals.set(data);
      }
    });
  }

  setGoal(goal: Partial<FinancialGoal>): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!user) return of(null);

    const goalData = {
      ...goal,
      user_id: user.id
    };

    return from(
      this.supabase.getClient()
        .from('financial_goals')
        .upsert(goalData)
        .select()
        .single()
    ).pipe(
      tap(({ data, error }) => {
        if (!error && data) {
          this.loadGoals();
        }
      })
    );
  }

  deleteGoal(id: string): Observable<any> {
    return from(
      this.supabase.getClient()
        .from('financial_goals')
        .delete()
        .eq('id', id)
    ).pipe(
      tap(({ error }) => {
        if (!error) {
          this.goals.update(curr => curr.filter(g => g.id !== id));
        }
      })
    );
  }
}
