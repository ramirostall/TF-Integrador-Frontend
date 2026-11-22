import type { AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../api'
import {
    activarAgenda,
    crearAgenda,
    desactivarAgenda,
    listarAgendas,
    listarAgendasPorProfesional,
    modificarAgenda,
    obtenerAgendaPorId,
} from '../agendaService'

vi.mock('../api', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
    },
}))

const mockedApi = vi.mocked(api)

function response<T>(data: T): AxiosResponse<T> {
    return { data } as AxiosResponse<T>
}

const agendaBase = {
    id: 1,
    profesionalId: 1,
    diaSemana: 'LUNES' as const,
    horaInicio: '09:00:00',
    horaFin: '13:00:00',
    duracionTurno: 30,
    activo: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    profesional: {
        id: 1,
        nombre: 'Ana',
        apellido: 'Lopez',
        matricula: 'MP-1234',
        especialidad: 'Kinesiologia',
    },
}

describe('agendaService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('listarAgendas hace GET /agendas', async () => {
        mockedApi.get.mockResolvedValue(response([agendaBase]))

        await expect(listarAgendas()).resolves.toEqual([agendaBase])
        expect(mockedApi.get).toHaveBeenCalledWith('/agendas', {
            params: undefined,
        })
    })

    it('listarAgendas envía los filtros como query params', async () => {
        mockedApi.get.mockResolvedValue(response([agendaBase]))
        const filtros = { profesionalId: 1, activo: true }

        await expect(listarAgendas(filtros)).resolves.toEqual([agendaBase])
        expect(mockedApi.get).toHaveBeenCalledWith('/agendas', {
            params: filtros,
        })
    })

    it('listarAgendasPorProfesional hace GET /agendas/profesional/:id', async () => {
        mockedApi.get.mockResolvedValue(response([agendaBase]))

        await expect(listarAgendasPorProfesional(1)).resolves.toEqual([
            agendaBase,
        ])
        expect(mockedApi.get).toHaveBeenCalledWith('/agendas/profesional/1')
    })

    it('obtenerAgendaPorId hace GET /agendas/:id', async () => {
        mockedApi.get.mockResolvedValue(response(agendaBase))

        await expect(obtenerAgendaPorId(1)).resolves.toEqual(agendaBase)
        expect(mockedApi.get).toHaveBeenCalledWith('/agendas/1')
    })

    it('crearAgenda hace POST /agendas con payload', async () => {
        const payload = {
            profesionalId: 2,
            diaSemana: 'JUEVES' as const,
            horaInicio: '09:00',
            horaFin: '12:00',
            duracionTurno: 30,
        }
        mockedApi.post.mockResolvedValue(
            response({ ...agendaBase, ...payload, id: 3 }),
        )

        await expect(crearAgenda(payload)).resolves.toMatchObject({ id: 3 })
        expect(mockedApi.post).toHaveBeenCalledWith('/agendas', payload)
    })

    it('modificarAgenda hace PUT /agendas/:id con payload', async () => {
        const payload = { duracionTurno: 45 }
        mockedApi.put.mockResolvedValue(response({ ...agendaBase, ...payload }))

        await expect(modificarAgenda(1, payload)).resolves.toMatchObject(
            payload,
        )
        expect(mockedApi.put).toHaveBeenCalledWith('/agendas/1', payload)
    })

    it('desactivarAgenda hace PATCH con el flag y no lee la respuesta', async () => {
        await expect(desactivarAgenda(1, true)).resolves.toBeUndefined()
        expect(mockedApi.patch).toHaveBeenCalledWith('/agendas/1/desactivar', {
            cancelarTurnosFuturos: true,
        })
    })

    it('desactivarAgenda sin flag envía body undefined', async () => {
        await expect(desactivarAgenda(2)).resolves.toBeUndefined()
        expect(mockedApi.patch).toHaveBeenCalledWith(
            '/agendas/2/desactivar',
            undefined,
        )
    })

    it('activarAgenda hace PATCH /agendas/:id/activar y devuelve la agenda', async () => {
        mockedApi.patch.mockResolvedValue(
            response({ ...agendaBase, activo: true }),
        )

        await expect(activarAgenda(1)).resolves.toEqual(agendaBase)
        expect(mockedApi.patch).toHaveBeenCalledWith('/agendas/1/activar')
    })
})
