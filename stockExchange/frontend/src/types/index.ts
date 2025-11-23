export interface Broker {
  id: string;
  name: string;
  cash: number;
  active: boolean;
}

export interface Stock {
  symbol: string;
  name: string;
  selected: boolean;
}

export interface QuotePoint {
  date: string;
  open: number;
}

export interface MarketSettings {
  startDate: string;
  tickIntervalSec: number;
  speedMultiplier: number;
  status: 'idle' | 'running';
}

export interface SimulationTick {
  date: string;
  prices: Array<{
    symbol: string;
    open: number;
  }>;
}

export interface Credentials {
  username: string;
  password: string;
}
