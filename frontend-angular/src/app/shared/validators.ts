import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Group-level rule for forms with "startDate" and "endDate" controls (ISO strings):
 * the end cannot be before the start. The API checks it too; this gives instant feedback.
 */
export const dateRangeValidator: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const start = group.get('startDate')?.value as string | null;
  const end = group.get('endDate')?.value as string | null;
  return start && end && end < start ? { dateRange: true } : null;
};
