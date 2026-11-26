import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { turnosFixture } from '../../../test/mocks/fixtures'
import { server } from '../../../test/mocks/server'
import { iniciarSesionComo } from '../../../test/sesion'
import { DetalleTurnoPage } from '../DetalleTurnoPage'

function renderPage(id = '1') {
    return render(
        <MemoryRouter initialEntries={[`/turnos/${id}`]}>
            <Routes>
                <Route path="/turnos/:id" element={<DetalleTurnoPage />} />
            </Routes>
        </MemoryRouter>,
    )
}

function capturarPut() {
    const captura: { body: Record<string, unknown> } = { body: {} }
    server.use(
        http.put('*/turnos/:id', async ({ request }) => {
            captura.body = (await request.json()) as Record<string, unknown>
            return HttpResponse.json({ ...turnosFixture[0], ...captura.body })
        }),
    )
    return captura
}

describe('DetalleTurnoPage', () => {
    it('muestra los datos con nombres, motivo y observaciones', async () => {
        iniciarSesionComo('ADMIN')
        renderPage()

        expect(await screen.findByText('Dolor de espalda')).toBeInTheDocument()
        expect(screen.getByText('Traer resonancia')).toBeInTheDocument()
        expect(screen.getByText('09:00')).toBeInTheDocument()
        expect(
            screen.getByText('Lopez, Ana (Kinesiologia)'),
        ).toBeInTheDocument()
        expect(screen.getByText('Pérez, Ana')).toBeInTheDocument()
    })

    it('el PACIENTE puede cancelar pero no editar', async () => {
        const user = userEvent.setup()
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        iniciarSesionComo('PACIENTE', 3)
        renderPage()

        await screen.findByText('Dolor de espalda')
        expect(screen.queryByText('Paciente')).not.toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Editar' }),
        ).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Cancelar turno' }))

        expect(
            await screen.findByText('Turno cancelado correctamente.'),
        ).toBeInTheDocument()
        expect(screen.getByText('CANCELADO')).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Cancelar turno' }),
        ).not.toBeInTheDocument()
    })

    it('el PROFESIONAL solo mira', async () => {
        iniciarSesionComo('PROFESIONAL', 20)
        renderPage()

        await screen.findByText('Dolor de espalda')
        expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('un turno COMPLETADO no se puede cancelar', async () => {
        iniciarSesionComo('ADMIN')
        renderPage('2')

        await screen.findByText('Control anual')
        expect(
            screen.queryByRole('button', { name: 'Cancelar turno' }),
        ).not.toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Editar' }),
        ).toBeInTheDocument()
    })

    it('el ADMIN cambia estado y observaciones sin reprogramar', async () => {
        const user = userEvent.setup()
        const captura = capturarPut()
        iniciarSesionComo('ADMIN')
        renderPage()

        await user.click(await screen.findByRole('button', { name: 'Editar' }))
        // La hora actual figura como opción aunque no esté libre.
        expect(await screen.findByLabelText('Hora')).toHaveValue('09:00')

        await user.selectOptions(screen.getByLabelText('Estado'), 'CONFIRMADO')
        const observaciones = screen.getByLabelText('Observaciones')
        await user.clear(observaciones)
        await user.type(observaciones, 'Confirmado por teléfono')
        await user.click(
            screen.getByRole('button', { name: 'Guardar cambios' }),
        )

        expect(
            await screen.findByText('Turno actualizado correctamente.'),
        ).toBeInTheDocument()
        expect(captura.body).toEqual({
            estado: 'CONFIRMADO',
            motivo: 'Dolor de espalda',
            observaciones: 'Confirmado por teléfono',
        })
        expect(screen.getByText('CONFIRMADO')).toBeInTheDocument()
    })

    it('el ADMIN reprograma usando solo horarios de la misma agenda', async () => {
        const user = userEvent.setup()
        server.use(
            http.get('*/turnos/horarios-libres', () =>
                HttpResponse.json([
                    { agendaId: 1, hora: '10:00' },
                    { agendaId: 7, hora: '11:00' },
                ]),
            ),
        )
        const captura = capturarPut()
        iniciarSesionComo('ADMIN')
        renderPage()

        await user.click(await screen.findByRole('button', { name: 'Editar' }))
        const fecha = screen.getByLabelText('Fecha')
        await user.clear(fecha)
        await user.type(fecha, '2030-01-14')

        const hora = await screen.findByLabelText('Hora')
        const opciones = Array.from(
            hora.querySelectorAll('option'),
            (o) => o.textContent,
        )
        expect(opciones).toEqual(['Seleccioná un horario', '10:00'])

        await user.selectOptions(hora, '10:00')
        await user.click(
            screen.getByRole('button', { name: 'Guardar cambios' }),
        )

        await screen.findByText('Turno actualizado correctamente.')
        expect(captura.body).toMatchObject({
            fecha: '2030-01-14',
            hora: '10:00',
        })
    })

    it('muestra el error del back al guardar', async () => {
        const user = userEvent.setup()
        server.use(
            http.put('*/turnos/:id', () =>
                HttpResponse.json(
                    { mensaje: 'El turno ya está completado' },
                    { status: 409 },
                ),
            ),
        )
        iniciarSesionComo('ADMIN')
        renderPage()

        await user.click(await screen.findByRole('button', { name: 'Editar' }))
        await screen.findByLabelText('Hora')
        await user.click(
            screen.getByRole('button', { name: 'Guardar cambios' }),
        )

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'El turno ya está completado',
        )
    })

    it('muestra 404 si el turno no es accesible', async () => {
        iniciarSesionComo('PACIENTE', 3)
        renderPage('99')

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Turno no encontrado',
        )
    })
})
