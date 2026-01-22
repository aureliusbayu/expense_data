
export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  paymentMethod: string;
}

export interface CategorySummary {
  category: string;
  total: number;
}

export interface TimeSeriesData {
  date: string;
  amount: number;
}

export interface AIAnalysis {
  summary: string;
  recommendations: string[];
  anomalies: string[];
}
