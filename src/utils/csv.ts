import Papa from 'papaparse';
import type { CsvRow, MappingConfig, ParseResult, YnabRow, ProcessingStats } from '../types';
import { parseDate } from './date';

export function parseCsvFile(file: File, onComplete: (result: ParseResult) => void) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    preview: 0, // Parse all
    complete: (results) => {
      onComplete({
        data: results.data as CsvRow[],
        meta: {
          delimiter: results.meta.delimiter || ',',
          fields: results.meta.fields
        },
        errors: results.errors
      });
    },
    error: (error) => {
      console.error('CSV Parse Error:', error);
    }
  });
}

function parseAmount(value: string, decimalSeparator: '.' | ','): number {
  if (!value) return 0;
  // Remove currency symbols and spaces
  let clean = value.replace(/[^\d.,-]/g, '');

  if (decimalSeparator === ',') {
    // European: 1.000,00 -> 1000.00
    // Remove dots (thousands), replace comma with dot
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else {
    // US: 1,000.00 -> 1000.00
    // Remove commas
    clean = clean.replace(/,/g, '');
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export function transformRow(row: CsvRow, config: MappingConfig): YnabRow | null {
  // 1. Parse Date
  const dateVal = row[config.dateColumn];
  if (!dateVal) return null; // Skip if no date

  const date = parseDate(dateVal, config.dateFormat);
  if (!date) return null; // Skip if invalid date

  // 2. Parse Amounts
  let outflow = 0;
  let inflow = 0;

  if (config.amountMode === 'single' && config.amountColumn) {
    const rawAmount = row[config.amountColumn];
    if (config.skipEmptyAmount && !rawAmount) return null;

    const amount = parseAmount(rawAmount, config.decimalSeparator);

    if (config.isNegativeOutflow) {
      // Negative is outflow
      if (amount < 0) {
        outflow = Math.abs(amount);
      } else {
        inflow = amount;
      }
    } else {
      // Positive is outflow
      if (amount > 0) {
        outflow = amount;
      } else {
        inflow = Math.abs(amount); // If negative, it's inflow? Usually "Positive is outflow" implies negative is inflow.
      }
    }
  } else if (config.amountMode === 'separate') {
    const rawOutflow = config.outflowColumn ? row[config.outflowColumn] : '';
    const rawInflow = config.inflowColumn ? row[config.inflowColumn] : '';

    if (config.skipEmptyAmount && !rawOutflow && !rawInflow) return null;

    const outVal = parseAmount(rawOutflow, config.decimalSeparator);
    const inVal = parseAmount(rawInflow, config.decimalSeparator);

    // Logic: prefer outflow if present (and positive?), else inflow
    // Actually, YNAB allows both columns, but usually one is filled.
    // The prompt says: "never put both in output simultaneously... prefer Outflow if > 0 else Inflow"

    if (outVal > 0) {
      outflow = outVal;
    } else if (inVal > 0) {
      inflow = inVal;
    }
  }

  // 3. Payee & Memo
  let payee = config.payeeColumn ? row[config.payeeColumn] || '' : '';
  let memo = config.memoColumn ? row[config.memoColumn] || '' : '';

  if (config.trimWhitespace) {
    payee = payee.trim();
    memo = memo.trim();
  }

  // 4. Clean Payee (Power Features)
  if (config.autoCleanPayee) {
    // Common noise removal
    payee = payee
      .replace(/purchase authorization/gi, '')
      .replace(/pos purchase/gi, '')
      .replace(/card purchase/gi, '')
      .replace(/not available/gi, '')
      .replace(/recurring payment/gi, '')
      .replace(/^\d{2,}\/\d{2,}\s+/, '') // Remove leading dates like 12/24
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (config.payeeRules && config.payeeRules.length > 0) {
    const lowerPayee = payee.toLowerCase();
    for (const rule of config.payeeRules) {
      if (rule.match && lowerPayee.includes(rule.match.toLowerCase())) {
        payee = rule.replacement;
        break; // Apply first unique match? Or continue? Usually first match wins or last match wins. Let's break on first match.
      }
    }
  }

  // Skip if no amount (optional, but usually good practice to skip 0 transactions if desired, but prompt says "Skip rows missing date OR missing amount(s)")
  // "missing amount(s)" implies empty string, not necessarily 0 value. 
  // But let's stick to the explicit "Skip rows with empty amount" toggle.

  // Format output numbers
  const outflowStr = outflow > 0 ? outflow.toFixed(2) : '';
  const inflowStr = inflow > 0 ? inflow.toFixed(2) : '';

  return {
    Date: date,
    Payee: payee,
    Memo: memo,
    Outflow: outflowStr,
    Inflow: inflowStr
  };
}

export function processAll(data: CsvRow[], config: MappingConfig): { rows: YnabRow[], stats: ProcessingStats } {
  const rows: YnabRow[] = [];
  let skipped = 0;
  let totalIn = 0;
  let totalOut = 0;

  for (const row of data) {
    const transformed = transformRow(row, config);
    if (transformed) {
      rows.push(transformed);
      totalOut += parseFloat(transformed.Outflow || '0');
      totalIn += parseFloat(transformed.Inflow || '0');
    } else {
      skipped++;
    }
  }

  return {
    rows,
    stats: {
      totalRows: data.length,
      validRows: rows.length,
      skippedRows: skipped,
      totalInflow: totalIn,
      totalOutflow: totalOut
    }
  };
}

export function generateYnabCsv(rows: YnabRow[]): string {
  return Papa.unparse(rows, {
    quotes: true, // YNAB likes quoted fields
    header: true
  });
}
