import { TestBed } from '@angular/core/testing';
import { LifeCycleTrack } from './life-cycle-track';

describe('LifeCycleTrack', () => {
  function render(status: string): HTMLElement {
    const fixture = TestBed.createComponent(LifeCycleTrack);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('fills every step up to the current one', () => {
    const element = render('SHIPPED');
    const done = Array.from(element.querySelectorAll('li.done')).map((li) =>
      li.textContent?.trim(),
    );
    expect(done).toEqual(['Borrador', 'Confirmado', 'Enviado']);
    expect(element.querySelector('[aria-current="step"]')?.textContent?.trim()).toBe('Enviado');
  });

  it('shows a cancelled order instead of the track', () => {
    const element = render('CANCELLED');
    expect(element.querySelector('ol')).toBeNull();
    expect(element.textContent).toContain('Pedido cancelado');
  });
});
