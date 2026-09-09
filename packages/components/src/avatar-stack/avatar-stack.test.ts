import { html, fixture, expect } from '@open-wc/testing';
import './avatar-stack.js';
import type { CdzAvatarStack } from './avatar-stack.js';
import type { CdzAvatar } from '../avatar/avatar.js';

const TEAM = [
  { name: 'Ana López' },
  { name: 'Beto Ruiz' },
  { name: 'Carla Díaz' },
  { name: 'Diego Mena' },
  { name: 'Elena Sosa' }
];

const stack = (max = 0) =>
  fixture<CdzAvatarStack>(
    html`<cdz-avatar-stack
      label="Equipo del proyecto"
      .people=${TEAM}
      max=${max}
    ></cdz-avatar-stack>`
  );

const itemsOf = (el: CdzAvatarStack) => Array.from(el.shadowRoot!.querySelectorAll('li'));
const avatarsOf = (el: CdzAvatarStack) =>
  Array.from(el.shadowRoot!.querySelectorAll<CdzAvatar>('cdz-avatar'));

describe('cdz-avatar-stack', () => {
  it('is a real list of real list items', async () => {
    const el = await stack();
    const list = el.shadowRoot!.querySelector('ul');

    // <ul> may only directly contain <li>. That is why the avatars are
    // rendered rather than slotted: a bare <slot> in a <ul> would put
    // generic wrappers between the list and its items. See ADR-0030.
    expect(list).to.exist;
    expect(itemsOf(el)).to.have.lengthOf(5);
    expect([...list!.children].every((child) => child.tagName === 'LI')).to.be.true;
  });

  it('names the list, so it is not just "list, 5 items"', async () => {
    const el = await stack();
    expect(el.shadowRoot!.querySelector('ul')?.getAttribute('aria-label')).to.equal(
      'Equipo del proyecto'
    );
  });

  it('composes the atom without costing it its accessible name', async () => {
    const el = await stack();
    const avatars = avatarsOf(el);

    // The mirror of ADR-0029's contrast test. There, nesting the atom
    // destroyed the guarantee it was chosen for. Here the guarantee is the
    // avatar's own accessible name, which survives nesting — which is
    // exactly why this molecule may compose the atom and that one may not.
    expect(avatars).to.have.lengthOf(5);
    expect(avatars.map((a) => a.name)).to.deep.equal(TEAM.map((p) => p.name));

    const inner = avatars[0].shadowRoot!.querySelector('[role="img"], img');
    expect(inner?.getAttribute('aria-label') ?? inner?.getAttribute('alt')).to.equal('Ana López');
  });

  it('collapses everyone past max into a single count', async () => {
    const el = await stack(3);

    expect(avatarsOf(el)).to.have.lengthOf(3);
    expect(el.shadowRoot!.querySelector('.overflow')?.textContent?.trim()).to.equal('+2');
    expect(itemsOf(el)).to.have.lengthOf(4);
  });

  it('does not render the hidden people at all, keeping parity with what is seen', async () => {
    const el = await stack(2);

    // Not hidden with CSS: absent. A sighted user cannot read them either,
    // so leaving them in the accessibility tree would expose names the
    // visual design already decided not to show.
    const names = avatarsOf(el).map((a) => a.name);
    expect(names).to.deep.equal(['Ana López', 'Beto Ruiz']);
    expect(el.shadowRoot!.textContent).to.not.contain('Carla');
  });

  it('shows everyone and no chip when max is unset or not reached', async () => {
    const all = await stack();
    expect(avatarsOf(all)).to.have.lengthOf(5);
    expect(all.shadowRoot!.querySelector('.overflow')).to.be.null;

    const roomy = await stack(9);
    expect(avatarsOf(roomy)).to.have.lengthOf(5);
    expect(roomy.shadowRoot!.querySelector('.overflow')).to.be.null;
  });

  it('stacks later avatars on top, so no initial loses its first letter', async () => {
    const el = await stack(3);
    const z = itemsOf(el).map((li) => Number(getComputedStyle(li).zIndex));

    // Strictly ascending. The conventional-looking order is the reverse,
    // and it clips the LEFT edge of every avatar after the first — which
    // with initials (this system's default fallback) eats the letter a
    // reader starts on. Found by looking at it, not by reasoning about it.
    expect(z).to.deep.equal([...z].sort((a, b) => a - b));
    expect(new Set(z).size, 'no two items share a layer').to.equal(z.length);
  });

  it('forwards size to every avatar, so a stack cannot be ragged', async () => {
    const el = await fixture<CdzAvatarStack>(
      html`<cdz-avatar-stack label="Equipo" size="lg" .people=${TEAM} max="3"></cdz-avatar-stack>`
    );
    expect(avatarsOf(el).every((a) => a.size === 'lg')).to.be.true;
  });

  it('passes src and fallback through to the atom', async () => {
    const el = await fixture<CdzAvatarStack>(
      html`<cdz-avatar-stack
        label="Equipo"
        .people=${[
          { name: 'Ana López', src: '/ana.png' },
          { name: 'Beto Ruiz', fallback: 'icon' as const }
        ]}
      ></cdz-avatar-stack>`
    );
    const [first, second] = avatarsOf(el);
    expect(first.src).to.equal('/ana.png');
    expect(second.fallback).to.equal('icon');
  });

  it('warns when the list has no name', async () => {
    // console.error, not console.warn — see shared/required-label.ts.
    const errors: string[] = [];
    const original = console.error;
    console.error = (msg: string) => errors.push(msg);

    await fixture<CdzAvatarStack>(html`<cdz-avatar-stack .people=${TEAM}></cdz-avatar-stack>`);

    console.error = original;
    expect(errors.some((e) => e.includes('cdz-avatar-stack'))).to.be.true;
  });

  it('renders an empty list rather than breaking when there is nobody', async () => {
    const el = await fixture<CdzAvatarStack>(
      html`<cdz-avatar-stack label="Equipo"></cdz-avatar-stack>`
    );
    expect(itemsOf(el)).to.have.lengthOf(0);
    expect(el.shadowRoot!.querySelector('.overflow')).to.be.null;
  });

  it('is accessible with and without an overflow chip', async () => {
    await expect(await stack()).to.be.accessible();
    await expect(await stack(3)).to.be.accessible();
    await expect(
      await fixture<CdzAvatarStack>(
        html`<cdz-avatar-stack label="Equipo" size="sm" .people=${TEAM} max="2"></cdz-avatar-stack>`
      )
    ).to.be.accessible();
  });
});
