import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  const auth = { token: vi.fn<() => string | null>(), logout: vi.fn() };

  beforeEach(() => {
    auth.token.mockReturnValue('jwt-token');
    auth.logout.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('adds the bearer token to API calls', () => {
    http.get('/api/orders').subscribe();
    expect(backend.expectOne('/api/orders').request.headers.get('Authorization')).toBe(
      'Bearer jwt-token',
    );
  });

  it('does not send the token to the login endpoint or to other hosts', () => {
    http.post('/api/auth/login', {}).subscribe();
    http.get('https://fonts.googleapis.com/css').subscribe();
    expect(backend.expectOne('/api/auth/login').request.headers.has('Authorization')).toBe(false);
    expect(
      backend.expectOne('https://fonts.googleapis.com/css').request.headers.has('Authorization'),
    ).toBe(false);
  });

  it('logs out when the API answers 401', () => {
    http.get('/api/orders').subscribe({ error: () => undefined });
    backend.expectOne('/api/orders').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(auth.logout).toHaveBeenCalledOnce();
  });

  it('does not log out on other errors', () => {
    http.get('/api/orders/9').subscribe({ error: () => undefined });
    backend.expectOne('/api/orders/9').flush(null, { status: 404, statusText: 'Not Found' });
    expect(auth.logout).not.toHaveBeenCalled();
  });
});
