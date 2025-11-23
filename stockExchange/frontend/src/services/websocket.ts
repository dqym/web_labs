import { io, Socket } from 'socket.io-client';
import type { SimulationTick } from '../types';

const wsUrl = import.meta.env.VITE_WS_URL ?? 'http://localhost:3001';

let tickerSocket: Socket | undefined;

export const getTickerSocket = (): Socket => {
  if (!tickerSocket) {
    tickerSocket = io(`${wsUrl}/ticker`, {
      transports: ['websocket'],
    });
  }
  return tickerSocket;
};

export const subscribeToTicks = (callback: (tick: SimulationTick) => void) => {
  const socket = getTickerSocket();
  socket.on('tick', callback);
  return () => socket.off('tick', callback);
};

export const disconnectTickerSocket = () => {
  if (tickerSocket) {
    tickerSocket.disconnect();
    tickerSocket = undefined;
  }
};
