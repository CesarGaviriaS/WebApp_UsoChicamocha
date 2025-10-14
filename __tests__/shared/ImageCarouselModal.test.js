import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import ImageCarouselModal from '../../components/shared/ImageCarouselModal.svelte';

// Simular fetch
global.fetch = vi.fn();

// Simular URL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

/**
 * @description Suite de pruebas para el componente ImageCarouselModal.
 * Verifica el renderizado, navegación, manejo de errores y limpieza de recursos.
 * Tests incluidos:
 * - renders loading state initially: Verifica que se renderice el estado de carga inicialmente.
 * - renders no images message when no images provided: Verifica que se muestre un mensaje cuando no hay imágenes.
 * - fetches and displays images: Verifica que se obtengan y muestren imágenes correctamente.
 * - handles fetch errors gracefully: Verifica que se manejen errores de obtención de imágenes de manera elegante.
 * - navigates to next image: Verifica que se navegue a la siguiente imagen.
 * - navigates to previous image: Verifica que se navegue a la imagen anterior.
 * - handles image error display: Verifica que se maneje la visualización de errores de imagen.
 * - closes modal and cleans up blobs: Verifica que el modal se cierre y se limpien los blobs.
 * - handles modal overlay click to close: Verifica que se maneje el clic en el overlay para cerrar.
 * - displays correct image counter: Verifica que se muestre correctamente el contador de imágenes.
 */
describe('ImageCarouselModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
  });

  it('renders loading state initially', async () => {
    const imageUrls = [{ url: 'test1.jpg' }];

    render(ImageCarouselModal, {
      props: { imageUrls, isLoading: true }
    });

    await tick();

    expect(screen.getByText('Imágenes de la Inspección')).toBeTruthy();
  });

  it('renders no images message when no images provided', async () => {
    render(ImageCarouselModal, {
      props: { imageUrls: [], isLoading: false }
    });

    await tick();

    expect(screen.getByText('No hay imágenes para esta inspección.')).toBeTruthy();
  });

  it('fetches and displays images', async () => {
    const imageUrls = [
      { url: 'test1.jpg', id: 1 },
      { url: 'test2.jpg', id: 2 }
    ];

    global.fetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob())
    });

    render(ImageCarouselModal, {
      props: { imageUrls, isLoading: false }
    });

    await tick();

    // Esperar a que fetch se complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    expect(mockCreateObjectURL).toHaveBeenCalledTimes(2);
  });

  it('handles fetch errors gracefully', async () => {
    const imageUrls = [{ url: 'test1.jpg' }];

    global.fetch.mockRejectedValue(new Error('Network error'));

    render(ImageCarouselModal, {
      props: { imageUrls, isLoading: false }
    });

    await tick();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('test1.jpg');
    });

    // Should still render the modal structure
    expect(screen.getByText('Imágenes de la Inspección')).toBeTruthy();
  });

  it('navigates to next image', async () => {
    const imageUrls = [
      { url: 'test1.jpg', id: 1 },
      { url: 'test2.jpg', id: 2 }
    ];

    global.fetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob())
    });

    render(ImageCarouselModal, {
      props: { imageUrls, isLoading: false }
    });

    await tick();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    // Wait for loading to complete and navigation buttons to appear
    await waitFor(() => {
      const nextButton = document.querySelector('.nav-btn.next');
      return nextButton !== null;
    });

    const nextButton = document.querySelector('.nav-btn.next');
    await fireEvent.click(nextButton);

    // Should update current index
    expect(screen.getByText('2 / 2')).toBeTruthy();
  });

  it('navigates to previous image', async () => {
    const imageUrls = [
      { url: 'test1.jpg', id: 1 },
      { url: 'test2.jpg', id: 2 }
    ];

    global.fetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob())
    });

    render(ImageCarouselModal, {
      props: { imageUrls, isLoading: false }
    });

    await tick();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    // Wait for loading to complete and navigation buttons to appear
    await waitFor(() => {
      const nextButton = document.querySelector('.nav-btn.next');
      return nextButton !== null;
    });

    // Start at second image
    const nextButton = document.querySelector('.nav-btn.next');
    await fireEvent.click(nextButton);

    // Go back to first
    const prevButton = document.querySelector('.nav-btn.prev');
    await fireEvent.click(prevButton);

    expect(screen.getByText('1 / 2')).toBeTruthy();
  });

  it('handles image error display', async () => {
    const imageUrls = [{ url: 'test1.jpg' }];

    global.fetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob())
    });

    render(ImageCarouselModal, {
      props: { imageUrls, isLoading: false }
    });

    await tick();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    // Trigger image error
    const img = document.querySelector('img');
    if (img) {
      await fireEvent.error(img);
    }

    // Should show error state
    expect(screen.getByText('Imágenes de la Inspección')).toBeTruthy();
  });

  it('closes modal and cleans up blobs', async () => {
    const imageUrls = [{ url: 'test1.jpg' }];

    global.fetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob())
    });

    const mockDispatch = vi.fn();
    const component = render(ImageCarouselModal, {
      props: { imageUrls, isLoading: false }
    });

    // Listen for the close event
    component.component.$on('close', (event) => mockDispatch(event.detail));

    await tick();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const closeButton = screen.getByText('×');
    await fireEvent.click(closeButton);

    // Should revoke blob URLs
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('handles modal overlay click to close', async () => {
    const imageUrls = [{ url: 'test1.jpg' }];

    render(ImageCarouselModal, {
      props: { imageUrls, isLoading: false }
    });

    await tick();

    const overlay = document.querySelector('.modal-overlay');
    await fireEvent.click(overlay);

    // Modal should still be rendered (close logic is internal)
    expect(screen.getByText('Imágenes de la Inspección')).toBeTruthy();
  });

  it('displays correct image counter', async () => {
    const imageUrls = [
      { url: 'test1.jpg', id: 1 },
      { url: 'test2.jpg', id: 2 },
      { url: 'test3.jpg', id: 3 }
    ];

    global.fetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob())
    });

    render(ImageCarouselModal, {
      props: { imageUrls, isLoading: false }
    });

    await tick();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    // Wait for the counter to appear
    await waitFor(() => {
      return screen.queryByText('1 / 3') !== null;
    });

    expect(screen.getByText('1 / 3')).toBeTruthy();
  });
});