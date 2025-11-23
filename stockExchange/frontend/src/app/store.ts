import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import brokersReducer from '../features/brokers/brokersSlice';
import marketReducer from '../features/market/marketSlice';
import stocksReducer from '../features/stocks/stocksSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    brokers: brokersReducer,
    stocks: stocksReducer,
    market: marketReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
