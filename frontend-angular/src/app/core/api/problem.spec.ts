import { HttpErrorResponse } from '@angular/common/http';
import { errorMessage } from './problem';

describe('errorMessage', () => {
  it('uses the detail of a problem response', () => {
    const error = new HttpErrorResponse({
      status: 422,
      error: { title: 'Regla de negocio incumplida', detail: 'No tiene licencia en vigor' },
    });
    expect(errorMessage(error)).toBe('No tiene licencia en vigor');
  });

  it('joins field errors of a validation response', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        detail: 'Revisa los campos',
        errors: { email: 'El email no es válido', password: 'Obligatoria' },
      },
    });
    expect(errorMessage(error)).toBe('El email no es válido. Obligatoria');
  });

  it('explains a network failure', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 0 }))).toContain('No hay conexión');
  });
});
