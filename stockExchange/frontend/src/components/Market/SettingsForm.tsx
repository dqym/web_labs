import { useEffect, useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import type { MarketSettings } from '../../types';

interface SettingsFormProps {
  settings: MarketSettings | null;
  onSave: (payload: Partial<MarketSettings>) => void;
  onStart: (payload: Partial<MarketSettings>) => void;
  onStop: () => void;
  disabled?: boolean;
}

export const SettingsForm = ({ settings, onSave, onStart, onStop, disabled }: SettingsFormProps) => {
  const [startDate, setStartDate] = useState(settings?.startDate ?? '2024-01-02');
  const [tickIntervalSec, setTickIntervalSec] = useState(settings?.tickIntervalSec ?? 1);
  const [speedMultiplier, setSpeedMultiplier] = useState(settings?.speedMultiplier ?? 1);

  useEffect(() => {
    if (settings) {
      setStartDate(settings.startDate);
      setTickIntervalSec(settings.tickIntervalSec);
      setSpeedMultiplier(settings.speedMultiplier);
    }
  }, [settings]);

  const handleSave = () => {
    onSave({ startDate, tickIntervalSec, speedMultiplier });
  };

  const handleStart = () => {
    onStart({ startDate, tickIntervalSec, speedMultiplier });
  };

  return (
    <Stack spacing={2} component={Box}>
      <Typography variant="h6">Настройки торгов</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Дата начала"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          fullWidth
        />
        <TextField
          label="Интервал (сек.)"
          type="number"
          value={tickIntervalSec}
          onChange={(e) => setTickIntervalSec(Number(e.target.value) || 1)}
          inputProps={{ min: 1 }}
          fullWidth
        />
        <TextField
          label="Ускорение"
          type="number"
          value={speedMultiplier}
          onChange={(e) => setSpeedMultiplier(Number(e.target.value) || 1)}
          inputProps={{ min: 1 }}
          fullWidth
        />
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Button variant="outlined" onClick={handleSave} disabled={disabled}>
          Сохранить
        </Button>
        <Button variant="contained" onClick={handleStart} disabled={disabled}>
          Начало торгов
        </Button>
        <Button color="inherit" onClick={onStop} disabled={disabled}>
          Остановить
        </Button>
      </Stack>
    </Stack>
  );
};
