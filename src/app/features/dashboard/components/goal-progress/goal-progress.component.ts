import { Component, inject, input, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoalService } from '../../../../core/services/goal.service';
import { LucideAngularModule, Target, Trophy, Plus, Settings2, TrendingUp, Calendar } from 'lucide-angular';
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
  profitLossPercentage = input<number>(0); // Growth rate from dashboard
  
  // Signals from Service
  goals = this.goalService.goals;

  readonly icons = { Target, Trophy, Plus, Settings2, TrendingUp, Calendar };

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

  /**
   * Calculate estimated time to reach goal based on current growth rate
   */
  get estimatedTimeToGoal(): { months: number; days: number; text: string } | null {
    if (!this.activeGoal || this.remainingAmount <= 0) return null;
    
    const growthRate = this.profitLossPercentage() / 100; // Convert to decimal
    
    // If no growth or negative growth, can't predict
    if (growthRate <= 0) {
      return { months: 0, days: 0, text: 'Sin crecimiento detectado' };
    }

    const currentAmount = this.currentBalance();
    const targetAmount = this.activeGoal.target_amount;
    
    // Calculate months needed: log(target/current) / log(1 + monthlyRate)
    // Assuming the growth rate is annual, convert to monthly
    const monthlyGrowthRate = Math.pow(1 + growthRate, 1/12) - 1;
    
    if (monthlyGrowthRate <= 0) {
      return { months: 0, days: 0, text: 'Crecimiento insuficiente' };
    }

    const monthsNeeded = Math.log(targetAmount / currentAmount) / Math.log(1 + monthlyGrowthRate);
    
    if (!isFinite(monthsNeeded) || monthsNeeded < 0) {
      return { months: 0, days: 0, text: 'No se puede calcular' };
    }

    const totalMonths = Math.floor(monthsNeeded);
    const remainingDays = Math.round((monthsNeeded - totalMonths) * 30);

    // Generate text
    let text = '';
    if (totalMonths === 0 && remainingDays === 0) {
      text = '¡Ya casi!';
    } else if (totalMonths === 0) {
      text = `~${remainingDays} días`;
    } else if (totalMonths < 12) {
      text = `~${totalMonths} ${totalMonths === 1 ? 'mes' : 'meses'}`;
    } else {
      const years = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;
      text = `~${years} ${years === 1 ? 'año' : 'años'}`;
      if (months > 0) text += ` y ${months} ${months === 1 ? 'mes' : 'meses'}`;
    }

    return { months: totalMonths, days: remainingDays, text };
  }

  /**
   * Get growth trend indicator
   */
  get growthTrend(): 'positive' | 'neutral' | 'negative' {
    const rate = this.profitLossPercentage();
    if (rate > 0) return 'positive';
    if (rate < 0) return 'negative';
    return 'neutral';
  }

  openGoalSettings() {
    this.goalModal.open();
  }
}
