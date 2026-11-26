import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { profesionalesResumenFixture } from '../../../test/mocks/fixtures'
import { server } from '../../../test/mocks/server'
import { iniciarSesionComo } from '../../../test/sesion'
import { CrearTurnoPage } from '../CrearTurnoPage'

function renderPage() {
    return render(
        <MemoryRouter>
            <CrearTurnoPage />
        </MemoryRouter>,
    )
}

function capturarPost() {
    const captura: { body: Record<string, unknown> } = { body: {} }
    server.use(
        http.post('*/turnos', async ({ request }) => {
            captura.body = (await request.json()) as Record<string, unknown>
            return HttpResponse.json(
                { id: 3, ...captura.body },
                { status: 201 },
            )
        }),
    )
    return captura
}

async function elegirProfesionalYFecha(
    user: ReturnType<typeof userEvent.setup>,
) {
    await user.selectOptions(await screen.findByLabelText('Profesional'), '1')
    await user.type(screen.getByLabelText('Fecha'), '2030-01-07')
}

describe('CrearTurnoPage', () => {
    it('el PACIENTE reserva eligiendo un horario libre (sin pacienteId)', async () => {
        const user = userEvent.setup()
        let consultaHorarios = ''
        server.use(
            http.get('*/profesionales', () =>
                HttpResponse.json(profesionalesResumenFixture),
            ),
            http.get('*/turnos/horarios-libres', ({ request }) => {
                consultaHorarios = new URL(request.url).search
                return HttpResponse.json([
                    { agendaId: 1, hora: '09:30' },
                    { agendaId: 1, hora: '10:00' },
                ])
            }),
        )
        const captura = capturarPost()
        iniciarSesionComo('PACIENTE', 3)
        renderPage()

        expect(screen.queryByLabelText('Paciente')).not.toBeInTheDocument()
        await elegirProfesionalYFecha(user)

        await user.selectOptions(
            await screen.findByLabelText('Horario'),
            '1|10:00',
        )
        await user.type(screen.getByLabelText('Motivo'), 'Dolor de rodilla')
        await user.type(
            screen.getByLabelText('Observaciones (opcional)'),
            'Traigo placas',
        )
        await user.click(screen.getByRole('button', { name: 'Reservar turno' }))

        expect(
            await screen.findByText('Turno reservado correctamente.'),
        ).toBeInTheDocument()
        expect(consultaHorarios).toBe('?profesionalId=1&fecha=2030-01-07')
        expect(captura.body).toEqual({
            profesionalId: 1,
            agendaId: 1,
            fecha: '2030-01-07',
            hora: '10:00',
            motivo: 'Dolor de rodilla',
            observaciones: 'Traigo placas',
        })
    })

    it('el ADMIN elige además el paciente', async () => {
        const user = userEvent.setup()
        const captura = capturarPost()
        iniciarSesionComo('ADMIN')
        renderPage()

        await user.selectOptions(await screen.findByLabelText('Paciente'), '11')
        await elegirProfesionalYFecha(user)
        await user.selectOptions(
            await screen.findByLabelText('Horario'),
            '1|09:30',
        )
        await user.type(screen.getByLabelText('Motivo'), 'Control')
        await user.click(screen.getByRole('button', { name: 'Reservar turno' }))

        await screen.findByText('Turno reservado correctamente.')
        expect(captura.body).toEqual({
            pacienteId: 11,
            profesionalId: 1,
            agendaId: 1,
            fecha: '2030-01-07',
            hora: '09:30',
            motivo: 'Control',
        })
    })

    it('avisa cuando ese día no hay horarios libres', async () => {
        const user = userEvent.setup()
        server.use(
            http.get('*/turnos/horarios-libres', () => HttpResponse.json([])),
        )
        iniciarSesionComo('PACIENTE', 3)
        renderPage()

        await elegirProfesionalYFecha(user)

        expect(
            await screen.findByText(/No hay horarios libres para ese día/),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Reservar turno' }),
        ).toBeDisabled()
    })

    it('al cambiar de profesional se descarta el horario elegido', async () => {
        const user = userEvent.setup()
        iniciarSesionComo('PACIENTE', 3)
        renderPage()

        await elegirProfesionalYFecha(user)
        await user.selectOptions(
            await screen.findByLabelText('Horario'),
            '1|09:30',
        )
        await user.selectOptions(screen.getByLabelText('Profesional'), '2')

        expect(await screen.findByLabelText('Horario')).toHaveValue('')
        expect(
            screen.getByRole('button', { name: 'Reservar turno' }),
        ).toBeDisabled()
    })

    it('muestra el error del back (horario ocupado)', async () => {
        const user = userEvent.setup()
        server.use(
            http.post('*/turnos', () =>
                HttpResponse.json(
                    { mensaje: 'El horario ya está ocupado' },
                    { status: 409 },
                ),
            ),
        )
        iniciarSesionComo('PACIENTE', 3)
        renderPage()

        await elegirProfesionalYFecha(user)
        await user.selectOptions(
            await screen.findByLabelText('Horario'),
            '1|09:30',
        )
        await user.type(screen.getByLabelText('Motivo'), 'Control')
        await user.click(screen.getByRole('button', { name: 'Reservar turno' }))

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'El horario ya está ocupado',
        )
    })
})
