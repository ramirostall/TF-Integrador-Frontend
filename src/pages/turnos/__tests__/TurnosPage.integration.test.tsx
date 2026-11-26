import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { turnosFixture } from '../../../test/mocks/fixtures'
import { server } from '../../../test/mocks/server'
import { iniciarSesionComo } from '../../../test/sesion'
import { TurnosPage } from '../TurnosPage'

function renderPage() {
    return render(
        <MemoryRouter>
            <TurnosPage />
        </MemoryRouter>,
    )
}

function fila(texto: string) {
    const celda = screen.getByText(texto)
    const tr = celda.closest('tr')
    if (!tr) throw new Error(`No hay fila para ${texto}`)
    return within(tr)
}

describe('TurnosPage', () => {
    it('el PACIENTE ve sus turnos, puede pedir y cancelar', async () => {
        iniciarSesionComo('PACIENTE', 3)
        renderPage()

        expect(screen.getByText('Cargando turnos...')).toBeInTheDocument()
        expect(await screen.findByText('Dolor de espalda')).toBeInTheDocument()
        expect(screen.getByText('09:00')).toBeInTheDocument()
        expect(
            screen.getByText('Lopez, Ana (Kinesiologia)'),
        ).toBeInTheDocument()

        // No ve la columna de paciente ni los filtros del ADMIN.
        expect(
            screen.queryByRole('columnheader', { name: 'Paciente' }),
        ).not.toBeInTheDocument()
        expect(
            screen.queryByLabelText('Profesional', { selector: 'select' }),
        ).not.toBeInTheDocument()

        expect(
            screen.getByRole('link', { name: 'Pedir turno' }),
        ).toHaveAttribute('href', '/turnos/nuevo')
        // Pendiente se puede cancelar; completado no.
        expect(
            fila('Dolor de espalda').getByRole('button', { name: 'Cancelar' }),
        ).toBeInTheDocument()
        expect(
            fila('Control anual').queryByRole('button', { name: 'Cancelar' }),
        ).not.toBeInTheDocument()
    })

    it('cancela un turno con DELETE y actualiza el estado', async () => {
        const user = userEvent.setup()
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        let idCancelado: string | undefined
        server.use(
            http.delete('*/turnos/:id', ({ params }) => {
                idCancelado = String(params.id)
                return HttpResponse.json({
                    ...turnosFixture[0],
                    estado: 'CANCELADO',
                })
            }),
        )
        iniciarSesionComo('PACIENTE', 3)
        renderPage()

        await screen.findByText('Dolor de espalda')
        await user.click(
            fila('Dolor de espalda').getByRole('button', { name: 'Cancelar' }),
        )

        expect(
            await screen.findByText('Turno cancelado correctamente.'),
        ).toBeInTheDocument()
        expect(idCancelado).toBe('1')
        expect(
            fila('Dolor de espalda').getByText('CANCELADO'),
        ).toBeInTheDocument()
        expect(
            fila('Dolor de espalda').queryByRole('button', {
                name: 'Cancelar',
            }),
        ).not.toBeInTheDocument()
    })

    it('no cancela si no se confirma', async () => {
        const user = userEvent.setup()
        vi.spyOn(window, 'confirm').mockReturnValue(false)
        iniciarSesionComo('PACIENTE', 3)
        renderPage()

        await screen.findByText('Dolor de espalda')
        await user.click(
            fila('Dolor de espalda').getByRole('button', { name: 'Cancelar' }),
        )

        expect(
            fila('Dolor de espalda').getByText('PENDIENTE'),
        ).toBeInTheDocument()
    })

    it('muestra el error del back al cancelar', async () => {
        const user = userEvent.setup()
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        server.use(
            http.delete('*/turnos/:id', () =>
                HttpResponse.json(
                    { mensaje: 'El turno ya está cancelado' },
                    { status: 409 },
                ),
            ),
        )
        iniciarSesionComo('PACIENTE', 3)
        renderPage()

        await screen.findByText('Dolor de espalda')
        await user.click(
            fila('Dolor de espalda').getByRole('button', { name: 'Cancelar' }),
        )

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'El turno ya está cancelado',
        )
    })

    it('el PROFESIONAL solo mira: sin pedir ni cancelar', async () => {
        iniciarSesionComo('PROFESIONAL', 20)
        renderPage()

        await screen.findByText('Dolor de espalda')
        expect(screen.getByText('Pérez, Ana')).toBeInTheDocument()
        expect(
            screen.queryByRole('link', { name: 'Pedir turno' }),
        ).not.toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Cancelar' }),
        ).not.toBeInTheDocument()
    })

    it('el ADMIN filtra por estado y profesional', async () => {
        const user = userEvent.setup()
        const pedidos: string[] = []
        server.events.on('request:start', ({ request }) => {
            const url = new URL(request.url)
            if (url.pathname.endsWith('/turnos')) pedidos.push(url.search)
        })
        iniciarSesionComo('ADMIN')
        renderPage()

        await screen.findByText('Dolor de espalda')
        expect(screen.getByText('Control anual')).toBeInTheDocument()

        await user.selectOptions(screen.getByLabelText('Estado'), 'COMPLETADO')
        expect(await screen.findByText('Control anual')).toBeInTheDocument()
        expect(screen.queryByText('Dolor de espalda')).not.toBeInTheDocument()

        // Un filtro sin resultados no esconde los filtros.
        await user.selectOptions(
            await screen.findByRole('combobox', { name: 'Profesional' }),
            '1',
        )
        expect(
            await screen.findByText('No hay turnos con esos filtros.'),
        ).toBeInTheDocument()
        expect(screen.getByLabelText('Estado')).toBeInTheDocument()

        expect(pedidos).toContain('?estado=COMPLETADO')
        expect(pedidos).toContain('?estado=COMPLETADO&profesionalId=1')
        server.events.removeAllListeners()
    })
})
