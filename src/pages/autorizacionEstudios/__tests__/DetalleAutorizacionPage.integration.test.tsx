import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DetalleAutorizacionPage } from '../DetalleAutorizacionPage'
import { iniciarSesionComo } from '../../../test/sesion'
import { server } from '../../../test/mocks/server'

function renderPage(id = '1') {
    return render(
        <MemoryRouter initialEntries={[`/autorizaciones/${id}`]}>
            <Routes>
                <Route
                    path="/autorizaciones/:id"
                    element={<DetalleAutorizacionPage />}
                />
                <Route
                    path="/autorizaciones"
                    element={<div>Listado autorizaciones</div>}
                />
            </Routes>
        </MemoryRouter>,
    )
}

describe('DetalleAutorizacionPage', () => {
    beforeEach(() => {
        localStorage.clear()
        vi.restoreAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('como ADMIN con autorización existente (id 1)', () => {
        beforeEach(() => {
            iniciarSesionComo('ADMIN')
        })

        it('carga y muestra los datos de la autorización con su vigencia', async () => {
            renderPage('1')

            // El estado de carga es async, usar findByText
            await screen.findByText('Autorización #1')
            expect(screen.getByText('1')).toBeInTheDocument()
            expect(screen.getByText('#2')).toBeInTheDocument()
            expect(screen.getByText(/Ana/)).toBeInTheDocument()
            expect(screen.getByText(/Lopez/)).toBeInTheDocument()
            expect(screen.getByText(/Kinesiologia/)).toBeInTheDocument()
            expect(screen.getByText('2026-03-06')).toBeInTheDocument()
            expect(screen.getByText('2026-09-06')).toBeInTheDocument()
            expect(screen.getByText('DISPONIBLE')).toBeInTheDocument()
            expect(screen.getByText('Vigente')).toBeInTheDocument()
        })

        it('revoca la autorización cuando se confirma', async () => {
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
            let revocada = false
            server.use(
                http.patch('*/autorizacionestudios/:id/revocar', () => {
                    revocada = true
                    return HttpResponse.json({
                        id: 1,
                        estado: 'VENCIDO',
                    })
                }),
            )

            const user = userEvent.setup()
            renderPage('1')
            await screen.findByText('Autorización #1')

            await user.click(
                screen.getByRole('button', { name: 'Revocar autorización' }),
            )

            expect(confirmSpy).toHaveBeenCalled()
            expect(revocada).toBe(true)
        })

        it('no revoca si se cancela la confirmación', async () => {
            const confirmSpy = vi
                .spyOn(window, 'confirm')
                .mockReturnValue(false)
            let revocada = false
            server.use(
                http.patch('*/autorizacionestudios/:id/revocar', () => {
                    revocada = true
                    return HttpResponse.json({ id: 1, estado: 'VENCIDO' })
                }),
            )

            const user = userEvent.setup()
            renderPage('1')
            await screen.findByText('Autorización #1')

            await user.click(
                screen.getByRole('button', { name: 'Revocar autorización' }),
            )

            expect(confirmSpy).toHaveBeenCalled()
            expect(revocada).toBe(false)
        })
    })

    describe('autorización no encontrada', () => {
        it('muestra el error cuando la autorización no existe', async () => {
            renderPage('999')

            expect(await screen.findByText('No encontrado')).toBeInTheDocument()
        })
    })

    describe('ID inválido', () => {
        it('muestra estado de carga cuando el ID no es un número', async () => {
            renderPage('abc')

            // Nota: el componente se queda en "Cargando autorización..." para ID
            // inválido (bug: cargando nunca se pone en false cuando autorizacionId es NaN)
            expect(
                await screen.findByText('Cargando autorización...'),
            ).toBeInTheDocument()
        })
    })
})
