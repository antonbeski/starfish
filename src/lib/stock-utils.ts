/**
 * Standard Simple Moving Average
 */
export function calculateSMA(data: number[], period: number): (number | null)[] {
  const sma: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(Number((sum / period).toFixed(2)));
    }
  }
  return sma;
}

/**
 * Exponential Moving Average
 */
export function calculateEMA(data: number[], period: number): (number | null)[] {
  const ema: (number | null)[] = [];
  const k = 2 / (period + 1);
  let previousEma: number | null = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(null);
    } else if (i === period - 1) {
      const sum = data.slice(0, period).reduce((a, b) => a + b, 0);
      previousEma = sum / period;
      ema.push(Number(previousEma.toFixed(2)));
    } else {
      const currentEma = data[i] * k + (previousEma as number) * (1 - k);
      previousEma = currentEma;
      ema.push(Number(currentEma.toFixed(2)));
    }
  }
  return ema;
}

/**
 * Relative Strength Index (RSI) using Wilder's Smoothing
 */
export function calculateRSI(data: number[], period: number = 14): (number | null)[] {
  if (data.length < period) return Array(data.length).fill(null);

  const rsi: (number | null)[] = Array(period).fill(null);
  let avgGain = 0;
  let avgLoss = 0;

  // Initial average
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss -= diff;
  }

  avgGain /= period;
  avgLoss /= period;

  const firstRs = avgGain / avgLoss;
  rsi[period] = 100 - (100 / (1 + firstRs));

  // Subsequent values using Wilder's smoothing
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgGain / avgLoss;
    rsi[i] = Number((100 - (100 / (1 + rs))).toFixed(2));
  }

  return rsi;
}
