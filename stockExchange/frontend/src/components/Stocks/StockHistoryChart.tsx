import { memo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import dayjs from 'dayjs';
import type { QuotePoint } from '../../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const MAX_CHART_POINTS = 60;

interface StockHistoryChartProps {
  symbol?: string;
  history: QuotePoint[];
}

export const StockHistoryChart = memo(({ symbol, history }: StockHistoryChartProps) => {
  const recentHistory = history.slice(-MAX_CHART_POINTS); // ограничиваем количество точек, чтобы график не разрастался
  const pointsShown = recentHistory.length;
  const labels = recentHistory.map((point) => dayjs(point.date).format('DD.MM.YYYY'));
  const data = {
    labels,
    datasets: [
      {
        label: symbol ?? 'Цена открытия',
        data: recentHistory.map((point) => point.open),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.2)',
        tension: 0.2,
      },
    ],
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={`История стоимости ${symbol ?? ''}`}
        subheader={`Показано ${pointsShown} из ${history.length} записей`}
      />
      <CardContent>
        {history.length ? (
          <>
            <Box sx={{ height: { xs: 240, md: 320 } }}>
              <Line
                data={data}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: true } },
                }}
              />
            </Box>
            <TableContainer sx={{ mt: 3, maxHeight: 260 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Дата</TableCell>
                    <TableCell align="right">Цена открытия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((point) => (
                    <TableRow key={point.date}>
                      <TableCell>{dayjs(point.date).format('DD MMM YYYY')}</TableCell>
                      <TableCell align="right">${point.open.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Typography color="text.secondary">Выберите акцию для просмотра истории.</Typography>
        )}
      </CardContent>
    </Card>
  );
});
