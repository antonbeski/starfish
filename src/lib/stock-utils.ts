export function calculateSMA(data: number[], period: number): (number | null)[] {
  const sma: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

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
      ema.push(previousEma);
    } else {
      const currentEma = data[i] * k + (previousEma as number) * (1 - k);
      previousEma = currentEma;
      ema.push(currentEma);
    }
  }
  return ema;
}

export function calculateRSI(data: number[], period: number = 14): (number | null)[] {
  const rsi: (number | null)[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    if (i <= period) {
      if (diff > 0) gains += diff;
      else losses -= diff;

      if (i === period) {
        let avgGain = gains / period;
        let avgLoss = losses / period;
        let rs = avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      } else {
        rsi.push(null);
      }
    } else {
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;
      
      // Wilder's smoothing
      gains = (gains * (period - 1) + gain) / period;
      losses = (losses * (period - 1) + loss) / period;
      
      let rs = gains / losses;
      rsi.push(100 - 100 / (1 + rs));
    }
  }
  // Align length
  return [null, ...rsi];
}

export function calculateMACD(data: number[]) {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macdLine: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (ema12[i] !== null && ema26[i] !== null) {
      macdLine.push((ema12[i] as number) - (ema26[i] as number));
    } else {
      macdLine.push(null);
    }
  }

  const validMacdValues = macdLine.filter(v => v !== null) as number[];
  const signalLineRaw = calculateEMA(validMacdValues, 9);
  
  const signalLine: (number | null)[] = Array(macdLine.length - signalLineRaw.length).fill(null).concat(signalLineRaw);
  
  const histogram: (number | null)[] = macdLine.map((m, i) => {
    const s = signalLine[i];
    return (m !== null && s !== null) ? m - s : null;
  });

  return { macdLine, signalLine, histogram };
}