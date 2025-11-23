import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import type { QuotePoint, Stock } from '../../types';

interface StocksState {
  items: Stock[];
  histories: Record<string, QuotePoint[]>;
  status: 'idle' | 'loading' | 'failed';
  historyStatus: 'idle' | 'loading' | 'failed';
  error?: string;
}

const initialState: StocksState = {
  items: [],
  histories: {},
  status: 'idle',
  historyStatus: 'idle',
};

export const fetchStocksCatalog = createAsyncThunk('stocks/fetchAll', async () => {
  const { data } = await api.get<Stock[]>('/stocks');
  return data;
});

export const updateStockSelection = createAsyncThunk(
  'stocks/updateSelection',
  async ({ symbol, selected }: { symbol: string; selected: boolean }) => {
    const { data } = await api.patch<Stock>(`/stocks/${symbol}`, { selected });
    return data;
  },
);

export const fetchStockHistory = createAsyncThunk<
  { symbol: string; data: QuotePoint[] },
  string,
  { rejectValue: { symbol: string; message: string } }
>('stocks/fetchHistory', async (symbol, { rejectWithValue }) => {
  try {
    const { data } = await api.get<QuotePoint[]>(`/stocks/${symbol}/history`);
    return { symbol, data };
  } catch (error: any) {
    return rejectWithValue({ symbol, message: error.response?.data?.message ?? 'Failed to load history' });
  }
});

const stocksSlice = createSlice({
  name: 'stocks',
  initialState,
  reducers: {
    setHistory(state, action: PayloadAction<{ symbol: string; data: QuotePoint[] }>) {
      state.histories[action.payload.symbol] = action.payload.data;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStocksCatalog.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchStocksCatalog.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload;
      })
      .addCase(fetchStocksCatalog.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(updateStockSelection.fulfilled, (state, action) => {
        state.items = state.items.map((stock) =>
          stock.symbol === action.payload.symbol ? action.payload : stock,
        );
      })
      .addCase(fetchStockHistory.pending, (state) => {
        state.historyStatus = 'loading';
      })
      .addCase(fetchStockHistory.fulfilled, (state, action) => {
        state.historyStatus = 'idle';
        state.histories[action.payload.symbol] = action.payload.data;
      })
      .addCase(fetchStockHistory.rejected, (state, action) => {
        state.historyStatus = 'failed';
        state.error = action.payload?.message ?? action.error.message;
      });
  },
});

export const { setHistory } = stocksSlice.actions;

export default stocksSlice.reducer;
