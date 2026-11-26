import type { AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../api'
import {
    crearEspacio,
    desactivarEspacio,
    eliminarEspacio,
    listarEspacios,
    modificarEspacio,
    obtenerEspacioPorId,
    obtenerOcupacion,
    reactivarEspacio,
} from '../espacioService'

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

const espacioBase = {
    id: 1,
    nombre: 'Gimnasio Adelante',
    tipo: 'GIMNASIO' as const,
    ubicacion: 'ADELANTE' as const,
    activo: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
}

describe('espacioService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('listarEspacios hace GET /espacios', async () => {
        mockedApi.get.mockResolvedValue(response([espacioBase]))

        await expect(listarEspacios()).resolves.toEqual([espacioBase])
        expect(mockedApi.get).toHaveBeenCalledWith('/espacios', {
            params: undefined,
        })
    })

    it('listarEspacios envia filtros como query params', async () => {
        mockedApi.get.mockResolvedValue(response([espacioBase]))
        const filtros = {
            activo: true,
            tipo: 'GIMNASIO' as const,
            ubicacion: 'ADELANTE' as const,
        }

        await expect(listarEspacios(filtros)).resolves.toEqual([espacioBase])
        expect(mockedApi.get).toHaveBeenCalledWith('/espacios', {
            params: filtros,
        })
    })

    it('obtenerEspacioPorId hace GET /espacios/:id', async () => {
        mockedApi.get.mockResolvedValue(response(espacioBase))

        await expect(obtenerEspacioPorId(1)).resolves.toEqual(espacioBase)
        expect(mockedApi.get).toHaveBeenCalledWith('/espacios/1')
    })

    it('crearEspacio hace POST /espacios con payload', async () => {
        const payload = {
            nombre: 'Consultorio Atras',
            tipo: 'CONSULTORIO' as const,
            ubicacion: 'ATRAS' as const,
        }
        mockedApi.post.mockResolvedValue(
            response({ ...espacioBase, ...payload, id: 2 }),
        )

        await expect(crearEspacio(payload)).resolves.toMatchObject({
            id: 2,
            ...payload,
        })
        expect(mockedApi.post).toHaveBeenCalledWith('/espacios', payload)
    })

    it('modificarEspacio hace PUT /espacios/:id con payload', async () => {
        const payload = { nombre: 'Gimnasio Principal' }
        mockedApi.put.mockResolvedValue(
            response({ ...espacioBase, ...payload }),
        )

        await expect(modificarEspacio(1, payload)).resolves.toMatchObject(
            payload,
        )
        expect(mockedApi.put).toHaveBeenCalledWith('/espacios/1', payload)
    })

    it('desactivarEspacio hace PATCH /espacios/:id/desactivar', async () => {
        mockedApi.patch.mockResolvedValue(
            response({ ...espacioBase, activo: false }),
        )

        await expect(desactivarEspacio(1)).resolves.toMatchObject({
            activo: false,
        })
        expect(mockedApi.patch).toHaveBeenCalledWith('/espacios/1/desactivar')
    })

    it('reactivarEspacio hace PATCH /espacios/:id/reactivar', async () => {
        mockedApi.patch.mockResolvedValue(
            response({ ...espacioBase, activo: true }),
        )

        await expect(reactivarEspacio(1)).resolves.toMatchObject({
            activo: true,
        })
        expect(mockedApi.patch).toHaveBeenCalledWith('/espacios/1/reactivar')
    })

    it('eliminarEspacio hace DELETE /espacios/:id', async () => {
        mockedApi.delete.mockResolvedValue(response(undefined))

        await expect(eliminarEspacio(1)).resolves.toBeUndefined()
        expect(mockedApi.delete).toHaveBeenCalledWith('/espacios/1')
    })

    it('obtenerOcupacion hace GET /espacios/ocupacion y desenvuelve data', async () => {
        const ocupacion = [
            {
                id: 1,
                nombre: 'Gimnasio Adelante',
                tipo: 'GIMNASIO',
                ubicacion: 'ADELANTE',
                activo: true,
                asignaciones: [],
            },
        ]
        mockedApi.get.mockResolvedValue(response({ data: ocupacion }))

        await expect(
            obtenerOcupacion('2026-01-01', '2026-01-31'),
        ).resolves.toEqual(ocupacion)
        expect(mockedApi.get).toHaveBeenCalledWith('/espacios/ocupacion', {
            params: { start: '2026-01-01', end: '2026-01-31' },
        })
    })
})
