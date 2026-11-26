import type { AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../api'
import {
    cancelarTurno,
    crearTurno,
    listarTurnos,
    modificarTurno,
    obtenerHorariosLibres,
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
    hora: '10:00:00',
    estado: 'PENDIENTE',
    motivo: 'Control de rutina',
    observaciones: null,
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
            motivo: 'Control de rutina',
            observaciones: 'Traer estudios',
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

    it('obtenerHorariosLibres hace GET /turnos/horarios-libres con params', async () => {
        const data = [
            { agendaId: 5, hora: '09:00' },
            { agendaId: 5, hora: '09:30' },
        ]
        mockedApi.get.mockResolvedValue(response(data))

        await expect(obtenerHorariosLibres(10, '2026-02-16')).resolves.toEqual(
            data,
        )
        expect(mockedApi.get).toHaveBeenCalledWith('/turnos/horarios-libres', {
            params: { profesionalId: 10, fecha: '2026-02-16' },
        })
    })

    it('cancelarTurno hace DELETE /turnos/:id', async () => {
        mockedApi.delete.mockResolvedValue(
            response({ ...turnoBase, estado: 'CANCELADO' }),
        )
        await expect(cancelarTurno(1)).resolves.toMatchObject({
            estado: 'CANCELADO',
        })
        expect(mockedApi.delete).toHaveBeenCalledWith('/turnos/1')
        expect(mockedApi.patch).not.toHaveBeenCalled()
    })
})
