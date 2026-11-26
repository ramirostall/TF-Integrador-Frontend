import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '../../../test/mocks/server'
import { EspaciosPage } from '../EspaciosPage'

function renderPage() {
    return render(
        <MemoryRouter>
            <EspaciosPage />
        </MemoryRouter>,
    )
}

describe('EspaciosPage', () => {
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

    it('carga y muestra el listado de espacios', async () => {
        renderPage()

        expect(screen.getByText('Cargando espacios...')).toBeInTheDocument()
        expect(await screen.findByText('Gimnasio Adelante')).toBeInTheDocument()
        expect(screen.getByText('Consultorio Atras')).toBeInTheDocument()
    })

    it('filtra espacios por busqueda', async () => {
        const user = userEvent.setup()
        renderPage()
        await screen.findByText('Gimnasio Adelante')

        const input = screen.getByPlaceholderText(/Buscar por ID/)
        await user.type(input, 'Consultorio')

        expect(screen.getByText('Consultorio Atras')).toBeInTheDocument()
        expect(screen.queryByText('Gimnasio Adelante')).not.toBeInTheDocument()
    })

    it('desactiva un espacio y actualiza la fila', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const user = userEvent.setup()
        renderPage()
        await screen.findByText('Gimnasio Adelante')

        const fila = screen.getByText('Gimnasio Adelante').closest('tr')!
        await user.click(
            within(fila).getByRole('button', { name: 'Desactivar' }),
        )

        expect(await within(fila).findByText('Inactivo')).toBeInTheDocument()
    })

    it('muestra error cuando falla la carga', async () => {
        server.use(
            http.get('*/espacios', () =>
                HttpResponse.json({ mensaje: 'Fallo' }, { status: 500 }),
            ),
        )
        renderPage()

        expect(await screen.findByRole('alert')).toHaveTextContent('Fallo')
    })

    it('muestra estado vacio cuando no hay espacios', async () => {
        server.use(http.get('*/espacios', () => HttpResponse.json([])))
        renderPage()

        expect(
            await screen.findByText('No hay espacios registrados.'),
        ).toBeInTheDocument()
    })
})
