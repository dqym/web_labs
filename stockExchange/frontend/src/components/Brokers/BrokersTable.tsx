import { useState } from 'react';
import {
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Switch,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Broker } from '../../types';

interface BrokersTableProps {
  brokers: Broker[];
  onUpdate: (id: string, changes: Partial<Pick<Broker, 'cash' | 'active'>>) => void;
  onDelete: (id: string) => void;
}

export const BrokersTable = ({ brokers, onUpdate, onDelete }: BrokersTableProps) => {
  const [drafts, setDrafts] = useState<Record<string, number>>({});

  const handleBlur = (broker: Broker) => {
    const nextValue = drafts[broker.id];
    if (nextValue === undefined || nextValue === broker.cash) {
      return;
    }
    onUpdate(broker.id, { cash: nextValue });
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Название</TableCell>
            <TableCell>Капитал ($)</TableCell>
            <TableCell>Активен</TableCell>
            <TableCell align="right">Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {brokers.map((broker) => (
            <TableRow key={broker.id} hover>
              <TableCell>{broker.name}</TableCell>
              <TableCell>
                <TextField
                  type="number"
                  size="small"
                  value={drafts[broker.id] ?? broker.cash}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [broker.id]: Number(e.target.value),
                    }))
                  }
                  onBlur={() => handleBlur(broker)}
                  inputProps={{ min: 0 }}
                />
              </TableCell>
              <TableCell>
                <Switch checked={broker.active} onChange={(e) => onUpdate(broker.id, { active: e.target.checked })} />
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Удалить">
                  <IconButton color="error" onClick={() => onDelete(broker.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
