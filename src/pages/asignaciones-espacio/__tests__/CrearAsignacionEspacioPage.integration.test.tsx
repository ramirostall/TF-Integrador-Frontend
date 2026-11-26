import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { server } from '../../../test/mocks/server'
import { CrearAsignacionEspacioPage } from '../CrearAsignacionEspacioPage'

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/asignaciones-espacio/nuevo']}>
            <Routes>
                <Route
                    path="/asignaciones-espacio/nuevo"
                    element={<CrearAsignacionEspacioPage />}
                />
                <Route
                    path="/asignaciones-espacio/:id"
                    element={<p>Detalle asignacion creada</p>}
                />
            </Routes>
        </MemoryRouter>,
    )
}

describe('CrearAsignacionEspacioPage', () => {
    beforeEach(() => {
        localStorage.setItem(
            'usuario',
            JSON.stringify({
                id: 1,
                email: 'admin@test.com',
                rol: 'ADMIN',
                activo: true,
            }),
        )
    })

    it('crea una asignacion fija y navega al detalle', async () => {
        const user = userEvent.setup()
        renderPage()

        await screen.findByLabelText('Profesional')
        await user.selectOptions(screen.getByLabelText('Profesional'), '1')
        await user.selectOptions(screen.getByLabelText('Espacio'), '1')
        await user.selectOptions(screen.getByLabelText('Tipo'), 'FIJA')
        await user.selectOptions(
            screen.getByLabelText('Día de la semana'),
            'LUNES',
        )
        await user.type(screen.getByLabelText('Hora de inicio'), '09:00')
        await user.type(screen.getByLabelText('Hora de fin'), '12:00')
        await user.click(
            screen.getByRole('button', { name: 'Crear asignación' }),
        )

        expect(
            await screen.findByText('Detalle asignacion creada'),
        ).toBeInTheDocument()
    })

    it('muestra error cuando la API falla', async () => {
        server.use(
            http.post('*/asignaciones-espacio', () =>
                HttpResponse.json(
                    { mensaje: 'La asignación se superpone' },
                    { status: 409 },
                ),
            ),
        )

        const user = userEvent.setup()
        renderPage()
        await screen.findByLabelText('Profesional')
        await user.selectOptions(screen.getByLabelText('Profesional'), '1')
        await user.selectOptions(screen.getByLabelText('Espacio'), '1')
        await user.selectOptions(
            screen.getByLabelText('Día de la semana'),
            'LUNES',
        )
        await user.type(screen.getByLabelText('Hora de inicio'), '09:00')
        await user.type(screen.getByLabelText('Hora de fin'), '12:00')
        await user.click(
            screen.getByRole('button', { name: 'Crear asignación' }),
        )

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'La asignación se superpone',
        )
    })
})
