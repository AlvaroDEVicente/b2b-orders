import { HttpErrorResponse } from '@angular/common/http';
import { Problem } from './models';

export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No hay conexión con el servidor. Comprueba que la API está arrancada.';
    }
    const problem = error.error as Problem | null;
    if (problem?.errors) {
      return Object.values(problem.errors).join('. ');
    }
    if (problem?.detail) {
      return problem.detail;
    }
    return `Error ${error.status} del servidor.`;
  }
  return 'Ha ocurrido un error inesperado.';
}
