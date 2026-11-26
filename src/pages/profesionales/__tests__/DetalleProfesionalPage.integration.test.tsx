import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import {
    profesionalesFixture,
    profesionalesResumenFixture,
} from '../../../test/mocks/fixtures'
import { server } from '../../../test/mocks/server'
import { iniciarSesionComo } from '../../../test/sesion'
import { DetalleProfesionalPage } from '../DetalleProfesionalPage'

function renderPage(id = '1') {
    return render(
        <MemoryRouter initialEntries={[`/profesionales/${id}`]}>
            <Routes>
                <Route
                    path="/profesionales/:id"
                    element={<DetalleProfesionalPage />}
                />
            </Routes>
        </MemoryRouter>,
    )
}

describe('DetalleProfesionalPage', () => {
    it('el ADMIN ve todos los datos y puede editar', async () => {
        const user = userEvent.setup()
        let body: Record<string, unknown> = {}
        server.use(
            http.put('*/profesionales/:id', async ({ request }) => {
                body = (await request.json()) as Record<string, unknown>
                return HttpResponse.json({
                    ...profesionalesFixture[0],
                    ...body,
                })
            }),
        )
        iniciarSesionComo('ADMIN')
        renderPage()

        expect(await screen.findByText('MP-1234')).toBeInTheDocument()
        expect(screen.getByText('30111222')).toBeInTheDocument()
        expect(screen.getByText('ana.lopez@test.com')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Editar' }))
        const telefono = screen.getByLabelText('Teléfono')
        await user.clear(telefono)
        await user.type(telefono, '1199998888')
        await user.click(
            screen.getByRole('button', { name: 'Guardar cambios' }),
        )

        expect(
            await screen.findByText('Profesional actualizado correctamente.'),
        ).toBeInTheDocument()
        expect(body).toMatchObject({ telefono: '1199998888', nombre: 'Ana' })
        expect(body).not.toHaveProperty('usuarioId')
        expect(screen.getByText('1199998888')).toBeInTheDocument()
    })

    it('el PROFESIONAL dueño del perfil puede editar', async () => {
        iniciarSesionComo('PROFESIONAL', 20)
        renderPage()

        await screen.findByText('MP-1234')
        expect(
            screen.getByRole('button', { name: 'Editar' }),
        ).toBeInTheDocument()
    })

    it('el PROFESIONAL no puede editar un perfil ajeno', async () => {
        server.use(
            http.get('*/profesionales/:id', () =>
                HttpResponse.json(profesionalesResumenFixture[0]),
            ),
        )
        iniciarSesionComo('PROFESIONAL', 21)
        renderPage()

        expect(await screen.findByText('Kinesiologia')).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Editar' }),
        ).not.toBeInTheDocument()
    })

    it('el PACIENTE ve solo los datos públicos', async () => {
        server.use(
            http.get('*/profesionales/:id', () =>
                HttpResponse.json(profesionalesResumenFixture[0]),
            ),
        )
        iniciarSesionComo('PACIENTE', 3)
        renderPage()

        expect(await screen.findByText('Kinesiologia')).toBeInTheDocument()
        expect(screen.queryByText('Matrícula')).not.toBeInTheDocument()
        expect(screen.queryByText('DNI')).not.toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Editar' }),
        ).not.toBeInTheDocument()
    })

    it('muestra el error del back al guardar', async () => {
        const user = userEvent.setup()
        server.use(
            http.put('*/profesionales/:id', () =>
                HttpResponse.json(
                    { mensaje: 'La matrícula ya está registrada' },
                    { status: 409 },
                ),
            ),
        )
        iniciarSesionComo('ADMIN')
        renderPage()

        await user.click(await screen.findByRole('button', { name: 'Editar' }))
        await user.click(
            screen.getByRole('button', { name: 'Guardar cambios' }),
        )

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'La matrícula ya está registrada',
        )
    })

    it('muestra 404', async () => {
        iniciarSesionComo('ADMIN')
        renderPage('99')

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Profesional no encontrado',
        )
    })
})
