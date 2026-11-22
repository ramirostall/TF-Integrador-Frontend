import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '../../../test/mocks/server'
import { DetalleAgendaPage } from '../DetalleAgendaPage'

function renderPage(id = 1) {
    return render(
        <MemoryRouter initialEntries={[`/agendas/${id}`]}>
            <Routes>
                <Route path="/agendas/:id" element={<DetalleAgendaPage />} />
            </Routes>
        </MemoryRouter>,
    )
}

describe('DetalleAgendaPage', () => {
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

    it('carga y muestra el detalle de la agenda', async () => {
        renderPage()

        expect(await screen.findByText('Agenda #1')).toBeInTheDocument()
        expect(screen.getByText(/Kinesiologia/)).toBeInTheDocument()
        expect(screen.getByText('09:00 - 13:00')).toBeInTheDocument()
        expect(screen.getByText('Activa')).toBeInTheDocument()
    })

    it('desactiva y reactiva la agenda', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const user = userEvent.setup()
        renderPage()
        await screen.findByText('Agenda #1')

        await user.click(
            screen.getByRole('button', { name: 'Desactivar agenda' }),
        )
        expect(
            await screen.findByText('Agenda desactivada correctamente.'),
        ).toBeInTheDocument()
        expect(screen.getByText('Inactiva')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Activar agenda' }))
        expect(
            await screen.findByText('Agenda activada correctamente.'),
        ).toBeInTheDocument()
        expect(screen.getByText('Activa')).toBeInTheDocument()
    })

    it('no muestra acciones para un rol no ADMIN', async () => {
        localStorage.setItem(
            'usuario',
            JSON.stringify({
                id: 3,
                email: 'paciente@test.com',
                rol: 'PACIENTE',
                activo: true,
            }),
        )
        renderPage()
        await screen.findByText('Agenda #1')

        expect(
            screen.queryByRole('button', { name: 'Desactivar agenda' }),
        ).not.toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Guardar cambios' }),
        ).not.toBeInTheDocument()
    })

    it('muestra el error cuando la agenda no existe', async () => {
        server.use(
            http.get('*/agendas/:id', () =>
                HttpResponse.json(
                    { mensaje: 'Agenda no encontrada' },
                    { status: 404 },
                ),
            ),
        )
        renderPage(99)

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Agenda no encontrada',
        )
    })
})
