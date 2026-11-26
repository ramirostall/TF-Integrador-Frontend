import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { server } from '../../../test/mocks/server'
import { iniciarSesionComo } from '../../../test/sesion'
import { CrearProfesionalPage } from '../CrearProfesionalPage'

function renderPage() {
    return render(
        <MemoryRouter>
            <CrearProfesionalPage />
        </MemoryRouter>,
    )
}

async function completarFormulario(user: ReturnType<typeof userEvent.setup>) {
    await user.selectOptions(await screen.findByLabelText('Usuario'), '2')
    await user.type(screen.getByLabelText('Nombre'), 'Laura')
    await user.type(screen.getByLabelText('Apellido'), 'Diaz')
    await user.type(screen.getByLabelText('DNI'), '33444555')
    await user.type(screen.getByLabelText('Teléfono'), '1122223333')
    await user.type(screen.getByLabelText('Matrícula'), 'MP-9999')
    await user.type(screen.getByLabelText('Especialidad'), 'Pediatria')
}

describe('CrearProfesionalPage', () => {
    it('ofrece solo usuarios PROFESIONAL sin perfil', async () => {
        iniciarSesionComo('ADMIN')
        renderPage()

        const select = await screen.findByLabelText('Usuario')
        const opciones = Array.from(
            select.querySelectorAll('option'),
            (o) => o.textContent,
        )
        // admin@test.com (ADMIN) y paciente@test.com (PACIENTE) no aparecen.
        expect(opciones).toEqual(['Seleccioná un usuario', 'pro@test.com'])
        expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
        expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument()
    })

    it('crea el profesional con usuarioId y sin email/password', async () => {
        const user = userEvent.setup()
        let body: Record<string, unknown> = {}
        server.use(
            http.post('*/profesionales', async ({ request }) => {
                body = (await request.json()) as Record<string, unknown>
                return HttpResponse.json({ id: 3, ...body }, { status: 201 })
            }),
        )
        iniciarSesionComo('ADMIN')
        renderPage()

        await completarFormulario(user)
        await user.click(
            screen.getByRole('button', { name: 'Crear profesional' }),
        )

        expect(
            await screen.findByText('Profesional creado correctamente.'),
        ).toBeInTheDocument()
        expect(body).toEqual({
            usuarioId: 2,
            nombre: 'Laura',
            apellido: 'Diaz',
            dni: '33444555',
            telefono: '1122223333',
            matricula: 'MP-9999',
            especialidad: 'Pediatria',
        })
    })

    it('muestra el error del back', async () => {
        const user = userEvent.setup()
        server.use(
            http.post('*/profesionales', () =>
                HttpResponse.json(
                    { mensaje: 'El DNI ya está registrado' },
                    { status: 409 },
                ),
            ),
        )
        iniciarSesionComo('ADMIN')
        renderPage()

        await completarFormulario(user)
        await user.click(
            screen.getByRole('button', { name: 'Crear profesional' }),
        )

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'El DNI ya está registrado',
        )
    })

    it('avisa cuando no hay usuarios disponibles', async () => {
        server.use(
            http.get('*/usuarios', () =>
                HttpResponse.json([
                    {
                        id: 1,
                        email: 'admin@test.com',
                        rol: 'ADMIN',
                        activo: true,
                    },
                ]),
            ),
        )
        iniciarSesionComo('ADMIN')
        renderPage()

        expect(
            await screen.findByText(/No hay usuarios con rol PROFESIONAL/),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('link', { name: 'Crear usuario' }),
        ).toHaveAttribute('href', '/usuarios/nuevo')
    })
})
