/**
 * Central Bank of Russia exchange rates fetcher.
 * Parses XML from https://www.cbr.ru/scripts/XML_daily.asp
 * Caches rates for 1 hour.
 *
 * CBR publishes rates as "how many RUB for N units of foreign currency".
 * We need: 1 RUB = X foreign currency.
 */

interface CBRRate {
  charCode: string;
  nominal: number;
  name: string;
  value: number; // RUB per 1 unit of foreign currency
}

interface RatesCache {
  rates: Record<string, CBRRate>;
  fetchedAt: number;
  date: string;
}

let cache: RatesCache | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function parseXML(xml: string): Record<string, CBRRate> {
  const rates: Record<string, CBRRate> = {};

  // Extract date
  // Parse each <Valute> block
  const valuteRegex = /<Valute[^>]*>([\s\S]*?)<\/Valute>/g;
  let match;

  while ((match = valuteRegex.exec(xml)) !== null) {
    const block = match[1];

    const charCode = extractTag(block, 'CharCode');
    const nominal = parseInt(extractTag(block, 'Nominal') || '1');
    const name = extractTag(block, 'Name') || '';
    // CBR uses comma as decimal separator
    const valueStr = extractTag(block, 'Value') || '0';
    const value = parseFloat(valueStr.replace(',', '.'));

    if (charCode && value > 0) {
      rates[charCode] = {
        charCode,
        nominal,
        name,
        value: value / nominal, // normalize to per-1-unit
      };
    }
  }

  return rates;
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`);
  const m = xml.match(regex);
  return m ? m[1].trim() : null;
}

export async function fetchCBRRates(): Promise<Record<string, CBRRate>> {
  // Return cache if fresh
  if (cache && (Date.now() - cache.fetchedAt) < CACHE_TTL) {
    return cache.rates;
  }

  try {
    console.log('[CBR] Fetching exchange rates...');
    const res = await fetch('https://www.cbr.ru/scripts/XML_daily.asp');
    const buffer = await res.arrayBuffer();
    // CBR returns Windows-1251 encoded XML
    const decoder = new TextDecoder('windows-1251');
    const xml = decoder.decode(buffer);

    const rates = parseXML(xml);
    const dateMatch = xml.match(/Date="([^"]*)"/);

    cache = {
      rates,
      fetchedAt: Date.now(),
      date: dateMatch ? dateMatch[1] : new Date().toLocaleDateString('ru-RU'),
    };

    console.log(`[CBR] Loaded ${Object.keys(rates).length} rates for ${cache.date}`);
    return rates;
  } catch (err) {
    console.error('[CBR] Failed to fetch rates:', err);
    // Return stale cache if available
    if (cache) return cache.rates;
    return {};
  }
}

/**
 * Get the rate for converting RUB to a target currency.
 * Returns how many units of targetCurrency you get for 1 RUB.
 * Applies margin (positive margin = we give less foreign currency = our profit).
 */
export async function getRubToForeignRate(targetCurrency: string, marginPercent: number = 0): Promise<number | null> {
  const rates = await fetchCBRRates();

  // Special cases: currencies not directly in CBR but we can derive
  const CURRENCY_MAP: Record<string, string> = {
    // Our currency codes -> CBR CharCodes
    'UZS': 'UZS',
    'TJS': 'TJS',
    'KGS': 'KGS',
    'KZT': 'KZT',
    'AZN': 'AZN',
    'GEL': 'GEL',
    'TRY': 'TRY',
    'CNY': 'CNY',
    'AMD': 'AMD',
  };

  const cbrCode = CURRENCY_MAP[targetCurrency] || targetCurrency;
  const rate = rates[cbrCode];

  if (!rate) {
    console.warn(`[CBR] No rate found for ${targetCurrency} (${cbrCode})`);
    return null;
  }

  // rate.value = how many RUB for 1 unit of foreign currency
  // We need: 1 RUB = X foreign currency
  const baseRate = 1 / rate.value;

  // Apply margin: reduce what the customer gets
  const marginMultiplier = 1 - (marginPercent / 100);
  return Math.round(baseRate * marginMultiplier * 1000000) / 1000000;
}

/**
 * Get CBR date for display
 */
export function getCacheDate(): string {
  return cache?.date || '—';
}

/**
 * Get all CBR rates (for admin display)
 */
export async function getAllCBRRates(): Promise<{ rates: Record<string, CBRRate>; date: string }> {
  const rates = await fetchCBRRates();
  return { rates, date: cache?.date || '—' };
}
