import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api';
import type { MarketSettings, SimulationTick } from '../../types';

interface MarketState {
  settings: MarketSettings | null;
  status: 'idle' | 'loading' | 'failed';
  tickStatus: 'idle' | 'loading';
  latestTick: SimulationTick | null;
  error?: string;
}

const initialState: MarketState = {
  settings: null,
  status: 'idle',
  tickStatus: 'idle',
  latestTick: null,
};

export const fetchMarketSettings = createAsyncThunk('market/settings', async () => {
  const { data } = await api.get<MarketSettings>('/market/settings');
  return data;
});

export const updateMarketSettings = createAsyncThunk(
  'market/updateSettings',
  async (payload: Partial<MarketSettings>) => {
    const { data } = await api.patch<MarketSettings>('/market/settings', payload);
    return data;
  },
);

export const startSimulation = createAsyncThunk(
  'market/start',
  async (payload: Partial<MarketSettings>) => {
    const { data } = await api.post<SimulationTick>('/market/simulations/start', payload);
    return data;
  },
);

export const stopSimulation = createAsyncThunk('market/stop', async () => {
  await api.post('/market/simulations/stop', {});
  return { status: 'idle' as const };
});

export const fetchLatestTick = createAsyncThunk('market/latestTick', async () => {
  const { data } = await api.get<SimulationTick | null>('/market/tick');
  return data;
});

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    setLatestTick(state, action) {
      state.latestTick = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketSettings.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMarketSettings.fulfilled, (state, action) => {
        state.status = 'idle';
        state.settings = action.payload;
      })
      .addCase(fetchMarketSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(updateMarketSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      })
      .addCase(startSimulation.pending, (state) => {
        state.tickStatus = 'loading';
      })
      .addCase(startSimulation.fulfilled, (state, action) => {
        state.tickStatus = 'idle';
        state.latestTick = action.payload;
        if (state.settings) {
          state.settings.status = 'running';
        }
      })
      .addCase(stopSimulation.fulfilled, (state) => {
        if (state.settings) {
          state.settings.status = 'idle';
        }
      })
      .addCase(fetchLatestTick.fulfilled, (state, action) => {
        state.latestTick = action.payload;
      });
  },
});

export const { setLatestTick } = marketSlice.actions;

export default marketSlice.reducer;
