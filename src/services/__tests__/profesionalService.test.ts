import type { AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../api'
import {
    activarProfesional,
    crearProfesional,
    desactivarProfesional,
    listarProfesionales,
    modificarProfesional,
    obtenerProfesionalPorId,
} from '../profesionalService'

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

const profesionalBase = {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    dni: '12345678',
    telefono: '123456789',
    email: 'juan@test.com',
    especialidad: 'Cardiología',
    matricula: 'MP12345',
    activo: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
}

describe('profesionalService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('listarProfesionales hace GET /profesionales', async () => {
        const data = [profesionalBase]
        mockedApi.get.mockResolvedValue(response(data))
        await expect(listarProfesionales()).resolves.toEqual(data)
        expect(mockedApi.get).toHaveBeenCalledWith('/profesionales')
    })

    it('obtenerProfesionalPorId hace GET /profesionales/:id', async () => {
        mockedApi.get.mockResolvedValue(response(profesionalBase))
        await expect(obtenerProfesionalPorId(1)).resolves.toEqual(
            profesionalBase,
        )
        expect(mockedApi.get).toHaveBeenCalledWith('/profesionales/1')
    })

    it('crearProfesional hace POST /profesionales con payload', async () => {
        const payload = {
            nombre: 'Juan',
            apellido: 'Pérez',
            dni: '12345678',
            telefono: '123456789',
            email: 'juan@test.com',
            password: 'secret123',
            especialidad: 'Cardiología',
            matricula: 'MP12345',
            activo: true,
        }
        mockedApi.post.mockResolvedValue(
            response({ ...profesionalBase, ...payload }),
        )

        await expect(crearProfesional(payload)).resolves.toMatchObject({
            id: 1,
        })
        expect(mockedApi.post).toHaveBeenCalledWith('/profesionales', payload)
    })

    it('modificarProfesional hace PUT /profesionales/:id con payload', async () => {
        const payload = { telefono: '999999999' }
        const data = { ...profesionalBase, ...payload }
        mockedApi.put.mockResolvedValue(response(data))

        await expect(modificarProfesional(1, payload)).resolves.toEqual(data)
        expect(mockedApi.put).toHaveBeenCalledWith('/profesionales/1', payload)
    })

    it('desactivarProfesional hace PATCH /profesionales/:id/desactivar', async () => {
        mockedApi.patch.mockResolvedValue(response(undefined))
        await expect(desactivarProfesional(1)).resolves.toBeUndefined()
        expect(mockedApi.patch).toHaveBeenCalledWith(
            '/profesionales/1/desactivar',
        )
    })

    it('activarProfesional hace PATCH /profesionales/:id/activar', async () => {
        mockedApi.patch.mockResolvedValue(response(profesionalBase))
        await expect(activarProfesional(1)).resolves.toEqual(profesionalBase)
        expect(mockedApi.patch).toHaveBeenCalledWith('/profesionales/1/activar')
    })
})
