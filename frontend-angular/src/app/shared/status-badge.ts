import { Component, computed, input } from '@angular/core';
import { OrderStatus } from '../core/api/models';
import { STATUS_LABELS } from './labels';

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [attr.data-status]="status()">{{ label() }}</span>`,
  styles: `
    .badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8125rem;
      font-weight: 600;
      border: 1px solid currentColor;
      white-space: nowrap;
    }
    [data-status='DRAFT'] {
      color: var(--draft-ink);
      background: var(--draft-bg);
    }
    [data-status='CONFIRMED'] {
      color: var(--accent);
      background: var(--accent-bg);
    }
    [data-status='SHIPPED'] {
      color: var(--ink);
      background: var(--paper);
    }
    [data-status='DELIVERED'] {
      color: var(--ok);
      background: var(--ok-bg);
    }
    [data-status='CANCELLED'] {
      color: var(--muted);
      background: transparent;
      text-decoration: line-through;
    }
  `,
})
export class StatusBadge {
  readonly status = input.required<OrderStatus>();
  protected readonly label = computed(() => STATUS_LABELS[this.status()]);
}
