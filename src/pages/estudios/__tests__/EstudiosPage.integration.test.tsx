import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { EstudiosPage } from '../EstudiosPage'
import { iniciarSesionComo } from '../../../test/sesion'
import { server } from '../../../test/mocks/server'

function renderPage() {
    return render(
        <MemoryRouter>
            <EstudiosPage />
        </MemoryRouter>,
    )
}

describe('EstudiosPage', () => {
    afterEach(() => {
        localStorage.clear()
    })

    describe('como ADMIN', () => {
        beforeEach(() => {
            iniciarSesionComo('ADMIN')
        })

        it('carga y muestra el listado de estudios con datos del paciente', async () => {
            renderPage()

            expect(screen.getByText('Cargando estudios...')).toBeInTheDocument()
            await screen.findByText('Hemograma completo')
            await screen.findByText('Radiografía de tórax')
            expect(screen.getByText('Pérez, Ana')).toBeInTheDocument()
            expect(screen.getByText('Gómez, Juan')).toBeInTheDocument()
        })

        it('muestra el enlace "Crear estudio"', async () => {
            renderPage()
            await screen.findByText('Hemograma completo')

            expect(
                screen.getByRole('link', { name: 'Crear estudio' }),
            ).toBeInTheDocument()
        })

        it('el primer enlace "Ver" apunta al detalle del estudio', async () => {
            renderPage()
            await screen.findByText('Hemograma completo')

            const enlacesVer = screen.getAllByRole('link', { name: 'Ver' })
            expect(enlacesVer[0]).toHaveAttribute('href', '/estudios/1')
        })

        it('muestra "No hay estudios registrados" cuando el listado está vacío', async () => {
            server.use(http.get('*/estudios', () => HttpResponse.json([])))
            renderPage()

            expect(
                await screen.findByText('No hay estudios registrados.'),
            ).toBeInTheDocument()
        })

        it('muestra el error en un alert cuando falla la carga', async () => {
            server.use(
                http.get(
                    '*/estudios',
                    () =>
                        new HttpResponse(
                            JSON.stringify({ mensaje: 'Error al cargar' }),
                            { status: 500 },
                        ),
                ),
            )
            renderPage()

            const alerta = await screen.findByRole('alert')
            expect(alerta).toHaveTextContent('Error al cargar')
        })

        it('filtra estudios por criterio de búsqueda', async () => {
            const user = userEvent.setup()
            renderPage()
            await screen.findByText('Hemograma completo')

            const input = screen.getByPlaceholderText(
                /Buscar por ID, paciente, tipo, fecha o descripción/,
            )
            await user.clear(input)
            await user.type(input, 'Radiografía')

            expect(screen.getByText('Radiografía de tórax')).toBeInTheDocument()
            expect(
                screen.queryByText('Hemograma completo'),
            ).not.toBeInTheDocument()
        })

        it('pagina los resultados cuando hay más de 10 estudios', async () => {
            const muchos = Array.from({ length: 12 }, (_, i) => ({
                id: i + 1,
                pacienteId: 10,
                tipo: `Estudio ${i + 1}`,
                fecha: '2026-02-10',
                descripcion: 'Descripción',
                archivoURL: null,
            }))
            server.use(
                http.get('*/estudios', () => HttpResponse.json(muchos)),
                http.get('*/pacientes', () => HttpResponse.json([])),
            )

            const user = userEvent.setup()
            renderPage()
            await screen.findByText('Estudio 1')

            expect(
                screen.getByText(/Mostrando 1 - 10 de 12 resultados/),
            ).toBeInTheDocument()

            await user.click(screen.getByRole('button', { name: 'Siguiente' }))
            expect(await screen.findByText('Estudio 11')).toBeInTheDocument()
        })
    })

    describe('como PACIENTE', () => {
        beforeEach(() => {
            iniciarSesionComo('PACIENTE')
        })

        it('carga los estudios de su propio perfil', async () => {
            renderPage()
            await screen.findByText('Hemograma completo')

            // Solo los estudios del paciente (id 10): el de id 1
            expect(
                screen.queryByText('Radiografía de tórax'),
            ).not.toBeInTheDocument()
            expect(screen.getByText('0')).toBeInTheDocument() // cantidad de autorizaciones

            // Los pacientes también pueden crear estudios
            expect(
                screen.getByRole('link', { name: 'Crear estudio' }),
            ).toBeInTheDocument()
        })
    })

    describe('como PROFESIONAL', () => {
        beforeEach(() => {
            iniciarSesionComo('PROFESIONAL')
        })

        it('carga el listado sin el enlace de crear estudio', async () => {
            renderPage()
            await screen.findByText('Hemograma completo')

            expect(
                screen.queryByRole('link', { name: 'Crear estudio' }),
            ).not.toBeInTheDocument()
        })
    })
})
