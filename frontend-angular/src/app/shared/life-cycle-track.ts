import { Component, computed, input } from '@angular/core';
import { OrderStatus } from '../core/api/models';
import { LIFE_CYCLE, STATUS_LABELS } from './labels';

/**
 * The order's position on its life cycle, drawn like the stub of a delivery note:
 * every step up to the current one is filled, the rest are outlined.
 */
@Component({
  selector: 'app-life-cycle-track',
  template: `
    @if (cancelled()) {
      <p class="cancelled">Pedido cancelado</p>
    } @else {
      <ol class="track" aria-label="Estado del pedido">
        @for (step of steps(); track step.status) {
          <li
            [class.done]="step.done"
            [class.current]="step.current"
            [attr.aria-current]="step.current ? 'step' : null"
          >
            <span class="dot" aria-hidden="true"></span>
            <span class="name">{{ step.label }}</span>
          </li>
        }
      </ol>
    }
  `,
  styles: `
    .track {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      list-style: none;
      margin: 0;
      padding: 0;
      counter-reset: step;
    }
    li {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
      padding-top: 0.25rem;
      color: var(--muted);
    }
    li::before {
      content: '';
      position: absolute;
      top: 0.75rem;
      left: 1.25rem;
      right: 0;
      border-top: 2px dashed var(--line);
    }
    li:last-child::before {
      display: none;
    }
    li.done::before {
      border-top-style: solid;
      border-top-color: var(--accent);
    }
    li.current::before {
      border-top-style: dashed;
      border-top-color: var(--line);
    }
    .dot {
      position: relative;
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      border: 2px solid var(--line);
      background: var(--surface);
    }
    li.done {
      color: var(--ink);
    }
    li.done .dot {
      border-color: var(--accent);
      background: var(--accent);
    }
    li.current .dot {
      box-shadow: 0 0 0 4px var(--accent-bg);
    }
    .name {
      font-weight: 600;
      font-size: 0.875rem;
      padding-right: 0.5rem;
    }
    @media (max-width: 480px) {
      .name {
        font-size: 0.75rem;
      }
    }
    .cancelled {
      margin: 0;
      color: var(--danger);
      font-weight: 600;
    }
  `,
})
export class LifeCycleTrack {
  readonly status = input.required<OrderStatus>();

  protected readonly cancelled = computed(() => this.status() === 'CANCELLED');
  protected readonly steps = computed(() => {
    const currentIndex = LIFE_CYCLE.indexOf(this.status());
    return LIFE_CYCLE.map((status, index) => ({
      status,
      label: STATUS_LABELS[status],
      done: index <= currentIndex,
      current: index === currentIndex,
    }));
  });
}
