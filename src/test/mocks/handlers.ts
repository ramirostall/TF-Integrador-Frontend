import { http, HttpResponse } from 'msw'
import {
    agendasFixture,
    autorizacionesFixture,
    estudiosFixture,
    horariosLibresFixture,
    espaciosFixture,
    pacientesFixture,
    profesionalesFixture,
    turnosFixture,
    usuariosFixture,
} from './fixtures'

export const handlers = [
    http.get('*/usuarios/email/:email', ({ params }) => {
        const email = decodeURIComponent(String(params.email))
        const usuario = usuariosFixture.find((u) => u.email === email)
        return usuario
            ? HttpResponse.json(usuario)
            : HttpResponse.json({ mensaje: 'No encontrado' }, { status: 404 })
    }),
    http.get('*/usuarios', () => HttpResponse.json(usuariosFixture)),
    http.get('*/usuarios/:id', ({ params }) => {
        const id = Number(params.id)
        const usuario = usuariosFixture.find((u) => u.id === id)
        return usuario
            ? HttpResponse.json(usuario)
            : HttpResponse.json({ mensaje: 'No encontrado' }, { status: 404 })
    }),
    http.post('*/usuarios', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(
            { id: 99, activo: true, ...body },
            { status: 201 },
        )
    }),
    http.put('*/usuarios/:id', async ({ params, request }) => {
        const id = Number(params.id)
        const body = (await request.json()) as Record<string, unknown>
        const base = usuariosFixture.find((u) => u.id === id) || {
            id,
            rol: 'PROFESIONAL',
            activo: true,
            email: '',
        }
        return HttpResponse.json({ ...base, ...body, id })
    }),
    http.patch('*/usuarios/:id/desactivar', ({ params }) => {
        const id = Number(params.id)
        const base = usuariosFixture.find((u) => u.id === id) || {
            id,
            rol: 'PROFESIONAL',
            email: '',
            activo: true,
        }
        return HttpResponse.json({ ...base, activo: false })
    }),
    http.patch('*/usuarios/:id/reactivar', ({ params }) => {
        const id = Number(params.id)
        const base = usuariosFixture.find((u) => u.id === id) || {
            id,
            rol: 'PROFESIONAL',
            email: '',
            activo: false,
        }
        return HttpResponse.json({ ...base, activo: true })
    }),

    http.get('*/pacientes', () => HttpResponse.json(pacientesFixture)),
    http.get('*/pacientes/me', () => HttpResponse.json(pacientesFixture[0])),
    http.get('*/pacientes/:id', ({ params }) => {
        const id = Number(params.id)
        const paciente = pacientesFixture.find((p) => p.id === id)
        return paciente
            ? HttpResponse.json(paciente)
            : HttpResponse.json({ mensaje: 'No encontrado' }, { status: 404 })
    }),
    http.post('*/pacientes', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: 50, ...body }, { status: 201 })
    }),
    http.put('*/pacientes/me', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...pacientesFixture[0], ...body })
    }),
    http.put('*/pacientes/:id', async ({ params, request }) => {
        const id = Number(params.id)
        const body = (await request.json()) as Record<string, unknown>
        const base =
            pacientesFixture.find((p) => p.id === id) || pacientesFixture[0]
        return HttpResponse.json({ ...base, ...body, id })
    }),
    http.delete(
        '*/pacientes/:id',
        () => new HttpResponse(null, { status: 204 }),
    ),

    http.get('*/estudios', () => HttpResponse.json(estudiosFixture)),
    http.get('*/estudios/paciente/:pacienteId', ({ params }) => {
        const pacienteId = Number(params.pacienteId)
        return HttpResponse.json(
            estudiosFixture.filter((e) => e.pacienteId === pacienteId),
        )
    }),
    http.get('*/estudios/:id', ({ params }) => {
        const id = Number(params.id)
        const estudio = estudiosFixture.find((e) => e.id === id)
        return estudio
            ? HttpResponse.json(estudio)
            : HttpResponse.json({ mensaje: 'No encontrado' }, { status: 404 })
    }),
    http.post('*/estudios', async ({ request }) => {
        const formData = await request.formData()
        return HttpResponse.json(
            {
                id: 99,
                pacienteId: Number(formData.get('pacienteId')),
                tipo: String(formData.get('tipo')),
                fecha: String(formData.get('fecha')),
                descripcion: String(formData.get('descripcion')),
                archivoURL: formData.get('archivo')
                    ? 'https://archivos.test.com/estudios/99.pdf'
                    : null,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            },
            { status: 201 },
        )
    }),
    http.put('*/estudios/:id/archivo', async ({ params, request }) => {
        const id = Number(params.id)
        const formData = await request.formData()
        const archivo = formData.get('archivo')
        return HttpResponse.json({
            id,
            pacienteId: 10,
            tipo: 'Hemograma completo',
            fecha: '2026-02-10',
            descripcion: 'Control de rutina',
            archivoURL: archivo
                ? `https://archivos.test.com/estudios/${id}/archivo.pdf`
                : null,
            createdAt: '2026-02-10T08:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
        })
    }),
    http.get('*/estudios/:id/archivo', ({ params }) => {
        const id = Number(params.id)
        return HttpResponse.json({
            url: `https://archivos.test.com/estudios/${id}/download`,
            expiresIn: 3600,
        })
    }),

    http.get('*/autorizacionestudios', () =>
        HttpResponse.json(autorizacionesFixture),
    ),
    http.get('*/autorizacionestudios/:id', ({ params }) => {
        const id = Number(params.id)
        const autorizacion = autorizacionesFixture.find((a) => a.id === id)
        return autorizacion
            ? HttpResponse.json(autorizacion)
            : HttpResponse.json({ mensaje: 'No encontrado' }, { status: 404 })
    }),
    http.post('*/autorizacionestudios', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(
            { id: 99, estado: 'DISPONIBLE', ...body },
            { status: 201 },
        )
    }),
    http.patch('*/autorizacionestudios/:id/revocar', ({ params }) => {
        const id = Number(params.id)
        const base = autorizacionesFixture.find((a) => a.id === id) || {
            id,
            estado: 'DISPONIBLE',
        }
        return HttpResponse.json({ ...base, estado: 'VENCIDO' })
    }),
    http.get('*/autorizacionestudios/:id/vigencia', ({ params }) => {
        const id = Number(params.id)
        return HttpResponse.json({
            id,
            estaVigente: true,
            estaVencida: false,
        })
    }),

    http.get('*/agendas', () => HttpResponse.json(agendasFixture)),
    http.get('*/agendas/profesional/:profesionalId', ({ params }) => {
        const profesionalId = Number(params.profesionalId)
        return HttpResponse.json(
            agendasFixture.filter((a) => a.profesionalId === profesionalId),
        )
    }),
    http.get('*/agendas/:id', ({ params }) => {
        const id = Number(params.id)
        const agenda = agendasFixture.find((a) => a.id === id)
        return agenda
            ? HttpResponse.json(agenda)
            : HttpResponse.json(
                  { mensaje: 'Agenda no encontrada' },
                  { status: 404 },
              )
    }),
    http.post('*/agendas', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(
            {
                id: 3,
                activo: true,
                createdAt: '2026-01-03T00:00:00Z',
                updatedAt: '2026-01-03T00:00:00Z',
                profesional: agendasFixture[0].profesional,
                ...body,
            },
            { status: 201 },
        )
    }),
    http.put('*/agendas/:id', async ({ params, request }) => {
        const id = Number(params.id)
        const body = (await request.json()) as Record<string, unknown>
        const base =
            agendasFixture.find((a) => a.id === id) ?? agendasFixture[0]
        return HttpResponse.json({ ...base, ...body, id })
    }),
    http.patch(
        '*/agendas/:id/desactivar',
        () => new HttpResponse(null, { status: 204 }),
    ),
    http.patch('*/agendas/:id/activar', ({ params }) => {
        const id = Number(params.id)
        const base =
            agendasFixture.find((a) => a.id === id) ?? agendasFixture[0]
        return HttpResponse.json({ ...base, activo: true })
    }),

    // /ocupacion va antes de /:id para que "ocupacion" no se interprete como id.
    http.get('*/espacios/ocupacion', () => HttpResponse.json({ data: [] })),
    http.get('*/espacios', ({ request }) => {
        const url = new URL(request.url)
        const activo = url.searchParams.get('activo')
        const tipo = url.searchParams.get('tipo')
        const ubicacion = url.searchParams.get('ubicacion')

        let resultado = [...espaciosFixture]

        if (activo !== null) {
            resultado = resultado.filter(
                (espacio) => espacio.activo === (activo === 'true'),
            )
        }
        if (tipo) {
            resultado = resultado.filter((espacio) => espacio.tipo === tipo)
        }
        if (ubicacion) {
            resultado = resultado.filter(
                (espacio) => espacio.ubicacion === ubicacion,
            )
        }

        return HttpResponse.json(resultado)
    }),
    http.get('*/espacios/:id', ({ params }) => {
        const id = Number(params.id)
        const espacio = espaciosFixture.find((e) => e.id === id)
        return espacio
            ? HttpResponse.json(espacio)
            : HttpResponse.json(
                  { mensaje: 'Espacio no encontrado' },
                  { status: 404 },
              )
    }),
    http.post('*/espacios', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(
            {
                id: 99,
                activo: true,
                createdAt: '2026-01-03T00:00:00Z',
                updatedAt: '2026-01-03T00:00:00Z',
                ...body,
            },
            { status: 201 },
        )
    }),
    http.put('*/espacios/:id', async ({ params, request }) => {
        const id = Number(params.id)
        const body = (await request.json()) as Record<string, unknown>
        const base =
            espaciosFixture.find((e) => e.id === id) ?? espaciosFixture[0]
        return HttpResponse.json({ ...base, ...body, id })
    }),
    http.patch('*/espacios/:id/desactivar', ({ params }) => {
        const id = Number(params.id)
        const base =
            espaciosFixture.find((e) => e.id === id) ?? espaciosFixture[0]
        return HttpResponse.json({ ...base, id, activo: false })
    }),
    http.patch('*/espacios/:id/reactivar', ({ params }) => {
        const id = Number(params.id)
        const base =
            espaciosFixture.find((e) => e.id === id) ?? espaciosFixture[0]
        return HttpResponse.json({ ...base, id, activo: true })
    }),
    http.delete(
        '*/espacios/:id',
        () => new HttpResponse(null, { status: 204 }),
    ),

    http.get('*/profesionales', () => HttpResponse.json(profesionalesFixture)),
    http.get('*/profesionales/:id', ({ params }) => {
        const id = Number(params.id)
        const profesional = profesionalesFixture.find((p) => p.id === id)
        return profesional
            ? HttpResponse.json(profesional)
            : HttpResponse.json(
                  { mensaje: 'Profesional no encontrado' },
                  { status: 404 },
              )
    }),
    http.post('*/profesionales', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: 3, ...body }, { status: 201 })
    }),
    http.put('*/profesionales/:id', async ({ params, request }) => {
        const id = Number(params.id)
        const body = (await request.json()) as Record<string, unknown>
        const base =
            profesionalesFixture.find((p) => p.id === id) ??
            profesionalesFixture[0]
        return HttpResponse.json({ ...base, ...body, id })
    }),

    // Va antes de /turnos/:id para que "horarios-libres" no se tome como id.
    http.get('*/turnos/horarios-libres', () =>
        HttpResponse.json(horariosLibresFixture),
    ),
    http.get('*/turnos', ({ request }) => {
        const params = new URL(request.url).searchParams
        const estado = params.get('estado')
        const profesionalId = params.get('profesionalId')
        return HttpResponse.json(
            turnosFixture.filter(
                (t) =>
                    (!estado || t.estado === estado) &&
                    (!profesionalId ||
                        t.profesionalId === Number(profesionalId)),
            ),
        )
    }),
    http.get('*/turnos/:id', ({ params }) => {
        const id = Number(params.id)
        const turno = turnosFixture.find((t) => t.id === id)
        return turno
            ? HttpResponse.json(turno)
            : HttpResponse.json(
                  { mensaje: 'Turno no encontrado' },
                  { status: 404 },
              )
    }),
    http.post('*/turnos', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(
            { id: 3, estado: 'PENDIENTE', pacienteId: 10, ...body },
            { status: 201 },
        )
    }),
    http.put('*/turnos/:id', async ({ params, request }) => {
        const id = Number(params.id)
        const body = (await request.json()) as Record<string, unknown>
        const base = turnosFixture.find((t) => t.id === id) ?? turnosFixture[0]
        return HttpResponse.json({ ...base, ...body, id })
    }),
    http.delete('*/turnos/:id', ({ params }) => {
        const id = Number(params.id)
        const base = turnosFixture.find((t) => t.id === id) ?? turnosFixture[0]
        return HttpResponse.json({ ...base, estado: 'CANCELADO' })
    }),
]
