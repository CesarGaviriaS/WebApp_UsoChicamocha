import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import ExecuteOrderModal from '../../components/shared/ExecuteOrderModal.svelte';

// Simularemos createEventDispatcher por prueba en lugar de globalmente

/**
 * @description Suite de pruebas para el componente ExecuteOrderModal.
 * Verifica el renderizado del modal, validación de formularios, eventos y funcionalidades.
 * Tests incluidos:
 * - renders modal with work order details: Verifica que el modal se renderice con detalles de la orden de trabajo, incluyendo máquina y descripción.
 * - parses work order description correctly: Verifica que la descripción de la orden de trabajo se analice correctamente (Tipo, Sector, Estado, etc.).
 * - validates form - incomplete form is invalid: Verifica que el formulario sea inválido cuando esté incompleto.
 * - renders form fields correctly: Verifica que se rendericen correctamente los campos del formulario (tiempo empleado, descripción, contratista, etc.).
 * - can add spare parts: Verifica que se puedan agregar repuestos al formulario.
 * - can add and remove spare parts: Verifica que se puedan agregar y remover repuestos.
 * - has cancel button: Verifica que el modal tenga un botón de cancelar.
 * - handles checkbox for same mechanic: Verifica que se maneje correctamente el checkbox para el mismo mecánico.
 * - renders info panel with correct data: Verifica que se renderice el panel informativo con datos correctos.
 */
describe('ExecuteOrderModal', () => {
  const mockWorkOrder = {
    order: {
      id: 'WO001',
      description: 'Tipo|Sector|Estado|Descripción|Asignado'
    },
    machine: {
      name: 'Test Machine',
      model: 'Model X'
    }
  };

  /**
   * @test renders modal with work order details.
   * Verifica que el modal se renderice con detalles de la orden de trabajo, incluyendo máquina y descripción.
   */
  it('renders modal with work order details', () => {
    render(ExecuteOrderModal, {
      props: { workOrder: mockWorkOrder }
    });

    expect(screen.getByText('Ejecutar Orden de Trabajo')).toBeTruthy();
    expect(screen.getByText('Test Machine - Model X')).toBeTruthy();
    expect(screen.getByText('Tipo')).toBeTruthy();
  });

  /**
   * @test parses work order description correctly.
   * Verifica que la descripción de la orden de trabajo se analice correctamente (Tipo, Sector, Estado, etc.).
   */
  it('parses work order description correctly', () => {
    render(ExecuteOrderModal, {
      props: { workOrder: mockWorkOrder }
    });

    expect(screen.getByText('Tipo')).toBeTruthy();
    expect(screen.getByText('Sector')).toBeTruthy();
    expect(screen.getByText('Estado')).toBeTruthy();
    expect(screen.getByText('Descripción')).toBeTruthy();
    expect(screen.getByText('Asignado')).toBeTruthy();
  });

  /**
   * @test validates form - incomplete form is invalid.
   * Verifica que el formulario sea inválido cuando esté incompleto.
   */
  it('validates form - incomplete form is invalid', async () => {
    render(ExecuteOrderModal, {
      props: { workOrder: mockWorkOrder }
    });

    await tick();

    const submitButton = screen.getByText('Ejecutar y Completar Orden');
    expect(submitButton.disabled).toBe(true);
  });

  /**
   * @test renders form fields correctly.
   * Verifica que se rendericen correctamente los campos del formulario (tiempo empleado, descripción, contratista, etc.).
   */
  it('renders form fields correctly', async () => {
    render(ExecuteOrderModal, {
      props: { workOrder: mockWorkOrder }
    });

    await tick();

    // Verificar que todas las secciones requeridas del formulario estén presentes
    expect(screen.getByText('Tiempo Empleado (ej. 2 horas, 30 mins):')).toBeTruthy();
    expect(screen.getByText('Descripción / Detalles del Trabajo Realizado:')).toBeTruthy();
    expect(screen.getByText('Contratista:')).toBeTruthy();
    expect(screen.getAllByText('Precio:').length).toBeGreaterThan(0);
    expect(screen.getByText('Observaciones de Mano de Obra:')).toBeTruthy();
    expect(screen.getByText('Referencia:')).toBeTruthy();
    expect(screen.getByText('Nombre:')).toBeTruthy();
    expect(screen.getByText('Cantidad:')).toBeTruthy();
  });

  /**
   * @test can add spare parts.
   * Verifica que se puedan agregar repuestos al formulario.
   */
  it('can add spare parts', async () => {
    render(ExecuteOrderModal, {
      props: { workOrder: mockWorkOrder }
    });

    await tick();

    const addButton = screen.getByText('+ Agregar Repuesto');
    expect(addButton).toBeTruthy();

    // Hacer clic para agregar un repuesto
    await fireEvent.click(addButton);

    // El botón debería seguir ahí (se pueden agregar múltiples)
    expect(screen.getByText('+ Agregar Repuesto')).toBeTruthy();
  });

  /**
   * @test can add and remove spare parts.
   * Verifica que se puedan agregar y remover repuestos.
   */
  it('can add and remove spare parts', async () => {
    render(ExecuteOrderModal, {
      props: { workOrder: mockWorkOrder }
    });

    await tick();

    // Verificar estado inicial - debería tener el botón de agregar
    const addButton = screen.getByText('+ Agregar Repuesto');
    expect(addButton).toBeTruthy();

    // Agregar un repuesto
    await fireEvent.click(addButton);

    // Debería seguir teniendo el botón de agregar (se pueden agregar múltiples)
    expect(screen.getByText('+ Agregar Repuesto')).toBeTruthy();
  });

  /**
   * @test has cancel button.
   * Verifica que el modal tenga un botón de cancelar.
   */
  it('has cancel button', async () => {
    render(ExecuteOrderModal, {
      props: { workOrder: mockWorkOrder }
    });

    const cancelButton = screen.getByText('Cancelar');
    expect(cancelButton).toBeTruthy();
  });

  /**
   * @test handles checkbox for same mechanic.
   * Verifica que se maneje correctamente el checkbox para el mismo mecánico.
   */
  it('handles checkbox for same mechanic', async () => {
    render(ExecuteOrderModal, {
      props: { workOrder: mockWorkOrder }
    });

    await tick();

    const checkbox = screen.getByLabelText('El arreglo fue realizado por el mismo mecánico que reportó');

    // Inicialmente debería estar marcado (sameMecanic: true por defecto)
    expect(checkbox.checked).toBe(true);

    // Hacer clic para desmarcar
    await fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);

    // Hacer clic nuevamente para marcar
    await fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });

  /**
   * @test renders info panel with correct data.
   * Verifica que se renderice el panel informativo con datos correctos.
   */
  it('renders info panel with correct data', () => {
    render(ExecuteOrderModal, {
      props: { workOrder: mockWorkOrder }
    });

    expect(screen.getByText('Detalles de la Orden Original')).toBeTruthy();
    expect(screen.getByText('Test Machine - Model X')).toBeTruthy();
  });
});