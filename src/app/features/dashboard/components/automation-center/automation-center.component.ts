import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Zap, Target, Bell, Trash2, X, Plus, TrendingUp, BellRing, Calculator, FileText, Download, Box } from 'lucide-angular';
import { AlertService } from '../../../../core/services/alert.service';
import { GoalService } from '../../../../core/services/goal.service';
import { DashboardStateService } from '../../dashboard-state.service';

@Component({
  selector: 'app-automation-center',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './automation-center.component.html',
  styleUrls: ['./automation-center.component.scss']
})
export class AutomationCenterComponent {
  private alertService = inject(AlertService);
  private goalService = inject(GoalService);
  private dashboardState = inject(DashboardStateService);

  @Output() openWhatIf = new EventEmitter<void>();
  @Output() exportPdf = new EventEmitter<void>();
  @Output() exportCsv = new EventEmitter<void>();

  visible = signal(false);
  activeTab = signal<'alerts' | 'goals' | 'utilities'>('alerts');

  // Logic data
  alerts = this.alertService.alerts;
  goals = this.goalService.goals;
  currentBalance = () => this.dashboardState.state().totalValue;

  readonly icons = { Zap, Target, Bell, Trash2, X, Plus, TrendingUp, BellRing, Calculator, FileText, Download, Box };

  open() {
    this.visible.set(true);
  }

  close() {
    this.visible.set(false);
  }

  removeAlert(id: string) {
    this.alertService.deleteAlert(id).subscribe();
  }

  removeGoal(id: string) {
    this.goalService.deleteGoal(id).subscribe();
  }

  getProgress(target: number) {
    const progress = (this.currentBalance() / target) * 100;
    return Math.min(progress, 100);
  }
}
