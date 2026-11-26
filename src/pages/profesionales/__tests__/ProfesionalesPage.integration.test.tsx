import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { profesionalesResumenFixture } from '../../../test/mocks/fixtures'
import { server } from '../../../test/mocks/server'
import { iniciarSesionComo } from '../../../test/sesion'
import { ProfesionalesPage } from '../ProfesionalesPage'

function renderPage() {
    return render(
        <MemoryRouter>
            <ProfesionalesPage />
        </MemoryRouter>,
    )
}

describe('ProfesionalesPage', () => {
    it('muestra tarjetas con nombre, apellido y especialidad', async () => {
        iniciarSesionComo('ADMIN')
        renderPage()

        expect(
            screen.getByText('Cargando profesionales...'),
        ).toBeInTheDocument()
        expect(
            await screen.findByRole('heading', { name: 'Ana Lopez' }),
        ).toBeInTheDocument()
        expect(screen.getByText('Kinesiologia')).toBeInTheDocument()
        expect(
            screen.getByRole('heading', { name: 'Carlos Ruiz' }),
        ).toBeInTheDocument()
        expect(
            screen.getAllByRole('link', { name: 'Ver detalle' }),
        ).toHaveLength(2)
        // Ya no se muestran datos sensibles en el listado.
        expect(screen.queryByText('30111222')).not.toBeInTheDocument()
    })

    it('el ADMIN ve el link para crear profesional', async () => {
        iniciarSesionComo('ADMIN')
        renderPage()
        await screen.findByRole('heading', { name: 'Ana Lopez' })

        expect(
            screen.getByRole('link', { name: 'Crear profesional' }),
        ).toHaveAttribute('href', '/profesionales/nuevo')
    })

    it.each(['PACIENTE', 'PROFESIONAL'] as const)(
        'el %s ve el listado reducido sin link de crear',
        async (rol) => {
            iniciarSesionComo(rol)
            server.use(
                http.get('*/profesionales', () =>
                    HttpResponse.json(profesionalesResumenFixture),
                ),
            )
            renderPage()

            expect(
                await screen.findByRole('heading', { name: 'Ana Lopez' }),
            ).toBeInTheDocument()
            expect(
                screen.queryByRole('link', { name: 'Crear profesional' }),
            ).not.toBeInTheDocument()
        },
    )

    it('filtra por especialidad', async () => {
        const user = userEvent.setup()
        iniciarSesionComo('PACIENTE')
        renderPage()
        await screen.findByRole('heading', { name: 'Ana Lopez' })

        await user.type(screen.getByLabelText('Buscar profesionales'), 'cardio')

        expect(
            screen.getByRole('heading', { name: 'Carlos Ruiz' }),
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('heading', { name: 'Ana Lopez' }),
        ).not.toBeInTheDocument()
    })

    it('muestra el error del back', async () => {
        iniciarSesionComo('ADMIN')
        server.use(
            http.get('*/profesionales', () =>
                HttpResponse.json(
                    { mensaje: 'Error interno' },
                    { status: 500 },
                ),
            ),
        )
        renderPage()

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Error interno',
        )
    })
})
