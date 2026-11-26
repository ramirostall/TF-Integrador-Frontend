import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '../../../test/mocks/server'
import { DetalleEspacioPage } from '../DetalleEspacioPage'

function renderPage(id = 1) {
    return render(
        <MemoryRouter initialEntries={[`/espacios/${id}`]}>
            <Routes>
                <Route path="/espacios/:id" element={<DetalleEspacioPage />} />
                <Route path="/espacios" element={<p>Listado espacios</p>} />
            </Routes>
        </MemoryRouter>,
    )
}

describe('DetalleEspacioPage', () => {
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

    it('carga y muestra el detalle del espacio', async () => {
        renderPage()

        expect(await screen.findByText('Espacio #1')).toBeInTheDocument()
        expect(screen.getByText('Gimnasio Adelante')).toBeInTheDocument()
        expect(
            screen.getByText('Gimnasio', { selector: 'dd' }),
        ).toBeInTheDocument()
        expect(
            screen.getByText('Adelante', { selector: 'dd' }),
        ).toBeInTheDocument()
        expect(screen.getByText('Activo')).toBeInTheDocument()
    })

    it('desactiva y reactiva el espacio', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const user = userEvent.setup()
        renderPage()
        await screen.findByText('Espacio #1')

        await user.click(
            screen.getByRole('button', { name: 'Desactivar espacio' }),
        )
        expect(
            await screen.findByText('Espacio desactivado correctamente.'),
        ).toBeInTheDocument()

        await user.click(
            screen.getByRole('button', { name: 'Reactivar espacio' }),
        )
        expect(
            await screen.findByText('Espacio reactivado correctamente.'),
        ).toBeInTheDocument()
    })

    it('elimina el espacio y navega al listado', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const user = userEvent.setup()
        renderPage()
        await screen.findByText('Espacio #1')

        await user.click(
            screen.getByRole('button', { name: 'Eliminar espacio' }),
        )

        expect(await screen.findByText('Listado espacios')).toBeInTheDocument()
    })

    it('muestra error cuando el espacio no existe', async () => {
        server.use(
            http.get('*/espacios/:id', () =>
                HttpResponse.json(
                    { mensaje: 'Espacio no encontrado' },
                    { status: 404 },
                ),
            ),
        )
        renderPage(99)

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Espacio no encontrado',
        )
    })
})
