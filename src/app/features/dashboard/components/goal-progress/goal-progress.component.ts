import { Component, inject, input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoalService } from '../../../../core/services/goal.service';
import { LucideAngularModule, Target, Trophy, Plus, Settings2 } from 'lucide-angular';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { GoalModalComponent } from '../goal-modal/goal-modal.component';

@Component({
  selector: 'app-goal-progress',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe, GoalModalComponent],
  templateUrl: './goal-progress.component.html',
  styleUrls: ['./goal-progress.component.scss']
})
export class GoalProgressComponent {
  private goalService = inject(GoalService);
  @ViewChild('goalModal') goalModal!: GoalModalComponent;
  
  // Inputs
  currentBalance = input<number>(0);
  
  // Signals from Service
  goals = this.goalService.goals;

  readonly icons = { Target, Trophy, Plus, Settings2 };

  get activeGoal() {
    return this.goals()[0]; // Support first goal for now
  }

  get progressPercentage() {
    if (!this.activeGoal) return 0;
    const progress = (this.currentBalance() / this.activeGoal.target_amount) * 100;
    return Math.min(progress, 100);
  }

  get remainingAmount() {
    if (!this.activeGoal) return 0;
    return Math.max(0, this.activeGoal.target_amount - this.currentBalance());
  }

  openGoalSettings() {
    this.goalModal.open();
  }
}
