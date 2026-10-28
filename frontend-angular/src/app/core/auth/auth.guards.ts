import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../api/models';
import { AuthService } from './auth.service';

/** Only logged-in users get past; the rest are sent to /login. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? true : inject(Router).createUrlTree(['/login']);
};

/**
 * Only the given roles get past. Use it as `canActivate: [roleGuard('ADMIN')]`.
 *
 * This only hides screens: the real protection is the API, which checks the role again on every call.
 * A user who edits the JavaScript could open the screen, but every request would answer 403.
 */
export function roleGuard(...roles: Role[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    return auth.hasRole(...roles) ? true : inject(Router).createUrlTree(['/orders']);
  };
}

/** Keeps logged-in users away from the login page. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? inject(Router).createUrlTree(['/orders']) : true;
};
