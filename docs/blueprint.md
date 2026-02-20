# **App Name**: STARFISH

## Core Features:

- Stock Data Retrieval: Fetch real-time and historical stock data using the yfinance library. Implements rate limiting/delay between data requests.and the rate and limits should be properly shown yo the user
- Chart Generation: Create interactive stock charts (candlestick, line) based on retrieved data using Recharts or similar charting library.
- Technical Analysis Indicators: Calculate and display key technical analysis indicators (SMA, EMA, RSI, MACD) derived from yfinance data.
- Primary Analysis Data Display: Present fundamental stock data such as P/E ratio, EPS, dividend yield, and other key metrics from yfinance.
- Symbol Search: Implement a search bar for users to enter a stock symbol to view its data.

## Style Guidelines:

- Primary color: Soft gray (#808080) to create a professional and calming backdrop.
- Background color: Almost-white (#FAFAFA) for a clean, minimalistic aesthetic.
- Accent color: Dark slate gray (#2F4F4F) for contrast and key interactive elements.
- Font: 'Inter', a sans-serif, for clear readability of stock data and text.
- Use a grid-based layout to organize charts, data tables, and analysis results neatly.
- Use simple, monochrome icons to represent different data points and functions.
- Subtle transitions for loading data and updating charts.