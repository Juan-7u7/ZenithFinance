import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, X, Save, Target, Trophy, Info } from 'lucide-angular';
import { GoalService } from '../../../../core/services/goal.service';
import { FinancialGoal } from '../../../../core/models/automation.model';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-goal-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './goal-modal.component.html',
  styleUrls: ['./goal-modal.component.scss']
})
export class GoalModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private goalService = inject(GoalService);
  private toastService = inject(ToastService);

  visible = signal(false);
  isLoading = signal(false);
  goalForm!: FormGroup;

  readonly icons = { X, Save, Target, Trophy, Info };

  ngOnInit() {
    const activeGoal = this.goalService.goals()[0];
    this.goalForm = this.fb.group({
      name: [activeGoal?.name || 'Mi Meta Principal', [Validators.required, Validators.minLength(3)]],
      target_amount: [activeGoal?.target_amount || 10000, [Validators.required, Validators.min(1)]]
    });
  }

  open() {
    this.visible.set(true);
    const activeGoal = this.goalService.goals()[0];
    if (activeGoal) {
      this.goalForm.patchValue({
        name: activeGoal.name,
        target_amount: activeGoal.target_amount
      });
    }
  }

  close() {
    this.visible.set(false);
  }

  onSubmit() {
    if (this.goalForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    const activeGoal = this.goalService.goals()[0];
    
    const goalData: Partial<FinancialGoal> = {
      ...this.goalForm.value,
      id: activeGoal?.id // Upsert if exists
    };

    this.goalService.setGoal(goalData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastService.show('success', 'Meta actualizada correctamente');
        this.close();
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.show('error', 'Error al guardar la meta');
      }
    });
  }
}
