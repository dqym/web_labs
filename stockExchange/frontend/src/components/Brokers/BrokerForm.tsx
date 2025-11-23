import { useState } from 'react';
import { Box, Button, Stack, Switch, TextField, Typography } from '@mui/material';

interface BrokerFormProps {
  onSubmit: (payload: { name: string; cash: number; active: boolean }) => void;
}

export const BrokerForm = ({ onSubmit }: BrokerFormProps) => {
  const [name, setName] = useState('');
  const [cash, setCash] = useState(100000);
  const [active, setActive] = useState(true);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({ name, cash, active });
    setName('');
    setCash(100000);
    setActive(true);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Добавить брокера
      </Typography>
      <Stack spacing={2} direction={{ xs: 'column', md: 'row' }}>
        <TextField label="Название" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
        <TextField
          label="Начальный капитал"
          type="number"
          value={cash}
          onChange={(e) => setCash(Number(e.target.value))}
          required
          fullWidth
        />
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2">Активен</Typography>
          <Switch checked={active} onChange={(e) => setActive(e.target.checked)} />
        </Stack>
        <Button type="submit" variant="contained">
          Сохранить
        </Button>
      </Stack>
    </Box>
  );
};
