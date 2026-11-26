import type { AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../api'
import {
    crearAsignacionEspacio,
    eliminarAsignacionEspacio,
    listarAsignacionesEspacio,
    modificarAsignacionEspacio,
    obtenerAsignacionEspacioPorId,
} from '../asignacionEspacioService'

vi.mock('../api', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}))

const mockedApi = vi.mocked(api)

function response<T>(data: T): AxiosResponse<T> {
    return { data } as AxiosResponse<T>
}

const asignacionBase = {
    id: 1,
    profesionalId: 1,
    espacioId: 1,
    tipo: 'FIJA' as const,
    diaSemana: 'LUNES' as const,
    fecha: null,
    horaInicio: '09:00:00',
    horaFin: '12:00:00',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    profesional: { id: 1, nombre: 'Ana', apellido: 'Lopez' },
    espacio: {
        id: 1,
        nombre: 'Gimnasio Adelante',
        tipo: 'GIMNASIO',
        ubicacion: 'ADELANTE',
    },
}

describe('asignacionEspacioService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('listarAsignacionesEspacio hace GET /asignaciones-espacio', async () => {
        mockedApi.get.mockResolvedValue(response([asignacionBase]))

        await expect(listarAsignacionesEspacio()).resolves.toEqual([
            asignacionBase,
        ])
        expect(mockedApi.get).toHaveBeenCalledWith('/asignaciones-espacio', {
            params: undefined,
        })
    })

    it('listarAsignacionesEspacio envia filtros como query params', async () => {
        mockedApi.get.mockResolvedValue(response([asignacionBase]))
        const filtros = {
            espacioId: 1,
            profesionalId: 1,
            tipo: 'FIJA' as const,
        }

        await expect(listarAsignacionesEspacio(filtros)).resolves.toEqual([
            asignacionBase,
        ])
        expect(mockedApi.get).toHaveBeenCalledWith('/asignaciones-espacio', {
            params: filtros,
        })
    })

    it('obtenerAsignacionEspacioPorId hace GET /asignaciones-espacio/:id', async () => {
        mockedApi.get.mockResolvedValue(response(asignacionBase))

        await expect(obtenerAsignacionEspacioPorId(1)).resolves.toEqual(
            asignacionBase,
        )
        expect(mockedApi.get).toHaveBeenCalledWith('/asignaciones-espacio/1')
    })

    it('crearAsignacionEspacio hace POST /asignaciones-espacio', async () => {
        const payload = {
            profesionalId: 1,
            espacioId: 1,
            tipo: 'FIJA' as const,
            diaSemana: 'LUNES' as const,
            horaInicio: '09:00',
            horaFin: '12:00',
        }
        mockedApi.post.mockResolvedValue(
            response({ ...asignacionBase, ...payload, id: 3 }),
        )

        await expect(crearAsignacionEspacio(payload)).resolves.toMatchObject({
            id: 3,
        })
        expect(mockedApi.post).toHaveBeenCalledWith(
            '/asignaciones-espacio',
            payload,
        )
    })

    it('modificarAsignacionEspacio hace PUT /asignaciones-espacio/:id', async () => {
        const payload = {
            profesionalId: 1,
            espacioId: 1,
            tipo: 'ESPECIFICA' as const,
            fecha: '2030-01-10',
            horaInicio: '10:00',
            horaFin: '11:00',
        }
        mockedApi.put.mockResolvedValue(
            response({ ...asignacionBase, ...payload, diaSemana: null }),
        )

        await expect(
            modificarAsignacionEspacio(1, payload),
        ).resolves.toMatchObject({ tipo: 'ESPECIFICA' })
        expect(mockedApi.put).toHaveBeenCalledWith(
            '/asignaciones-espacio/1',
            payload,
        )
    })

    it('eliminarAsignacionEspacio hace DELETE /asignaciones-espacio/:id', async () => {
        mockedApi.delete.mockResolvedValue(response(undefined))

        await expect(eliminarAsignacionEspacio(1)).resolves.toBeUndefined()
        expect(mockedApi.delete).toHaveBeenCalledWith('/asignaciones-espacio/1')
    })
})
