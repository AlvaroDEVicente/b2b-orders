import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoginResponse } from '../api/models';
import { AuthService } from './auth.service';

const RESPONSE: LoginResponse = {
  token: 'jwt-token',
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  user: {
    id: 2,
    email: 'marcos@example.com',
    fullName: 'Marcos Ruiz',
    role: 'SALES',
    customerId: null,
  },
};

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }]),
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts logged out', () => {
    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.role()).toBeNull();
  });

  it('keeps the session after logging in', () => {
    auth.login('marcos@example.com', 'demo1234').subscribe();
    const request = http.expectOne('/api/auth/login');
    expect(request.request.body).toEqual({ email: 'marcos@example.com', password: 'demo1234' });
    request.flush(RESPONSE);

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.token()).toBe('jwt-token');
    expect(auth.isStaff()).toBe(true);
    expect(auth.hasRole('ADMIN')).toBe(false);
    expect(localStorage.getItem('b2b-orders.session')).toContain('jwt-token');
  });

  it('forgets the session on logout', () => {
    auth.login('marcos@example.com', 'demo1234').subscribe();
    http.expectOne('/api/auth/login').flush(RESPONSE);

    auth.logout();

    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('b2b-orders.session')).toBeNull();
  });

  it('ignores a stored session whose token has expired', () => {
    localStorage.setItem(
      'b2b-orders.session',
      JSON.stringify({ ...RESPONSE, expiresAt: new Date(Date.now() - 1000).toISOString() }),
    );
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }]),
      ],
    });
    http = TestBed.inject(HttpTestingController);

    expect(TestBed.inject(AuthService).isLoggedIn()).toBe(false);
  });
});
