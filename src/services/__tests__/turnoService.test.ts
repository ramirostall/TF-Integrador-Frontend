import type { AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../api'
import {
    cancelarTurno,
    crearTurno,
    listarTurnos,
    modificarTurno,
    obtenerTurnoPorId,
} from '../turnoService'

vi.mock('../api', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}))

const mockedApi = vi.mocked(api)

function response<T>(data: T): AxiosResponse<T> {
    return { data } as AxiosResponse<T>
}

const turnoBase = {
    id: 1,
    profesionalId: 10,
    pacienteId: 20,
    agendaId: 5,
    fecha: '2026-02-15',
    hora: '10:00',
    duracion: 30,
    estado: 'PENDIENTE',
    notas: 'Control de rutina',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
}

describe('turnoService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('listarTurnos hace GET /turnos', async () => {
        const data = [turnoBase]
        mockedApi.get.mockResolvedValue(response(data))
        await expect(listarTurnos()).resolves.toEqual(data)
        expect(mockedApi.get).toHaveBeenCalledWith('/turnos', {
            params: undefined,
        })
    })

    it('listarTurnos hace GET /turnos con filtros', async () => {
        const data = [turnoBase]
        const filtros = { estado: 'PENDIENTE' as const }
        mockedApi.get.mockResolvedValue(response(data))
        await expect(listarTurnos(filtros)).resolves.toEqual(data)
        expect(mockedApi.get).toHaveBeenCalledWith('/turnos', {
            params: filtros,
        })
    })

    it('obtenerTurnoPorId hace GET /turnos/:id', async () => {
        mockedApi.get.mockResolvedValue(response(turnoBase))
        await expect(obtenerTurnoPorId(1)).resolves.toEqual(turnoBase)
        expect(mockedApi.get).toHaveBeenCalledWith('/turnos/1')
    })

    it('crearTurno hace POST /turnos con payload', async () => {
        const payload = {
            profesionalId: 10,
            pacienteId: 20,
            agendaId: 5,
            fecha: '2026-02-15',
            hora: '10:00',
            duracion: 30,
            notas: 'Control de rutina',
        }
        mockedApi.post.mockResolvedValue(response({ ...turnoBase, ...payload }))

        await expect(crearTurno(payload)).resolves.toMatchObject({
            id: 1,
        })
        expect(mockedApi.post).toHaveBeenCalledWith('/turnos', payload)
    })

    it('modificarTurno hace PUT /turnos/:id con payload', async () => {
        const payload = { estado: 'CONFIRMADO' as const }
        const data = { ...turnoBase, ...payload }
        mockedApi.put.mockResolvedValue(response(data))

        await expect(modificarTurno(1, payload)).resolves.toEqual(data)
        expect(mockedApi.put).toHaveBeenCalledWith('/turnos/1', payload)
    })

    it('cancelarTurno hace PATCH /turnos/:id/cancelar', async () => {
        mockedApi.patch.mockResolvedValue(
            response({ ...turnoBase, estado: 'CANCELADO' }),
        )
        await expect(cancelarTurno(1)).resolves.toMatchObject({
            estado: 'CANCELADO',
        })
        expect(mockedApi.patch).toHaveBeenCalledWith('/turnos/1/cancelar')
    })
})
