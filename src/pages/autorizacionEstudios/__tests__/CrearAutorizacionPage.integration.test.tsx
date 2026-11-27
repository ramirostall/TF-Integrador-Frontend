import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { CrearAutorizacionPage } from '../CrearAutorizacionPage'
import { iniciarSesionComo } from '../../../test/sesion'
import { server } from '../../../test/mocks/server'

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/autorizaciones/nuevo']}>
            <Routes>
                <Route
                    path="/autorizaciones/nuevo"
                    element={<CrearAutorizacionPage />}
                />
                <Route
                    path="/autorizaciones/:id"
                    element={<div>Detalle de la autorización</div>}
                />
                <Route
                    path="/autorizaciones"
                    element={<div>Listado autorizaciones</div>}
                />
            </Routes>
        </MemoryRouter>,
    )
}

async function completarFormulario(user: ReturnType<typeof userEvent.setup>) {
    const selectEstudio = screen.getByLabelText('Estudio')
    await user.selectOptions(selectEstudio, '2')

    const selectProfesional = screen.getByLabelText('Profesional')
    await user.selectOptions(selectProfesional, '1')

    await user.type(
        screen.getByLabelText('Fecha de Autorización'),
        '2026-03-06',
    )
    await user.type(screen.getByLabelText('Fecha de Vencimiento'), '2026-09-06')
}

describe('CrearAutorizacionPage', () => {
    beforeEach(() => {
        localStorage.clear()
        server.use(
            http.post('*/autorizacionestudios', async ({ request }) => {
                const body = (await request.json()) as Record<string, unknown>
                return HttpResponse.json(
                    {
                        id: 99,
                        estado: 'DISPONIBLE',
                        ...body,
                    },
                    { status: 201 },
                )
            }),
        )
    })

    describe('como ADMIN', () => {
        beforeEach(() => {
            iniciarSesionComo('ADMIN')
        })

        it('carga estudios y profesionales y crea la autorización', async () => {
            const user = userEvent.setup()
            renderPage()

            await screen.findByText(/Nueva Autorización de Estudio/)

            await completarFormulario(user)

            await user.click(
                screen.getByRole('button', { name: 'Crear autorización' }),
            )

            expect(
                await screen.findByText('Detalle de la autorización'),
            ).toBeInTheDocument()
        })

        it('no envía si faltan campos obligatorios', async () => {
            renderPage()
            await screen.findByText(/Nueva Autorización de Estudio/)

            // fireEvent.submit bypassa la validación nativa de HTML5 (required)
            // y alcanza el handler de React que verifica los campos
            fireEvent.submit(document.querySelector('form')!)

            expect(
                screen.getByText('Todos los campos son obligatorios.'),
            ).toBeInTheDocument()
            expect(
                screen.queryByText('Detalle de la autorización'),
            ).not.toBeInTheDocument()
        })

        it('no envía si la fecha de vencimiento es anterior a la de autorización', async () => {
            const user = userEvent.setup()
            renderPage()
            await screen.findByText(/Nueva Autorización de Estudio/)

            await completarFormulario(user)

            const inputVencimiento = screen.getByLabelText(
                'Fecha de Vencimiento',
            )
            fireEvent.change(inputVencimiento, {
                target: { value: '2026-01-01' },
            })

            fireEvent.submit(document.querySelector('form')!)

            expect(
                screen.getByText(
                    'La fecha de vencimiento no puede ser anterior a la de autorización.',
                ),
            ).toBeInTheDocument()
            expect(
                screen.queryByText('Detalle de la autorización'),
            ).not.toBeInTheDocument()
        })

        it('muestra el error del servidor cuando falla la creación', async () => {
            server.use(
                http.post(
                    '*/autorizacionestudios',
                    () =>
                        new HttpResponse(
                            JSON.stringify({ mensaje: 'Error al guardar' }),
                            { status: 500 },
                        ),
                ),
            )

            const user = userEvent.setup()
            renderPage()
            await screen.findByText(/Nueva Autorización de Estudio/)

            await completarFormulario(user)
            await user.click(
                screen.getByRole('button', { name: 'Crear autorización' }),
            )

            const alerta = await screen.findByRole('alert')
            expect(alerta).toHaveTextContent('Error al guardar')
        })
    })

    describe('sin sesión iniciada', () => {
        beforeEach(() => {
            localStorage.clear()
        })

        it('muestra que no tiene permisos para crear autorizaciones', async () => {
            renderPage()

            await screen.findByText(/Nueva Autorización de Estudio/)
            expect(
                screen.getByText(
                    'No tienes permisos para crear autorizaciones.',
                ),
            ).toBeInTheDocument()
            expect(
                screen.getByRole('button', { name: 'Crear autorización' }),
            ).toBeDisabled()
        })
    })
})
