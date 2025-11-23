import { useEffect } from 'react';
import { Alert, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { BrokerForm } from '../components/Brokers/BrokerForm';
import { BrokersTable } from '../components/Brokers/BrokersTable';
import { createBroker, deleteBroker, fetchBrokers, updateBroker } from '../features/brokers/brokersSlice';

export const BrokersPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, status } = useAppSelector((state) => state.brokers);
  const { token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchBrokers());
  }, [dispatch]);

  const requireAuth = () => {
    if (!token) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleCreate = (payload: { name: string; cash: number; active: boolean }) => {
    if (!requireAuth()) return;
    dispatch(createBroker(payload));
  };

  const handleUpdate = (id: string, changes: { cash?: number; active?: boolean }) => {
    if (!requireAuth()) return;
    dispatch(updateBroker({ id, changes }));
  };

  const handleDelete = (id: string) => {
    if (!requireAuth()) return;
    dispatch(deleteBroker(id));
  };

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h4" gutterBottom>
          Участники торгов
        </Typography>
        <Typography color="text.secondary">
          Управляйте брокерами, их стартовым капиталом и доступом к симулируемым торгам.
        </Typography>
      </Stack>
      <Stack spacing={2}>
        {!token && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Для добавления или редактирования брокеров необходимо выполнить вход.
          </Alert>
        )}
        <Paper elevation={2}>
          <BrokerForm onSubmit={handleCreate} />
        </Paper>
      </Stack>
      <Stack>
        <BrokersTable brokers={items} onUpdate={handleUpdate} onDelete={handleDelete} />
        {status === 'loading' && <Typography mt={2}>Загрузка списка...</Typography>}
      </Stack>
    </Stack>
  );
};
