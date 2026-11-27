import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DetalleEstudioPage } from '../DetalleEstudioPage'
import { server } from '../../../test/mocks/server'

function renderPage(id = '1') {
    return render(
        <MemoryRouter initialEntries={[`/estudios/${id}`]}>
            <Routes>
                <Route path="/estudios/:id" element={<DetalleEstudioPage />} />
            </Routes>
        </MemoryRouter>,
    )
}

const archivoPDF = new File(['contenido de pdf'], 'nuevo.pdf', {
    type: 'application/pdf',
})

describe('DetalleEstudioPage', () => {
    beforeEach(() => {
        localStorage.clear()
        server.use(
            http.put('*/estudios/:id/archivo', ({ params }) => {
                const id = Number(params.id)
                return HttpResponse.json({
                    id,
                    pacienteId: 10,
                    tipo: 'Hemograma completo',
                    fecha: '2026-02-10',
                    descripcion: 'Control de rutina',
                    archivoURL: `https://archivos.test.com/estudios/${id}/archivo.pdf`,
                    createdAt: '2026-02-10T08:00:00Z',
                    updatedAt: '2026-01-01T00:00:00Z',
                })
            }),
        )
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('estudio sin archivo adjunto (id 1)', () => {
        it('carga y muestra los datos del estudio', async () => {
            renderPage('1')

            expect(screen.getByText('Cargando estudio...')).toBeInTheDocument()
            await screen.findByText('Estudio 1')
            expect(
                screen.getByText('Pérez, Ana (DNI 12345678)'),
            ).toBeInTheDocument()
            expect(screen.getByText('Hemograma completo')).toBeInTheDocument()
            expect(screen.getByText('2026-02-10')).toBeInTheDocument()
            expect(screen.getByText('Control de rutina')).toBeInTheDocument()
        })

        it('muestra "Sin archivo adjunto" cuando no hay archivoURL', async () => {
            renderPage('1')
            await screen.findByText('Estudio 1')

            expect(screen.getByText('Sin archivo adjunto.')).toBeInTheDocument()
            expect(
                screen.queryByRole('button', { name: 'Abrir archivo' }),
            ).not.toBeInTheDocument()
        })

        it('reemplaza el archivo y muestra mensaje de éxito', async () => {
            const user = userEvent.setup()
            renderPage('1')
            await screen.findByText('Estudio 1')

            await user.upload(
                screen.getByLabelText('Reemplazar archivo'),
                archivoPDF,
            )
            await user.click(
                screen.getByRole('button', { name: 'Reemplazar archivo' }),
            )

            expect(
                await screen.findByText('Archivo actualizado correctamente.'),
            ).toBeInTheDocument()
        })

        it('rechaza un archivo con tipo no permitido', async () => {
            renderPage('1')
            await screen.findByText('Estudio 1')

            const input = screen.getByLabelText('Reemplazar archivo')
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
        })
    })

    describe('estudio con archivo adjunto (id 2)', () => {
        it('muestra el botón "Abrir archivo" y lo abre en una pestaña nueva', async () => {
            const openSpy = vi
                .spyOn(window, 'open')
                .mockImplementation(() => null as unknown as Window)

            renderPage('2')
            await screen.findByText('Estudio 2')
            expect(
                screen.getByText('Gómez, Juan (DNI 87654321)'),
            ).toBeInTheDocument()
            expect(screen.getByText('Radiografía de tórax')).toBeInTheDocument()
            expect(
                screen.getByText('El estudio tiene un archivo adjunto.'),
            ).toBeInTheDocument()

            await userEvent
                .setup()
                .click(screen.getByRole('button', { name: 'Abrir archivo' }))

            expect(openSpy).toHaveBeenCalledWith(
                'https://archivos.test.com/estudios/2/download',
                '_blank',
                'noopener,noreferrer',
            )
        })

        it('muestra el error cuando no se puede obtener la URL del archivo', async () => {
            server.use(
                http.get(
                    '*/estudios/:id/archivo',
                    () =>
                        new HttpResponse(
                            JSON.stringify({ mensaje: 'Sin archivo' }),
                            { status: 500 },
                        ),
                ),
            )

            renderPage('2')
            await screen.findByText('Estudio 2')

            await userEvent
                .setup()
                .click(screen.getByRole('button', { name: 'Abrir archivo' }))

            // obtenerMensajeError extrae 'mensaje' del cuerpo de la respuesta
            const alerta = await screen.findByRole('alert')
            expect(alerta).toHaveTextContent('Sin archivo')
        })
    })

    describe('estudio no encontrado', () => {
        it('muestra el error cuando el estudio no existe', async () => {
            renderPage('999')

            expect(await screen.findByText('No encontrado')).toBeInTheDocument()
        })
    })
})
