import { useState, useEffect, useCallback } from 'react';
import config from '../config';

/**
 * Hook pentru contorul de timp al relației.
 * Returnează zile, ore, minute, secunde de când suntem împreună.
 */
export function useTimer() {
  const startDate = new Date(config.relationshipStartDate);

  const calculate = useCallback(() => {
    const now = new Date();
    const diff = now - startDate;

    if (diff < 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalDays: 0, totalSeconds: 0 };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, totalDays: days, totalSeconds };
  }, []);

  const [time, setTime] = useState(calculate);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(calculate());
    }, 1000);
    return () => clearInterval(interval);
  }, [calculate]);

  return time;
}

/**
 * Hook pentru countdown-ul până la un eveniment viitor.
 */
export function useCountdown(targetDate) {
  const target = new Date(targetDate);

  const calculate = useCallback(() => {
    const now = new Date();
    const diff = target - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      isOver: false,
    };
  }, [targetDate]);

  const [countdown, setCountdown] = useState(calculate);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(calculate());
    }, 1000);
    return () => clearInterval(interval);
  }, [calculate]);

  return countdown;
}
