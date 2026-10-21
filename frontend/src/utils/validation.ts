export const safeParseId = (value: string | number | undefined | null): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(num) || !isFinite(num) || num <= 0) return null;
  return num;
};
