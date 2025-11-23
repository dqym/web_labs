import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import type { Broker } from '../../types';

interface BrokersState {
  items: Broker[];
  status: 'idle' | 'loading' | 'failed';
  error?: string;
}

interface BrokerPayload {
  name: string;
  cash: number;
  active?: boolean;
}

const initialState: BrokersState = {
  items: [],
  status: 'idle',
};

export const fetchBrokers = createAsyncThunk('brokers/fetchAll', async () => {
  const { data } = await api.get<Broker[]>('/brokers');
  return data;
});

export const createBroker = createAsyncThunk('brokers/create', async (payload: BrokerPayload) => {
  const { data } = await api.post<Broker>('/brokers', payload);
  return data;
});

export const updateBroker = createAsyncThunk(
  'brokers/update',
  async ({ id, changes }: { id: string; changes: Partial<BrokerPayload> }) => {
    const { data } = await api.patch<Broker>(`/brokers/${id}`, changes);
    return data;
  },
);

export const deleteBroker = createAsyncThunk('brokers/delete', async (id: string) => {
  await api.delete(`/brokers/${id}`);
  return id;
});

const brokersSlice = createSlice({
  name: 'brokers',
  initialState,
  reducers: {
    setBrokers(state, action: PayloadAction<Broker[]>) {
      state.items = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrokers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBrokers.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload;
      })
      .addCase(fetchBrokers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createBroker.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateBroker.fulfilled, (state, action) => {
        state.items = state.items.map((broker) =>
          broker.id === action.payload.id ? action.payload : broker,
        );
      })
      .addCase(deleteBroker.fulfilled, (state, action) => {
        state.items = state.items.filter((broker) => broker.id !== action.payload);
      });
  },
});

export const { setBrokers } = brokersSlice.actions;

export default brokersSlice.reducer;
