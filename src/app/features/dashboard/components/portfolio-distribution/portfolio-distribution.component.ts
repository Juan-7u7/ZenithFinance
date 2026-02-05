import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartType, ChartOptions } from 'chart.js';
import { PortfolioAsset } from '../../../../core/models/asset.model';
import { registerChartComponents } from '../../../../core/config/chart.config';

@Component({
  selector: 'app-portfolio-distribution',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './portfolio-distribution.component.html',
  styleUrl: './portfolio-distribution.component.scss'
})
export class PortfolioDistributionComponent implements OnChanges {
  @Input() assets: PortfolioAsset[] = [];

  constructor() {
    registerChartComponents();
  }

  // Chart Properties
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      { 
        data: [],
        backgroundColor: [
          '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444', 
          '#f59e0b', '#10b981', '#3b82f6', '#06b6d4', '#84cc16'
        ],
        hoverBackgroundColor: [
          '#4f46e5', '#7c3aed', '#db2777', '#e11d48', '#dc2626', 
          '#d97706', '#059669', '#2563eb', '#0891b2', '#65a30d'
        ],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };
  
  public doughnutChartType: 'doughnut' = 'doughnut';
  public doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter, sans-serif', size: 12 },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const value = context.raw as number;
            const total = (context.chart as any)._metasets[context.datasetIndex].total as number;
            const percentage = ((value / total) * 100).toFixed(1) + '%';
            return ` ${context.label}: ${value.toLocaleString('en-US', {style: 'currency', currency: 'USD'})} (${percentage})`;
          }
        }
      }
    },
    cutout: '70%', 
    layout: {
      padding: 10
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assets'] && this.assets) {
      this.updateChartData();
    }
  }

  private updateChartData(): void {
    if (!this.assets.length) return;

    // Sort by value (desc)
    const sortedAssets = [...this.assets].sort((a, b) => b.totalValue - a.totalValue);
    
    // Take top 5 and group others
    const topAssets = sortedAssets.slice(0, 5);
    const otherAssets = sortedAssets.slice(5);
    
    const labels = topAssets.map(a => a.symbol.toUpperCase());
    const data = topAssets.map(a => a.totalValue);

    if (otherAssets.length > 0) {
      const otherValue = otherAssets.reduce((sum, a) => sum + a.totalValue, 0);
      labels.push('OTROS');
      data.push(otherValue);
    }

    this.doughnutChartData = {
      labels: labels,
      datasets: [{
        ...this.doughnutChartData.datasets[0],
        data: data
      }]
    };
  }
}
