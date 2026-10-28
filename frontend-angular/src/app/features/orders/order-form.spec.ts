import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { noDuplicateProducts, orderTotal } from './order-form';

describe('orderTotal', () => {
  const prices = new Map([
    [1, 9.9],
    [2, 0.1],
    [3, 0.2],
  ]);

  it('adds quantity x price per line', () => {
    expect(orderTotal([{ productId: 1, quantity: 3 }], prices)).toBe(29.7);
  });

  it('avoids floating point errors by working in cents', () => {
    expect(
      orderTotal(
        [
          { productId: 2, quantity: 1 },
          { productId: 3, quantity: 1 },
        ],
        prices,
      ),
    ).toBe(0.3);
  });

  it('ignores lines without a product yet', () => {
    expect(orderTotal([{ productId: null, quantity: 5 }], prices)).toBe(0);
  });
});

describe('noDuplicateProducts', () => {
  const line = (productId: number | null) =>
    new FormGroup({
      productId: new FormControl(productId),
      quantity: new FormControl(1, { nonNullable: true }),
    });

  it('accepts different products', () => {
    expect(noDuplicateProducts(new FormArray([line(1), line(2), line(null)]))).toBeNull();
  });

  it('rejects the same product twice', () => {
    expect(noDuplicateProducts(new FormArray([line(1), line(1)]))).toEqual({
      duplicateProduct: true,
    });
  });
});
