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
          '#6366f1', // Indigo
          '#8b5cf6', // Violet
          '#06b6d4', // Cyan
          '#f43f5e', // Rose
          '#10b981', // Emerald
          '#f59e0b'  // Amber
        ],
        hoverBackgroundColor: [
          '#4f46e5', '#7c3aed', '#0891b2', '#e11d48', '#059669', '#d97706'
        ],
        borderWidth: 0,
        hoverOffset: 12,
        borderRadius: 8,
        spacing: 4
      }
    ]
  };

  public customLegend: { label: string; value: number; percentage: string; color: string }[] = [];
  public totalValueVisible = 0;
  
  public doughnutChartType: 'doughnut' = 'doughnut';
  public doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // We'll use a custom legend
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        cornerRadius: 12,
        boxPadding: 6,
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
    cutout: '82%', 
    layout: {
      padding: 15
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assets'] && this.assets) {
      this.updateChartData();
    }
  }

  private updateChartData(): void {
    if (!this.assets.length) {
      this.totalValueVisible = 0;
      this.customLegend = [];
      return;
    }

    const totalValue = this.assets.reduce((sum, a) => sum + a.totalValue, 0);
    this.totalValueVisible = totalValue;

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

    // Update Custom Legend
    const colors = this.doughnutChartData.datasets[0].backgroundColor as string[];
    this.customLegend = labels.map((label, index) => ({
      label,
      value: data[index],
      percentage: ((data[index] / totalValue) * 100).toFixed(1) + '%',
      color: colors[index % colors.length]
    }));
  }
}
