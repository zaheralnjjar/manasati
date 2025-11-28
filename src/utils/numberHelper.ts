export const normalizeNumbers = (input: string): string => {
    if (!input) return '';
    return input
        .replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => (d.charCodeAt(0) - 1632).toString())
        .replace(/[۰۱۲۳۴۵۶۷۸۹]/g, d => (d.charCodeAt(0) - 1776).toString());
};

export const parseNumber = (input: string): number => {
    const normalized = normalizeNumbers(input);
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
};
