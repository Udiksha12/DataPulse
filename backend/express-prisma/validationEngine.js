/**
 * DataPulse CSV Validation Engine
 * Authors: Udiksha Agarwal (24BAI0086), Bakya (24BAI0071), Rudra (24BKT0125)
 * Course: BCSE302P Database Systems Lab | Slot: L25+L26
 *
 * Implements:
 * - Streaming / in-memory CSV parser
 * - Rule evaluation: REQUIRED, UNIQUE, EMAIL, RANGE, TYPE
 * - Max file size 5MB, Max rows 5000
 * - Produces quality issues with exact row numbers and observed values
 */

import { parse } from 'csv-parse/sync';

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const MAX_ROWS = 5000;

export function validateCsvBuffer({ csvBuffer, datasetFields, activeRules }) {
  if (!csvBuffer || csvBuffer.length === 0) {
    throw new Error('Choose a CSV file to run validation.');
  }

  let records;
  try {
    records = parse(csvBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    throw new Error('Could not read the CSV. Check that it has one header row and valid CSV formatting.');
  }

  if (!records || records.length === 0) {
    throw new Error('CSV file is empty or contains only headers.');
  }

  if (records.length > MAX_ROWS) {
    throw new Error(`CSV files are limited to ${MAX_ROWS} data rows for this project demo.`);
  }

  // Check header columns
  const firstRow = records[0];
  const presentHeaders = Object.keys(firstRow).map((h) => h.toLowerCase());

  for (const field of datasetFields) {
    if (!presentHeaders.includes(field.field_name.toLowerCase())) {
      throw new Error(`CSV is missing the configured column: ${field.field_name}`);
    }
  }

  const foundIssues = [];
  const uniqueValuesMap = new Map(); // ruleId -> Set<string>

  let rowNumber = 1;
  for (const record of records) {
    for (const rule of activeRules) {
      const field = datasetFields.find((f) => f.field_id === rule.field_id);
      if (!field) continue;

      // Find matching record key case-insensitively
      const recordKey = Object.keys(record).find((k) => k.toLowerCase() === field.field_name.toLowerCase());
      const rawValue = recordKey ? record[recordKey] : '';
      const value = rawValue !== undefined && rawValue !== null ? String(rawValue).trim() : '';

      const failure = evaluateRule(rule, field, value, uniqueValuesMap);
      if (failure) {
        foundIssues.push({
          ruleId: rule.rule_id,
          fieldId: field.field_id,
          fieldName: field.field_name,
          rowNumber,
          severity: rule.severity,
          message: failure,
          observedValue: value || null,
        });
      }
    }
    rowNumber++;
  }

  return {
    totalRows: records.length,
    foundIssues,
  };
}

function evaluateRule(rule, field, value, uniqueValuesMap) {
  const isBlank = value === '';

  switch (rule.rule_type) {
    case 'REQUIRED':
      return isBlank ? 'A value is required.' : null;

    case 'UNIQUE': {
      if (isBlank) return null;
      if (!uniqueValuesMap.has(rule.rule_id)) {
        uniqueValuesMap.set(rule.rule_id, new Set());
      }
      const set = uniqueValuesMap.get(rule.rule_id);
      const normalized = value.toLowerCase();
      if (set.has(normalized)) {
        return 'This value duplicates an earlier row.';
      }
      set.add(normalized);
      return null;
    }

    case 'EMAIL':
      if (isBlank) return null;
      return EMAIL_REGEX.test(value) ? null : 'Enter a valid email address.';

    case 'RANGE': {
      if (isBlank) return null;
      const num = Number(value);
      if (isNaN(num)) return 'Value must be a number within the configured range.';
      const min = rule.rule_config?.min !== undefined ? Number(rule.rule_config.min) : -Infinity;
      const max = rule.rule_config?.max !== undefined ? Number(rule.rule_config.max) : Infinity;
      if (num < min || num > max) {
        return `Value must be between ${min} and ${max}.`;
      }
      return null;
    }

    case 'TYPE':
      return checkTypeValidity(field.data_type, value);

    default:
      return null;
  }
}

function checkTypeValidity(dataType, value) {
  if (value === '') return null;

  switch (dataType) {
    case 'TEXT':
      return null;
    case 'INTEGER':
      return /^[+-]?\d+$/.test(value) ? null : 'Value is not a valid integer.';
    case 'DECIMAL':
      return !isNaN(Number(value)) ? null : 'Value is not a valid decimal.';
    case 'DATE':
      return !isNaN(Date.parse(value)) ? null : 'Value is not a valid date.';
    case 'BOOLEAN':
      return ['true', 'false', '1', '0'].includes(value.toLowerCase()) ? null : 'Value is not a valid boolean.';
    default:
      return null;
  }
}
