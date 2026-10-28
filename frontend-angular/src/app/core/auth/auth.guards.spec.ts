import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { Role } from '../api/models';
import { authGuard, roleGuard } from './auth.guards';
import { AuthService } from './auth.service';

function setup(role: Role | null) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: AuthService,
        useValue: {
          isLoggedIn: () => role !== null,
          hasRole: (...roles: Role[]) => role !== null && roles.includes(role),
        },
      },
    ],
  });
}

const run = (guard: typeof authGuard) =>
  TestBed.runInInjectionContext(() =>
    guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );

describe('guards', () => {
  it('authGuard sends anonymous users to /login', () => {
    setup(null);
    const result = run(authGuard) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login');
  });

  it('roleGuard lets the right role in', () => {
    setup('ADMIN');
    expect(run(roleGuard('ADMIN'))).toBe(true);
  });

  it('roleGuard sends other roles back to the orders page', () => {
    setup('CUSTOMER');
    const result = run(roleGuard('ADMIN', 'SALES')) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/orders');
  });
});
