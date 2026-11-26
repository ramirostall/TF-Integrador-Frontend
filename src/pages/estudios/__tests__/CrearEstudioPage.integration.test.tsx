import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { CrearEstudioPage } from '../CrearEstudioPage'
import { iniciarSesionComo } from '../../../test/sesion'
import { server } from '../../../test/mocks/server'

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/estudios/nuevo']}>
            <Routes>
                <Route path="/estudios/nuevo" element={<CrearEstudioPage />} />
                <Route
                    path="/estudios/:id"
                    element={<div>Detalle del estudio</div>}
                />
            </Routes>
        </MemoryRouter>,
    )
}

const archivoPDF = new File(['contenido de pdf'], 'analisis.pdf', {
    type: 'application/pdf',
})

async function completarFormularioBasico(
    user: ReturnType<typeof userEvent.setup>,
) {
    const select = screen.getByLabelText('Paciente')
    await user.selectOptions(select, '10')
    await user.type(screen.getByLabelText('Tipo'), 'Hemograma')
    await user.type(screen.getByLabelText('Fecha'), '2026-02-10')
    await user.type(screen.getByLabelText('Descripción'), 'Control de rutina')
}

describe('CrearEstudioPage', () => {
    beforeEach(() => {
        localStorage.clear()
        server.use(
            http.post('*/estudios', () =>
                HttpResponse.json(
                    {
                        id: 99,
                        pacienteId: 10,
                        tipo: 'Hemograma',
                        fecha: '2026-02-10',
                        descripcion: 'Control de rutina',
                        archivoURL: null,
                        createdAt: '2026-01-01T00:00:00Z',
                        updatedAt: '2026-01-01T00:00:00Z',
                    },
                    { status: 201 },
                ),
            ),
        )
    })

    describe('como ADMIN', () => {
        beforeEach(() => {
            iniciarSesionComo('ADMIN')
        })

        it('carga el select de pacientes y crea el estudio', async () => {
            const user = userEvent.setup()
            renderPage()

            await screen.findByText(/Pérez, Ana \(DNI 12345678\)/)
            await completarFormularioBasico(user)
            await user.upload(
                screen.getByLabelText('Archivo (opcional)'),
                archivoPDF,
            )

            await user.click(
                screen.getByRole('button', { name: 'Crear estudio' }),
            )

            // Redirecciona al detalle del estudio creado
            expect(
                await screen.findByText('Detalle del estudio'),
            ).toBeInTheDocument()
        })

        it('no envía la petición si faltan campos obligatorios', async () => {
            const user = userEvent.setup()
            renderPage()

            await user.click(
                screen.getByRole('button', { name: 'Crear estudio' }),
            )

            // La validación nativa del formulario impide el envío
            expect(
                screen.queryByText('Detalle del estudio'),
            ).not.toBeInTheDocument()
        })

        it('muestra el error del servidor cuando falla la creación', async () => {
            server.use(
                http.post(
                    '*/estudios',
                    () =>
                        new HttpResponse(
                            JSON.stringify({ mensaje: 'Error al guardar' }),
                            { status: 500 },
                        ),
                ),
            )

            const user = userEvent.setup()
            renderPage()
            await screen.findByText(/Pérez, Ana \(DNI 12345678\)/)

            await completarFormularioBasico(user)
            await user.click(
                screen.getByRole('button', { name: 'Crear estudio' }),
            )

            const alerta = await screen.findByRole('alert')
            expect(alerta).toHaveTextContent('Error al guardar')
        })
    })

    describe('como PACIENTE', () => {
        beforeEach(() => {
            iniciarSesionComo('PACIENTE')
        })

        it('muestra los datos de su propio perfil y no muestra el select de pacientes', async () => {
            renderPage()

            await screen.findByText(/Pérez, Ana \(DNI 12345678\)/)
            expect(screen.queryByLabelText('Paciente')).not.toBeInTheDocument()
        })
    })

    describe('validación de archivo', () => {
        beforeEach(() => {
            iniciarSesionComo('ADMIN')
        })

        it('rechaza un archivo con tipo no permitido y no lo envía', async () => {
            const user = userEvent.setup()
            renderPage()
            await screen.findByText(/Pérez, Ana \(DNI 12345678\)/)

            const select = screen.getByLabelText('Paciente')
            await user.selectOptions(select, '10')
            await user.type(screen.getByLabelText('Tipo'), 'Hemograma')
            await user.type(screen.getByLabelText('Fecha'), '2026-02-10')
            await user.type(screen.getByLabelText('Descripción'), 'Control')

            const input = screen.getByLabelText('Archivo (opcional)')
            const archivoTxt = new File(['texto'], 'notas.txt', {
                type: 'text/plain',
            })
            Object.defineProperty(input, 'files', { value: [archivoTxt] })
            fireEvent.change(input)

            expect(
                screen.getByText(
                    'Tipo de archivo no permitido. Solo se aceptan PDF, JPEG o PNG.',
                ),
            ).toBeInTheDocument()

            await user.click(
                screen.getByRole('button', { name: 'Crear estudio' }),
            )
            expect(
                screen.queryByText('Detalle del estudio'),
            ).not.toBeInTheDocument()
        })
    })
})
