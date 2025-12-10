import { parse, isValid, format } from 'date-fns';

export const DATE_FORMATS = [
  { label: 'Auto Detect', value: 'auto' },
  { label: 'YYYY-MM-DD (2023-12-31)', value: 'yyyy-MM-dd' },
  { label: 'DD/MM/YYYY (31/12/2023)', value: 'dd/MM/yyyy' },
  { label: 'MM/DD/YYYY (12/31/2023)', value: 'MM/dd/yyyy' },
  { label: 'DD.MM.YYYY (31.12.2023)', value: 'dd.MM.yyyy' },
  { label: 'YYYY/MM/DD (2023/12/31)', value: 'yyyy/MM/dd' },
];

export function parseDate(dateStr: string, formatStr: string): string | null {
  if (!dateStr) return null;
  const cleanStr = dateStr.trim();

  if (formatStr === 'auto') {
    // Try ISO first
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) return cleanStr;

    // Try common formats
    const strategies = [
      'yyyy-MM-dd',
      'dd/MM/yyyy',
      'MM/dd/yyyy',
      'dd.MM.yyyy',
      'yyyy/MM/dd'
    ];

    for (const fmt of strategies) {
      const parsed = parse(cleanStr, fmt, new Date());
      if (isValid(parsed)) {
        // Sanity check: year should be reasonable (e.g., between 2000 and 2100)
        const year = parsed.getFullYear();
        if (year > 1900 && year < 2100) {
          return format(parsed, 'yyyy-MM-dd');
        }
      }
    }
    return null;
  } else {
    const parsed = parse(cleanStr, formatStr, new Date());
    if (isValid(parsed)) {
      return format(parsed, 'yyyy-MM-dd');
    }
    return null;
  }
}
