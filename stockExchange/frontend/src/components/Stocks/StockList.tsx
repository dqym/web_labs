import {
  Card,
  CardContent,
  Checkbox,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import type { Stock } from '../../types';

interface StockListProps {
  stocks: Stock[];
  selectedSymbol?: string;
  onSelect: (symbol: string) => void;
  onToggle: (symbol: string, selected: boolean) => void;
  disabled?: boolean;
}

export const StockList = ({ stocks, selectedSymbol, onSelect, onToggle, disabled }: StockListProps) => (
  <Card>
    <CardContent>
      <List>
        {stocks.map((stock) => (
          <ListItem
            key={stock.symbol}
            secondaryAction={
              <Tooltip title="Показать историю">
                <IconButton edge="end" onClick={() => onSelect(stock.symbol)} color={selectedSymbol === stock.symbol ? 'primary' : 'default'}>
                  <ShowChartIcon />
                </IconButton>
              </Tooltip>
            }
            disablePadding
          >
            <ListItemButton selected={selectedSymbol === stock.symbol} onClick={() => onSelect(stock.symbol)}>
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={stock.selected}
                  onChange={(e) => onToggle(stock.symbol, e.target.checked)}
                  disabled={disabled}
                />
              </ListItemIcon>
              <ListItemText primary={`${stock.symbol}`} secondary={stock.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </CardContent>
  </Card>
);
