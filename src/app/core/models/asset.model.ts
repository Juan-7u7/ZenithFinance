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

// Strict Database Model
export interface DatabaseAsset {
  id?: string;
  user_id: string;
  symbol: string;
  asset_name: string;
  amount: number;
  purchase_price: number;
  created_at?: Date;
  asset_id: string; // CoinGecko ID for mapping
}

export interface Transaction {
  id?: string;
  user_id: string;
  asset_id: string;
  type: 'buy' | 'sell';
  amount: number;
  price_per_unit: number;
  total: number;
  date: Date;
}

export interface PortfolioAsset {
  id?: string; // Database ID
  assetId: string;
  symbol: string;
  name: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  image?: string;
  change24h?: number;
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
