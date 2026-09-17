import { expect } from '@open-wc/testing';
import { nextId } from './next-id.js';

describe('nextId', () => {
  it('is deterministic and sequential per prefix', () => {
    // The point of a counter over Math.random(): the same sequence of calls
    // produces the same names, so rendered markup does not churn between
    // two otherwise identical renders.
    const a = nextId('cdz-probe-a');
    const b = nextId('cdz-probe-a');
    expect(a).to.equal('cdz-probe-a-1');
    expect(b).to.equal('cdz-probe-a-2');
  });

  it('keeps each prefix on its own sequence', () => {
    // Not a single global counter: numbering that jumps according to what
    // else happened to be constructed first is harder to read in the DOM.
    expect(nextId('cdz-probe-b')).to.equal('cdz-probe-b-1');
    expect(nextId('cdz-probe-c')).to.equal('cdz-probe-c-1');
    expect(nextId('cdz-probe-b')).to.equal('cdz-probe-b-2');
  });

  it('never repeats a name for one prefix', () => {
    const seen = new Set(Array.from({ length: 200 }, () => nextId('cdz-probe-d')));
    expect(seen.size).to.equal(200);
  });
});
