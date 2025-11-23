import { useEffect } from 'react';
import { Alert, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import type { MarketSettings } from '../types';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { SettingsForm } from '../components/Market/SettingsForm';
import { TickerBoard } from '../components/Market/TickerBoard';
import {
  fetchLatestTick,
  fetchMarketSettings,
  startSimulation,
  stopSimulation,
  updateMarketSettings,
} from '../features/market/marketSlice';
import { useTickerFeed } from '../hooks/useTickerFeed';

export const MarketPage = () => {
  const dispatch = useAppDispatch();
  const { settings, latestTick, status } = useAppSelector((state) => state.market);
  const { token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchMarketSettings());
    dispatch(fetchLatestTick());
  }, [dispatch]);

  useTickerFeed();

  const guard = () => Boolean(token);

  const handleSave = (payload: Partial<MarketSettings>) => {
    if (!guard()) return;
    dispatch(updateMarketSettings(payload));
  };

  const handleStart = (payload: Partial<MarketSettings>) => {
    if (!guard()) return;
    dispatch(startSimulation(payload));
  };

  const handleStop = () => {
    if (!guard()) return;
    dispatch(stopSimulation());
  };

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h4">Настройки биржи</Typography>
        <Typography color="text.secondary">
          Задайте дату начала торгов, скорость переключения дат и запускайте имитацию с рассылкой котировок по WebSocket.
        </Typography>
      </Stack>
      {!token && <Alert severity="info">Выполните вход, чтобы изменять настройки и запускать торги.</Alert>}
      {status === 'loading' && <CircularProgress />}
      <Paper sx={{ p: 3 }}>
        <SettingsForm
          settings={settings}
          onSave={handleSave}
          onStart={handleStart}
          onStop={handleStop}
          disabled={!token}
        />
      </Paper>
      <TickerBoard tick={latestTick} isRunning={settings?.status === 'running'} />
    </Stack>
  );
};
