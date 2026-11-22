import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { agendasFixture } from '../../../test/mocks/fixtures'
import { server } from '../../../test/mocks/server'
import { AgendasPage } from '../AgendasPage'

function renderPage() {
    return render(
        <MemoryRouter>
            <AgendasPage />
        </MemoryRouter>,
    )
}

describe('AgendasPage', () => {
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

    it('carga y muestra el listado de agendas', async () => {
        renderPage()

        expect(screen.getByText('Cargando agendas...')).toBeInTheDocument()
        expect(await screen.findByText('LUNES')).toBeInTheDocument()
        expect(screen.getByText('MIERCOLES')).toBeInTheDocument()
        expect(screen.getAllByText('Ana Lopez')).toHaveLength(2)
    })

    it('filtra agendas por día y por matrícula', async () => {
        const user = userEvent.setup()
        renderPage()
        await screen.findByText('LUNES')

        const input = screen.getByPlaceholderText(/Buscar por ID/)
        await user.type(input, 'MIERCOLES')
        expect(screen.getByText('MIERCOLES')).toBeInTheDocument()
        expect(screen.queryByText('LUNES')).not.toBeInTheDocument()

        await user.clear(input)
        await user.type(input, 'MP-1234')
        expect(screen.getByText('LUNES')).toBeInTheDocument()
        expect(screen.getByText('MIERCOLES')).toBeInTheDocument()
    })

    it('pagina cuando hay más de 10 agendas', async () => {
        const muchas = Array.from({ length: 12 }, (_, i) => ({
            ...agendasFixture[0],
            id: i + 1,
        }))
        server.use(http.get('*/agendas', () => HttpResponse.json(muchas)))

        const user = userEvent.setup()
        renderPage()
        expect(await screen.findByText('Página 1 de 2')).toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Siguiente' }))
        expect(await screen.findByText('Página 2 de 2')).toBeInTheDocument()
    })

    it('desactiva una agenda y actualiza la fila', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const user = userEvent.setup()
        renderPage()
        await screen.findByText('LUNES')

        const fila = screen.getByText('LUNES').closest('tr')!
        await user.click(
            within(fila).getByRole('button', { name: 'Desactivar' }),
        )

        expect(await within(fila).findByText('Inactiva')).toBeInTheDocument()
        expect(
            within(fila).queryByRole('button', { name: 'Desactivar' }),
        ).not.toBeInTheDocument()
    })

    it('muestra error cuando falla la carga', async () => {
        server.use(
            http.get('*/agendas', () =>
                HttpResponse.json({ mensaje: 'Fallo' }, { status: 500 }),
            ),
        )
        renderPage()

        expect(await screen.findByRole('alert')).toHaveTextContent('Fallo')
    })

    it('muestra estado vacío cuando no hay agendas', async () => {
        server.use(http.get('*/agendas', () => HttpResponse.json([])))
        renderPage()

        expect(
            await screen.findByText('No hay agendas registradas.'),
        ).toBeInTheDocument()
    })
})
