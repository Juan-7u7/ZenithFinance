export interface Asset {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  marketCap: number;
  volume24h: number;
  image: string;
  lastUpdate: Date;
}

export interface PriceHistory {
  timestamp: Date;
  price: number;
}

export interface PortfolioAsset {
  assetId: string;
  symbol: string;
  name: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
}

export interface PriceAlert {
  id: string;
  assetId: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  createdAt: Date;
  triggeredAt?: Date;
}

export interface Portfolio {
  id: string;
  userId: string;
  assets: PortfolioAsset[];
  totalValue: number;
  totalInvestment: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
}
