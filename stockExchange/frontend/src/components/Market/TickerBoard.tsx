import { Card, CardContent, CardHeader, Chip, List, ListItem, ListItemText, Typography } from '@mui/material';
import dayjs from 'dayjs';
import type { SimulationTick } from '../../types';

interface TickerBoardProps {
  tick: SimulationTick | null;
  isRunning: boolean;
}

export const TickerBoard = ({ tick, isRunning }: TickerBoardProps) => (
  <Card>
    <CardHeader
      title="Текущая дата торгов"
      subheader={tick ? dayjs(tick.date).format('DD MMM YYYY') : 'Нет активной сессии'}
      action={<Chip color={isRunning ? 'success' : 'error'} label={isRunning ? 'LIVE' : 'OFF'} />}
    />
    <CardContent>
      {tick ? (
        <List dense>
          {tick.prices.map((price) => (
            <ListItem key={price.symbol} disableGutters>
              <ListItemText
                primary={`${price.symbol}`}
                secondary={`Цена: $${price.open.toFixed(2)}`}
                secondaryTypographyProps={{ color: 'text.primary' }}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography color="text.secondary">Нажмите «Начало торгов», чтобы получить поток данных.</Typography>
      )}
    </CardContent>
  </Card>
);
