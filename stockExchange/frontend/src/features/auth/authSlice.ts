import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { setAuthToken } from '../../services/api';
import type { Credentials } from '../../types';

type AuthStatus = 'idle' | 'loading' | 'failed';

interface AuthState {
  token: string | null;
  user: {
    username: string;
    roles: string[];
  } | null;
  status: AuthStatus;
  error?: string;
}

const persistedToken = localStorage.getItem('ses-token');
if (persistedToken) {
  setAuthToken(persistedToken);
}

const initialState: AuthState = {
  token: persistedToken,
  user: null,
  status: 'idle',
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: Credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', credentials);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? 'Authentication failed');
    }
  },
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.error = undefined;
      localStorage.removeItem('ses-token');
      setAuthToken(null);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'idle';
        state.token = action.payload.access_token;
        state.user = action.payload.user;
        localStorage.setItem('ses-token', action.payload.access_token);
        setAuthToken(action.payload.access_token);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { logout } = authSlice.actions;

export default authSlice.reducer;
