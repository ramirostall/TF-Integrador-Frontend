import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AutorizacionesPage } from '../AutorizacionesPage'
import { iniciarSesionComo } from '../../../test/sesion'
import { server } from '../../../test/mocks/server'

function renderPage() {
    return render(
        <MemoryRouter>
            <AutorizacionesPage />
        </MemoryRouter>,
    )
}

describe('AutorizacionesPage', () => {
    afterEach(() => {
        localStorage.clear()
        vi.restoreAllMocks()
    })

    describe('como ADMIN', () => {
        beforeEach(() => {
            iniciarSesionComo('ADMIN')
        })

        it('carga y muestra el listado de autorizaciones con estudio y profesional', async () => {
            renderPage()

            expect(
                screen.getByText('Cargando autorizaciones...'),
            ).toBeInTheDocument()
            await screen.findByText('1')
            await screen.findByText('2')
            expect(screen.getByText('Radiografía de tórax')).toBeInTheDocument()
            expect(screen.getByText('Hemograma completo')).toBeInTheDocument()
            // El nombre del profesional está separado por <br> en el DOM
            expect(screen.getByText(/Ana/)).toBeInTheDocument()
            expect(screen.getByText(/Lopez/)).toBeInTheDocument()
            expect(screen.getByText(/Carlos/)).toBeInTheDocument()
            expect(screen.getByText(/Ruiz/)).toBeInTheDocument()
            expect(screen.getByText('DISPONIBLE')).toBeInTheDocument()
            expect(screen.getByText('VENCIDO')).toBeInTheDocument()
        })

        it('muestra el enlace "Nueva autorización"', async () => {
            renderPage()
            await screen.findByText('1')

            expect(
                screen.getByRole('link', { name: 'Nueva autorización' }),
            ).toBeInTheDocument()
        })

        it('el enlace "Ver" apunta al detalle de la autorización', async () => {
            renderPage()
            await screen.findByText('1')

            const enlaceVer = screen.getAllByRole('link', { name: 'Ver' })
            expect(enlaceVer[0]).toHaveAttribute('href', '/autorizaciones/1')
        })

        it('muestra "No hay autorizaciones registradas" cuando está vacío', async () => {
            server.use(
                http.get('*/autorizacionestudios', () => HttpResponse.json([])),
                http.get('*/estudios', () => HttpResponse.json([])),
            )
            renderPage()

            expect(
                await screen.findByText('No hay autorizaciones registradas.'),
            ).toBeInTheDocument()
        })

        it('muestra el error en un alert cuando falla la carga', async () => {
            server.use(
                http.get(
                    '*/autorizacionestudios',
                    () =>
                        new HttpResponse(
                            JSON.stringify({ mensaje: 'Error al cargar' }),
                            { status: 500 },
                        ),
                ),
                http.get('*/estudios', () => HttpResponse.json([])),
            )
            renderPage()

            const alerta = await screen.findByRole('alert')
            expect(alerta).toHaveTextContent('Error al cargar')
        })

        it('filtra autorizaciones por criterio de búsqueda', async () => {
            const user = userEvent.setup()
            renderPage()
            await screen.findByText('1')

            const input = screen.getByPlaceholderText(
                'Buscar por ID, estudio, profesional o estado...',
            )
            await user.clear(input)
            await user.type(input, 'Carlos')

            expect(screen.getByText(/Carlos/)).toBeInTheDocument()
            expect(screen.getByText(/Ruiz/)).toBeInTheDocument()
            expect(screen.queryByText(/Ana/)).not.toBeInTheDocument()
            expect(screen.queryByText(/Lopez/)).not.toBeInTheDocument()
        })

        it('pagina los resultados cuando hay más de 10 autorizaciones', async () => {
            const muchas = Array.from({ length: 12 }, (_, i) => ({
                id: i + 1,
                estudioId: 1,
                profesionalId: 1,
                fechaAutorizacion: '2026-01-01',
                fechaVencimiento: '2026-07-01',
                estado: 'DISPONIBLE',
                profesional: {
                    id: 1,
                    nombre: 'Ana',
                    apellido: 'Lopez',
                    especialidad: 'Kinesiologia',
                },
            }))
            server.use(
                http.get('*/autorizacionestudios', () =>
                    HttpResponse.json(muchas),
                ),
                http.get('*/estudios', () =>
                    HttpResponse.json([
                        {
                            id: 1,
                            pacienteId: 10,
                            tipo: 'Hemograma completo',
                            fecha: '2026-02-10',
                            descripcion: 'Control',
                            archivoURL: null,
                        },
                    ]),
                ),
            )

            const user = userEvent.setup()
            renderPage()
            await screen.findByText('1')

            expect(
                screen.getByText(/Mostrando 1 - 10 de 12 resultados/),
            ).toBeInTheDocument()

            await user.click(screen.getByRole('button', { name: 'Siguiente' }))
            expect(await screen.findByText('11')).toBeInTheDocument()
        })

        it('revoca una autorización cuando se confirma', async () => {
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
            let revocada = false
            server.use(
                http.patch('*/autorizacionestudios/:id/revocar', () => {
                    revocada = true
                    return HttpResponse.json({
                        id: 1,
                        estado: 'VENCIDO',
                    })
                }),
            )

            const user = userEvent.setup()
            renderPage()
            await screen.findByText('1')

            await user.click(screen.getByRole('button', { name: 'Revocar' }))

            expect(confirmSpy).toHaveBeenCalled()
            expect(revocada).toBe(true)
        })

        it('no revoca si se cancela la confirmación', async () => {
            const confirmSpy = vi
                .spyOn(window, 'confirm')
                .mockReturnValue(false)
            let revocada = false
            server.use(
                http.patch('*/autorizacionestudios/:id/revocar', () => {
                    revocada = true
                    return HttpResponse.json({ id: 1, estado: 'VENCIDO' })
                }),
            )

            const user = userEvent.setup()
            renderPage()
            await screen.findByText('1')

            await user.click(screen.getByRole('button', { name: 'Revocar' }))

            expect(confirmSpy).toHaveBeenCalled()
            expect(revocada).toBe(false)
        })
    })

    describe('como PACIENTE', () => {
        beforeEach(() => {
            iniciarSesionComo('PACIENTE')
        })

        it('carga solo las autorizaciones de sus propios estudios', async () => {
            renderPage()
            await screen.findByText('1')

            // El paciente (id 10) tiene el estudio id 1, cuya autorización es la id 2 (VENCIDO)
            expect(screen.getByText('Hemograma completo')).toBeInTheDocument()
            expect(screen.getByText('VENCIDO')).toBeInTheDocument()
            // No ve la autorización del estudio id 2 (paciente id 11)
            expect(
                screen.queryByText('Radiografía de tórax'),
            ).not.toBeInTheDocument()
        })

        it('no muestra la columna Profesional', async () => {
            renderPage()
            await screen.findByText('1')

            expect(
                screen.queryByRole('columnheader', { name: 'Profesional' }),
            ).not.toBeInTheDocument()
        })
    })

    describe('como PROFESIONAL', () => {
        beforeEach(() => {
            iniciarSesionComo('PROFESIONAL')
        })

        it('carga el listado con la columna Profesional', async () => {
            renderPage()
            await screen.findByText('1')

            expect(
                screen.getByRole('columnheader', { name: 'Profesional' }),
            ).toBeInTheDocument()
            expect(screen.getByText(/Ana/)).toBeInTheDocument()
            expect(screen.getByText(/Lopez/)).toBeInTheDocument()
        })
    })
})
