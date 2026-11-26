import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '../../../test/mocks/server'
import { AsignacionesEspacioPage } from '../AsignacionesEspacioPage'

function renderPage() {
    return render(
        <MemoryRouter>
            <AsignacionesEspacioPage />
        </MemoryRouter>,
    )
}

describe('AsignacionesEspacioPage', () => {
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

    it('carga y muestra asignaciones agrupadas por espacio', async () => {
        renderPage()

        expect(screen.getByText('Cargando asignaciones...')).toBeInTheDocument()
        expect(
            await screen.findByRole('heading', { name: 'Gimnasio Adelante' }),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('heading', { name: 'Consultorio Atras' }),
        ).toBeInTheDocument()
        expect(screen.getByText('Lopez, Ana')).toBeInTheDocument()
    })

    it('filtra asignaciones por busqueda', async () => {
        const user = userEvent.setup()
        renderPage()
        await screen.findByRole('heading', { name: 'Gimnasio Adelante' })

        const input = screen.getByPlaceholderText(/Buscar por profesional/)
        await user.type(input, 'Carlos')

        expect(
            screen.getByRole('heading', { name: 'Consultorio Atras' }),
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('heading', { name: 'Gimnasio Adelante' }),
        ).not.toBeInTheDocument()
    })

    it('elimina una asignacion y la quita del listado', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const user = userEvent.setup()
        renderPage()
        await screen.findByText('Lopez, Ana')

        const fila = screen.getByText('Lopez, Ana').closest('tr')!
        await user.click(within(fila).getByRole('button', { name: 'Eliminar' }))

        expect(screen.queryByText('Lopez, Ana')).not.toBeInTheDocument()
    })

    it('muestra error cuando falla la carga', async () => {
        server.use(
            http.get('*/asignaciones-espacio', () =>
                HttpResponse.json({ mensaje: 'Fallo' }, { status: 500 }),
            ),
        )
        renderPage()

        expect(await screen.findByRole('alert')).toHaveTextContent('Fallo')
    })
})
