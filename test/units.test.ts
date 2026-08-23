import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convert, dimensionOf, supportedUnits } from '../src/units.ts';

test('length: km to m', () => {
  const r = convert(1, 'km', 'm');
  assert.equal(r.value, 1000);
  assert.equal(r.dimension, 'length');
});

test('length: mi to ft', () => {
  const r = convert(1, 'mi', 'ft');
  assert.ok(Math.abs(r.value - 5280) < 1e-6);
});

test('mass: kg to g', () => {
  assert.equal(convert(2.5, 'kg', 'g').value, 2500);
});

test('mass: lb to oz', () => {
  const r = convert(1, 'lb', 'oz');
  assert.ok(Math.abs(r.value - 16) < 1e-6);
});

test('time: h to s and back', () => {
  assert.equal(convert(1, 'h', 's').value, 3600);
  assert.equal(convert(3600, 's', 'h').value, 1);
});

test('temperature: C to F', () => {
  assert.equal(convert(100, 'C', 'F').value, 212);
});

test('temperature: F to C', () => {
  assert.equal(convert(32, 'F', 'C').value, 0);
});

test('temperature: C to K', () => {
  assert.equal(convert(0, 'C', 'K').value, 273.15);
});

test('temperature: F to K', () => {
  const r = convert(32, 'F', 'K');
  assert.ok(Math.abs(r.value - 273.15) < 1e-9);
});

test('temperature round trip stays put', () => {
  const r = convert(37, 'C', 'C');
  assert.equal(r.value, 37);
  assert.equal(r.dimension, 'temperature');
});

test('same unit is a no-op for non-temperature dimensions', () => {
  assert.equal(convert(42, 'kg', 'kg').value, 42);
});

test('volume: m3 to l', () => {
  assert.equal(convert(1, 'm3', 'l').value, 1000);
});

test('volume: gal to l', () => {
  const r = convert(1, 'gal', 'l');
  assert.ok(Math.abs(r.value - 3.785411784) < 1e-9);
});

test('area: km2 to m2', () => {
  assert.equal(convert(1, 'km2', 'm2').value, 1e6);
});

test('area: acre to m2', () => {
  const r = convert(1, 'acre', 'm2');
  assert.ok(Math.abs(r.value - 4046.8564224) < 1e-6);
});

test('rejects mismatched dimensions', () => {
  assert.throws(() => convert(1, 'km', 'kg'), /量纲不匹配/);
});

test('rejects unknown source unit', () => {
  assert.throws(() => convert(1, 'parsec', 'm'), /未知单位/);
});

test('rejects unknown target unit', () => {
  assert.throws(() => convert(1, 'm', 'parsec'), /未知单位/);
});

test('rejects non-finite values', () => {
  assert.throws(() => convert(NaN, 'm', 'km'));
  assert.throws(() => convert(Infinity, 'm', 'km'));
});

test('dimensionOf finds the right table', () => {
  assert.equal(dimensionOf('km'), 'length');
  assert.equal(dimensionOf('lb'), 'mass');
  assert.equal(dimensionOf('h'), 'time');
});

test('dimensionOf returns null for unknown units and bare temperature symbols', () => {
  assert.equal(dimensionOf('parsec'), null);
  assert.equal(dimensionOf('C'), null);
});

test('supportedUnits covers every dimension plus temperature', () => {
  const units = supportedUnits();
  for (const u of ['m', 'km', 'g', 'kg', 's', 'h', 'C', 'F', 'K', 'l', 'm3', 'm2', 'acre']) {
    assert.ok(units.includes(u), `expected ${u} in supportedUnits()`);
  }
});
