import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { server } from '../../../test/mocks/server'
import { CrearEspacioPage } from '../CrearEspacioPage'

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/espacios/nuevo']}>
            <Routes>
                <Route path="/espacios/nuevo" element={<CrearEspacioPage />} />
                <Route
                    path="/espacios/:id"
                    element={<p>Detalle espacio creado</p>}
                />
            </Routes>
        </MemoryRouter>,
    )
}

describe('CrearEspacioPage', () => {
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

    it('crea un espacio y navega al detalle', async () => {
        const user = userEvent.setup()
        renderPage()

        await user.type(screen.getByLabelText('Nombre'), 'Gimnasio Atras')
        await user.selectOptions(screen.getByLabelText('Tipo'), 'GIMNASIO')
        await user.selectOptions(screen.getByLabelText('Ubicación'), 'ATRAS')
        await user.click(screen.getByRole('button', { name: 'Crear espacio' }))

        expect(
            await screen.findByText('Detalle espacio creado'),
        ).toBeInTheDocument()
    })

    it('muestra error cuando la API falla', async () => {
        server.use(
            http.post('*/espacios', () =>
                HttpResponse.json(
                    { mensaje: 'Ya existe un registro con esos datos' },
                    { status: 409 },
                ),
            ),
        )

        const user = userEvent.setup()
        renderPage()

        await user.type(screen.getByLabelText('Nombre'), 'Gimnasio Atras')
        await user.click(screen.getByRole('button', { name: 'Crear espacio' }))

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Ya existe un registro con esos datos',
        )
    })
})
