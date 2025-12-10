export interface CsvRow {
  [key: string]: string;
}

export type AmountMode = 'single' | 'separate';

export interface MappingConfig {
  // Columns
  dateColumn: string;
  payeeColumn?: string;
  memoColumn?: string;

  // Amount mapping
  amountMode: AmountMode;
  amountColumn?: string; // For single mode
  outflowColumn?: string; // For separate mode
  inflowColumn?: string; // For separate mode

  // Parsing options
  dateFormat: string; // 'auto' | 'YYYY-MM-DD' | etc.
  decimalSeparator: '.' | ',';
  isNegativeOutflow: boolean; // true: negative = outflow, false: positive = outflow

  // Filters
  skipEmptyAmount: boolean;
  trimWhitespace: boolean;
}

export interface ParseResult {
  data: CsvRow[];
  meta: {
    delimiter: string;
    fields?: string[];
  };
  errors: any[];
}

export interface YnabRow {
  Date: string;
  Payee: string;
  Memo: string;
  Outflow: string;
  Inflow: string;
}

export interface ProcessingStats {
  totalRows: number;
  validRows: number;
  skippedRows: number;
  totalInflow: number;
  totalOutflow: number;
}
