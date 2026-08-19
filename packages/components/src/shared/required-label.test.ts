import { expect } from '@open-wc/testing';
import { warnIfLabelMissing } from './required-label.js';

describe('warnIfLabelMissing', () => {
  it('warns with the given tag name when label is empty', () => {
    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      warnIfLabelMissing('cdz-select', '');
    } finally {
      console.error = originalError;
    }
    expect(calls.length).to.equal(1);
    expect(String(calls[0][0])).to.include('cdz-select');
    expect(String(calls[0][0])).to.include('label');
  });

  it('warns when label is only whitespace', () => {
    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      warnIfLabelMissing('cdz-select', '   ');
    } finally {
      console.error = originalError;
    }
    expect(calls.length).to.equal(1);
  });

  it('does not warn when label has content', () => {
    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      warnIfLabelMissing('cdz-select', 'Correo');
    } finally {
      console.error = originalError;
    }
    expect(calls.length).to.equal(0);
  });
});
