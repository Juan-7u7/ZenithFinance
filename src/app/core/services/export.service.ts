import { Injectable } from '@angular/core';
import { PortfolioAsset, Transaction } from '../models/asset.model';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  /**
   * Export portfolio to CSV
   */
  exportPortfolioToCSV(assets: PortfolioAsset[], totalValue: number, profitLoss: number): void {
    const headers = ['Symbol', 'Name', 'Quantity', 'Purchase Price', 'Current Price', 'Total Value', 'Profit/Loss', 'P/L %'];
    
    const rows = assets.map(asset => [
      asset.symbol,
      asset.name,
      asset.quantity.toString(),
      `$${asset.averageBuyPrice.toFixed(2)}`,
      `$${asset.currentPrice.toFixed(2)}`,
      `$${asset.totalValue.toFixed(2)}`,
      `$${asset.profitLoss.toFixed(2)}`,
      `${asset.profitLossPercentage.toFixed(2)}%`
    ]);

    // Add summary row
    rows.push([]);
    rows.push(['TOTAL', '', '', '', '', `$${totalValue.toFixed(2)}`, `$${profitLoss.toFixed(2)}`, '']);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    this.downloadFile(csvContent, 'zenith-portfolio.csv', 'text/csv');
  }

  /**
   * Export transactions to CSV
   */
  exportTransactionsToCSV(transactions: Transaction[]): void {
    const headers = ['Date', 'Type', 'Symbol', 'Quantity', 'Price', 'Total'];
    
    const rows = transactions.map(tx => [
      new Date(tx.date).toLocaleDateString(),
      tx.type,
      tx.symbol || '',
      tx.amount.toString(),
      `$${tx.price_per_unit.toFixed(2)}`,
      `$${tx.total.toFixed(2)}`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    this.downloadFile(csvContent, 'zenith-transactions.csv', 'text/csv');
  }

  /**
   * Export portfolio to PDF (simplified HTML-to-PDF)
   */
  exportPortfolioToPDF(assets: PortfolioAsset[], totalValue: number, profitLoss: number, profitLossPercentage: number): void {
    const date = new Date().toLocaleDateString();
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Zenith Finance - Portfolio Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', system-ui, sans-serif; 
      padding: 40px; 
      background: #fff;
      color: #1a1a2e;
    }
    .header { 
      text-align: center; 
      margin-bottom: 40px; 
      border-bottom: 3px solid #6366f1;
      padding-bottom: 20px;
    }
    .header h1 { 
      font-size: 32px; 
      color: #6366f1; 
      margin-bottom: 8px;
      font-weight: 800;
    }
    .header p { 
      color: #64748b; 
      font-size: 14px;
    }
    .summary { 
      display: grid; 
      grid-template-columns: repeat(3, 1fr); 
      gap: 20px; 
      margin-bottom: 40px;
    }
    .summary-card { 
      background: #f8fafc; 
      padding: 20px; 
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .summary-card h3 { 
      font-size: 12px; 
      color: #64748b; 
      text-transform: uppercase; 
      margin-bottom: 8px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .summary-card p { 
      font-size: 28px; 
      font-weight: 800; 
      color: #1a1a2e;
    }
    .summary-card.positive p { color: #22c55e; }
    .summary-card.negative p { color: #ef4444; }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 20px;
      background: #fff;
    }
    th { 
      background: #6366f1; 
      color: white; 
      padding: 14px; 
      text-align: left; 
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td { 
      padding: 12px 14px; 
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    tr:hover { background: #f8fafc; }
    .positive { color: #22c55e; font-weight: 700; }
    .negative { color: #ef4444; font-weight: 700; }
    .footer { 
      margin-top: 40px; 
      text-align: center; 
      color: #94a3b8; 
      font-size: 12px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    @media print {
      body { padding: 20px; }
      .summary { page-break-inside: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Zenith Finance</h1>
    <p>Portfolio Report - ${date}</p>
  </div>

  <div class="summary">
    <div class="summary-card">
      <h3>Total Value</h3>
      <p>$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    </div>
    <div class="summary-card ${profitLoss >= 0 ? 'positive' : 'negative'}">
      <h3>Profit/Loss</h3>
      <p>${profitLoss >= 0 ? '+' : ''}$${profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    </div>
    <div class="summary-card ${profitLossPercentage >= 0 ? 'positive' : 'negative'}">
      <h3>Return</h3>
      <p>${profitLossPercentage >= 0 ? '+' : ''}${profitLossPercentage.toFixed(2)}%</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Asset</th>
        <th>Quantity</th>
        <th>Purchase Price</th>
        <th>Current Price</th>
        <th>Total Value</th>
        <th>Profit/Loss</th>
        <th>Return %</th>
      </tr>
    </thead>
    <tbody>
      ${assets.map(asset => `
        <tr>
          <td><strong>${asset.symbol}</strong><br><small style="color: #64748b;">${asset.name}</small></td>
          <td>${asset.quantity}</td>
          <td>$${asset.averageBuyPrice.toFixed(2)}</td>
          <td>$${asset.currentPrice.toFixed(2)}</td>
          <td><strong>$${asset.totalValue.toFixed(2)}</strong></td>
          <td class="${asset.profitLoss >= 0 ? 'positive' : 'negative'}">
            ${asset.profitLoss >= 0 ? '+' : ''}$${asset.profitLoss.toFixed(2)}
          </td>
          <td class="${asset.profitLossPercentage >= 0 ? 'positive' : 'negative'}">
            ${asset.profitLossPercentage >= 0 ? '+' : ''}${asset.profitLossPercentage.toFixed(2)}%
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Generated by Zenith Finance - ${new Date().toLocaleString()}</p>
    <p>This report is for informational purposes only and does not constitute financial advice.</p>
  </div>
</body>
</html>
    `;

    // Create blob and download directly
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zenith-portfolio-${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Helper to download file
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
