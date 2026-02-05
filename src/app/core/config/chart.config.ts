import { Chart, ArcElement, PieController, DoughnutController, Tooltip, Legend } from 'chart.js';

export function registerChartComponents() {
  Chart.register(ArcElement, PieController, DoughnutController, Tooltip, Legend);
}
