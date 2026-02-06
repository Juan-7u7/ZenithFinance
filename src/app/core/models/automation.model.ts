export interface PriceAlert {
  id: string;
  user_id: string;
  asset_id: string;
  symbol: string;
  target_price: number;
  condition: 'ABOVE' | 'BELOW';
  is_active: boolean;
  created_at?: string;
  triggered_at?: string;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount?: number;
  deadline?: string;
  created_at?: string;
}
