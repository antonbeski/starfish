'use server';
/**
 * @fileOverview AI Stock Analysis Flow.
 * 
 * - analyzeStock - A function that performs deep analysis on stock data.
 * - StockAnalysisInput - The input type for the analyzeStock function.
 * - StockAnalysisOutput - The return type for the analyzeStock function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StockAnalysisInputSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  price: z.number(),
  changePercent: z.number(),
  marketCap: z.string().optional(),
  peRatio: z.number().optional(),
  history: z.array(z.object({
    date: z.string(),
    close: z.number(),
    rsi: z.number().nullable().optional(),
    sma20: z.number().nullable().optional(),
    ema50: z.number().nullable().optional(),
  })).describe('Last 30-90 days of price and technical data'),
});

export type StockAnalysisInput = z.infer<typeof StockAnalysisInputSchema>;

const StockAnalysisOutputSchema = z.object({
  summary: z.string().describe('A concise executive summary of the stock status.'),
  technicalVerdict: z.string().describe('Analysis of chart patterns and technical indicators (RSI, SMA, EMA).'),
  fundamentalHealth: z.string().describe('Assessment based on price action and available metrics.'),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).describe('Calculated risk profile.'),
  sentiment: z.enum(['BULLISH', 'NEUTRAL', 'BEARISH']).describe('Overall market sentiment.'),
  recommendation: z.string().describe('A terminal-style final directive.'),
});

export type StockAnalysisOutput = z.infer<typeof StockAnalysisOutputSchema>;

const analysisPrompt = ai.definePrompt({
  name: 'stockAnalysisPrompt',
  input: { schema: StockAnalysisInputSchema },
  output: { schema: StockAnalysisOutputSchema },
  prompt: `You are the STARFISH Core Intelligence, a high-frequency trading AI terminal.
Analyze the following market data for {{{name}}} ({{{symbol}}}).

CURRENT STATUS:
- Price: \u0024{{{price}}} ({{{changePercent}}}%)
- Market Cap: {{#if marketCap}}{{{marketCap}}}{{else}}N/A{{/if}}
- P/E Ratio: {{#if peRatio}}{{{peRatio}}}{{else}}N/A{{/if}}

HISTORICAL OVERVIEW (Technical Snapshot):
{{#each history}}
- Date: {{{date}}}, Close: {{{close}}}, RSI: {{{rsi}}}, SMA20: {{{sma20}}}
{{/each}}

Identify momentum shifts, potential breakouts, or breakdown risks using technical indicators. Since fundamental data might be limited, prioritize price action and trend analysis. Adopt a "terminal" tone. No fluff.`,
});

export async function analyzeStock(input: StockAnalysisInput): Promise<StockAnalysisOutput> {
  const { output } = await analysisPrompt(input);
  if (!output) throw new Error('AI failed to generate analysis');
  return output;
}
