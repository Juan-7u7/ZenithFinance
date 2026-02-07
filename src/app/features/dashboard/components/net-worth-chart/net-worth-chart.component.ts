import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, TrendingUp, TrendingDown, Calendar } from 'lucide-angular';
import { NetWorthService, NetWorthSnapshot } from '../../../../core/services/net-worth.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-net-worth-chart',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './net-worth-chart.component.html',
  styleUrls: ['./net-worth-chart.component.scss']
})
export class NetWorthChartComponent implements OnInit {
  private netWorthService = inject(NetWorthService);
  private authService = inject(AuthService);

  snapshots = signal<NetWorthSnapshot[]>([]);
  selectedPeriod = signal<number>(30); // days
  isLoading = signal(true);

  readonly icons = { TrendingUp, TrendingDown, Calendar };

  readonly periods = [
    { days: 7, label: '7D' },
    { days: 30, label: '1M' },
    { days: 90, label: '3M' },
    { days: 180, label: '6M' }
  ];

  // Computed values
  chartData = computed(() => {
    const data = this.snapshots();
    if (data.length === 0) return [];

    const maxValue = Math.max(...data.map(s => s.total_value));
    const minValue = Math.min(...data.map(s => s.total_value));
    const range = maxValue - minValue || 1;

    return data.map((snapshot, index) => ({
      ...snapshot,
      x: (index / (data.length - 1 || 1)) * 100,
      y: 100 - ((snapshot.total_value - minValue) / range) * 100,
      percentage: ((snapshot.total_value - minValue) / range) * 100
    }));
  });

  pathData = computed(() => {
    const data = this.chartData();
    if (data.length === 0) return '';

    const points = data.map(d => `${d.x},${d.y}`).join(' L ');
    return `M ${points}`;
  });

  areaPath = computed(() => {
    const data = this.chartData();
    if (data.length === 0) return '';

    const points = data.map(d => `${d.x},${d.y}`).join(' L ');
    return `M 0,100 L ${points} L 100,100 Z`;
  });

  currentValue = computed(() => {
    const data = this.snapshots();
    return data.length > 0 ? data[data.length - 1].total_value : 0;
  });

  startValue = computed(() => {
    const data = this.snapshots();
    return data.length > 0 ? data[0].total_value : 0;
  });

  totalChange = computed(() => {
    return this.currentValue() - this.startValue();
  });

  totalChangePercentage = computed(() => {
    const start = this.startValue();
    if (start === 0) return 0;
    return ((this.currentValue() - start) / start) * 100;
  });

  trend = computed(() => {
    return this.totalChange() >= 0 ? 'up' : 'down';
  });

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.isLoading.set(true);
    this.netWorthService.getHistory(user.id, this.selectedPeriod()).subscribe({
      next: (data) => {
        this.snapshots.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load net worth history:', error);
        this.isLoading.set(false);
      }
    });
  }

  selectPeriod(days: number) {
    this.selectedPeriod.set(days);
    this.loadHistory();
  }

  formatDate(timestamp: string): string {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    });
  }
}
