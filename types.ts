
export interface MarketplaceListing {
  is_unclear: boolean;
  unclear_message?: string;
  suggested_title: string;
  estimated_price_range: string;
  suggested_list_price: string;
  quick_sell_price: string;
  new_price: string;
  description: string;
  description_quick_sell: string;
  category_suggestion: string;
  comparable_items: string[];
  keywords: string[];
  market_stock_status: {
    ebay: string;
    gumtree: string;
    cash_converters: string;
  };
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface AnalysisState {
  loading: boolean;
  error: string | null;
  listing: MarketplaceListing | null;
  sources: GroundingSource[];
  statusMessage: string;
}
