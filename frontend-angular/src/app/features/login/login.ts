import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { errorMessage } from '../../core/api/problem';
import { AuthService } from '../../core/auth/auth.service';

interface DemoUser {
  email: string;
  label: string;
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="page">
      <section class="intro">
        <h1>Pedidos B2B y licencias de marca</h1>
        <p>
          Los distribuidores piden accesorios de las marcas que tienen licenciadas. Los comerciales
          siguen los pedidos de sus clientes y administración calcula los royalties de cada marca.
        </p>
      </section>

      <form class="panel" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <h2>Iniciar sesión</h2>

        @if (error(); as message) {
          <p class="alert" role="alert">{{ message }}</p>
        }

        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" autocomplete="username" />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <p class="field-error">Escribe un email válido.</p>
          }
        </div>

        <div class="field">
          <label for="password">Contraseña</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            autocomplete="current-password"
          />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <p class="field-error">Escribe la contraseña.</p>
          }
        </div>

        <button type="submit" [disabled]="loading()">
          {{ loading() ? 'Entrando…' : 'Entrar' }}
        </button>

        <div class="demo">
          <p class="muted">Usuarios de demostración (contraseña <strong>demo1234</strong>):</p>
          <ul>
            @for (user of demoUsers; track user.email) {
              <li>
                <button type="button" class="link" (click)="useDemo(user)">{{ user.label }}</button>
              </li>
            }
          </ul>
        </div>
      </form>
    </div>
  `,
  styles: `
    .page {
      min-height: 100vh;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(18rem, 26rem);
      gap: 3rem;
      align-items: center;
      max-width: 64rem;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }
    .intro h1 {
      font-size: clamp(1.75rem, 4vw, 2.75rem);
      max-width: 16ch;
    }
    .intro p {
      max-width: 46ch;
      color: var(--muted);
      font-size: 1.0625rem;
    }
    form button[type='submit'] {
      width: 100%;
    }
    .demo {
      margin-top: 1.25rem;
      border-top: 1px solid var(--line);
      padding-top: 1rem;
      font-size: 0.875rem;
    }
    .demo p {
      margin: 0 0 0.25rem;
    }
    .demo ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .demo .link {
      padding: 0.125rem 0;
    }
    @media (max-width: 760px) {
      .page {
        grid-template-columns: 1fr;
        gap: 1.5rem;
        align-items: start;
      }
    }
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly demoUsers: DemoUser[] = [
    { email: 'admin@example.com', label: 'Entrar como administración' },
    { email: 'marcos.comercial@example.com', label: 'Entrar como comercial' },
    {
      email: 'cliente.cantabrico@example.com',
      label: 'Entrar como cliente de Móviles del Cantábrico',
    },
    { email: 'cliente.vera@example.com', label: 'Entrar como cliente de TecnoVera' },
  ];

  protected useDemo(user: DemoUser): void {
    this.form.setValue({ email: user.email, password: 'demo1234' });
    this.submit();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => void this.router.navigate(['/orders']),
      error: (error: unknown) => {
        this.error.set(errorMessage(error));
        this.loading.set(false);
      },
    });
  }
}
