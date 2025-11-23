import { useEffect } from 'react';
import { subscribeToTicks, disconnectTickerSocket } from '../services/websocket';
import { setLatestTick } from '../features/market/marketSlice';
import { useAppDispatch } from '../app/hooks';

export const useTickerFeed = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = subscribeToTicks((tick) => dispatch(setLatestTick(tick)));
    return () => {
      unsubscribe();
      disconnectTickerSocket();
    };
  }, [dispatch]);
};
