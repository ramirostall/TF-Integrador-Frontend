import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '../../../test/mocks/server'
import { DetalleAsignacionEspacioPage } from '../DetalleAsignacionEspacioPage'

function renderPage(id = 1) {
    return render(
        <MemoryRouter initialEntries={[`/asignaciones-espacio/${id}`]}>
            <Routes>
                <Route
                    path="/asignaciones-espacio/:id"
                    element={<DetalleAsignacionEspacioPage />}
                />
                <Route
                    path="/asignaciones-espacio"
                    element={<p>Listado asignaciones</p>}
                />
            </Routes>
        </MemoryRouter>,
    )
}

describe('DetalleAsignacionEspacioPage', () => {
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

    it('carga y muestra el detalle', async () => {
        renderPage()

        expect(await screen.findByText('Asignación #1')).toBeInTheDocument()
        expect(
            screen.getByText('Lopez, Ana', { selector: 'dd' }),
        ).toBeInTheDocument()
        expect(
            screen.getByText('Gimnasio Adelante', { selector: 'dd' }),
        ).toBeInTheDocument()
    })

    it('elimina y navega al listado', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const user = userEvent.setup()
        renderPage()
        await screen.findByText('Asignación #1')

        await user.click(
            screen.getByRole('button', { name: 'Eliminar asignación' }),
        )

        expect(
            await screen.findByText('Listado asignaciones'),
        ).toBeInTheDocument()
    })

    it('muestra error cuando no existe', async () => {
        server.use(
            http.get('*/asignaciones-espacio/:id', () =>
                HttpResponse.json(
                    { mensaje: 'Asignación no encontrada' },
                    { status: 404 },
                ),
            ),
        )
        renderPage(99)

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Asignación no encontrada',
        )
    })
})
