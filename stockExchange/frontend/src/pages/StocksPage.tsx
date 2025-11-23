import { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { StockList } from '../components/Stocks/StockList';
import { StockHistoryChart } from '../components/Stocks/StockHistoryChart';
import { fetchStockHistory, fetchStocksCatalog, updateStockSelection } from '../features/stocks/stocksSlice';

export const StocksPage = () => {
  const dispatch = useAppDispatch();
  const { items, histories, status, historyStatus } = useAppSelector((state) => state.stocks);
  const { token } = useAppSelector((state) => state.auth);
  const [selectedSymbol, setSelectedSymbol] = useState<string | undefined>();

  useEffect(() => {
    dispatch(fetchStocksCatalog());
  }, [dispatch]);

  useEffect(() => {
    if (items.length && !selectedSymbol) {
      setSelectedSymbol(items[0].symbol);
    }
  }, [items, selectedSymbol]);

  useEffect(() => {
    if (selectedSymbol && !histories[selectedSymbol]) {
      dispatch(fetchStockHistory(selectedSymbol));
    }
  }, [dispatch, selectedSymbol, histories]);

  const handleToggle = (symbol: string, selected: boolean) => {
    if (!token) return;
    dispatch(updateStockSelection({ symbol, selected }));
  };

  const history = selectedSymbol ? histories[selectedSymbol] ?? [] : [];

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h4">Список акций</Typography>
        <Typography color="text.secondary">
          Просматривайте историю котировок и выбирайте инструменты, участвующие в имитации торгов.
        </Typography>
      </Stack>
      {!token && <Alert severity="info">Авторизуйтесь для изменения состава торгуемых акций.</Alert>}
      {status === 'loading' ? (
        <CircularProgress />
      ) : (
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 2fr' }} gap={3}>
          <StockList
            stocks={items}
            selectedSymbol={selectedSymbol}
            onSelect={setSelectedSymbol}
            onToggle={handleToggle}
            disabled={!token}
          />
          <Stack>
            {historyStatus === 'loading' && <CircularProgress size={28} />}
            <StockHistoryChart symbol={selectedSymbol} history={history} />
          </Stack>
        </Box>
      )}
    </Stack>
  );
};
