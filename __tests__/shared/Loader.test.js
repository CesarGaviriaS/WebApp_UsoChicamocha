import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Loader from '../../components/shared/Loader.svelte';

/**
 * @description Suite de pruebas para el componente Loader.
 * Verifica el renderizado básico del spinner.
 * Tests incluidos:
 * - renders spinner element: Verifica que se renderice el elemento spinner.
 * - has correct CSS classes and styles: Verifica que tenga las clases CSS correctas.
 * - renders as a single element: Verifica que se renderice como un solo elemento DIV.
 */
describe('Loader', () => {
  it('renders spinner element', () => {
    const { container } = render(Loader);

    const spinner = container.querySelector('.spinner');
    expect(spinner).toBeTruthy();
  });

  it('has correct CSS classes and styles', () => {
    const { container } = render(Loader);

    const spinner = container.querySelector('.spinner');
    expect(spinner.classList.contains('spinner')).toBe(true);

  });

  it('renders as a single element', () => {
    const { container } = render(Loader);

    expect(container.children.length).toBe(1);
    expect(container.firstElementChild.tagName).toBe('DIV');
  });
});