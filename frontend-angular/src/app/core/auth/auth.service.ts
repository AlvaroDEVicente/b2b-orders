import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginResponse, Role, User } from '../api/models';

const STORAGE_KEY = 'b2b-orders.session';

interface Session {
  token: string;
  expiresAt: string;
  user: User;
}

/**
 * Holds the logged-in session in a signal. Components read `user()` or `role()` and Angular
 * re-renders them automatically when the session changes (login, logout).
 *
 * The session is kept in localStorage so a page reload does not log the user out. The trade-off:
 * a script injected into the page (XSS) could read it. An httpOnly cookie would avoid that but needs
 * CSRF protection on the API; for this project the simpler option was chosen and Angular's template
 * escaping is the XSS defence.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<Session | null>(readStoredSession());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly role = computed<Role | null>(() => this.user()?.role ?? null);
  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly isStaff = computed(() => this.role() === 'ADMIN' || this.role() === 'SALES');

  token(): string | null {
    return this.session()?.token ?? null;
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap((response) => {
        const session: Session = {
          token: response.token,
          expiresAt: response.expiresAt,
          user: response.user,
        };
        safeStorage(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(session)));
        this.session.set(session);
      }),
    );
  }

  logout(): void {
    safeStorage(() => localStorage.removeItem(STORAGE_KEY));
    this.session.set(null);
    void this.router.navigate(['/login']);
  }

  hasRole(...roles: Role[]): boolean {
    const role = this.role();
    return role !== null && roles.includes(role);
  }
}

function readStoredSession(): Session | null {
  const raw = safeStorage(() => localStorage.getItem(STORAGE_KEY));
  if (!raw) {
    return null;
  }
  try {
    const session = JSON.parse(raw) as Session;
    // An expired token would only produce 401s: start logged out instead.
    return new Date(session.expiresAt).getTime() > Date.now() ? session : null;
  } catch {
    return null;
  }
}

/** localStorage can throw (private mode, blocked storage). The app must still work without it. */
function safeStorage<T>(action: () => T): T | null {
  try {
    return action();
  } catch {
    return null;
  }
}
