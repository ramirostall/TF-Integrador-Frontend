import type { AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../api'
import {
    crearAutorizacion,
    listarAutorizaciones,
    obtenerAutorizacionPorId,
    revocarAutorizacion,
    verificarVigencia,
} from '../autorizacionEstudioService'
import type {
    AutorizacionEstudio,
    CrearAutorizacionEstudio,
    VigenciaAutorizacion,
} from '../../types/estudio'

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

const autorizacionBase: AutorizacionEstudio = {
    id: 1,
    estudioId: 2,
    profesionalId: 1,
    fechaAutorizacion: '2026-03-06',
    fechaVencimiento: '2026-09-06',
    estado: 'DISPONIBLE',
    profesional: {
        id: 1,
        nombre: 'Ana',
        apellido: 'Lopez',
        especialidad: 'Kinesiologia',
    },
}

describe('autorizacionEstudioService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('listarAutorizaciones', () => {
        it('hace GET /autorizaciones-estudio y devuelve el listado', async () => {
            const data = [autorizacionBase]
            mockedApi.get.mockResolvedValue(response(data))

            await expect(listarAutorizaciones()).resolves.toEqual(data)
            expect(mockedApi.get).toHaveBeenCalledWith('/autorizacionestudios')
        })

        it('propaga el error si falla la petición', async () => {
            mockedApi.get.mockRejectedValue(new Error('Error de red'))
            await expect(listarAutorizaciones()).rejects.toThrow('Error de red')
        })
    })

    describe('obtenerAutorizacionPorId', () => {
        it('hace GET /autorizacionestudios/:id y devuelve la autorización', async () => {
            mockedApi.get.mockResolvedValue(response(autorizacionBase))

            await expect(obtenerAutorizacionPorId(1)).resolves.toEqual(
                autorizacionBase,
            )
            expect(mockedApi.get).toHaveBeenCalledWith(
                '/autorizacionestudios/1',
            )
        })

        it('propaga el error si falla la petición', async () => {
            mockedApi.get.mockRejectedValue(new Error('No encontrado'))
            await expect(obtenerAutorizacionPorId(999)).rejects.toThrow(
                'No encontrado',
            )
        })
    })

    describe('verificarVigencia', () => {
        it('hace GET /autorizaciones-estudio/:id/vigencia y devuelve la vigencia', async () => {
            const data: VigenciaAutorizacion = {
                id: 1,
                estaVigente: true,
                estaVencida: false,
            }
            mockedApi.get.mockResolvedValue(response(data))

            await expect(verificarVigencia(1)).resolves.toEqual(data)
            expect(mockedApi.get).toHaveBeenCalledWith(
                '/autorizacionestudios/1/vigencia',
            )
        })

        it('propaga el error si falla la petición', async () => {
            mockedApi.get.mockRejectedValue(new Error('Sin vigencia'))
            await expect(verificarVigencia(1)).rejects.toThrow('Sin vigencia')
        })
    })

    describe('crearAutorizacion', () => {
        const datos: CrearAutorizacionEstudio = {
            estudioId: 2,
            profesionalId: 1,
            fechaAutorizacion: '2026-03-06',
            fechaVencimiento: '2026-09-06',
        }

        it('hace POST /autorizaciones-estudio con payload JSON y devuelve la autorización creada', async () => {
            const creada = { ...autorizacionBase, id: 99 }
            mockedApi.post.mockResolvedValue(response(creada))

            const resultado = await crearAutorizacion(datos)

            expect(resultado).toEqual(creada)
            expect(mockedApi.post).toHaveBeenCalledWith(
                '/autorizacionestudios',
                datos,
            )
        })

        it('propaga el error si falla la creación', async () => {
            mockedApi.post.mockRejectedValue(new Error('Error al crear'))
            await expect(crearAutorizacion(datos)).rejects.toThrow(
                'Error al crear',
            )
        })
    })

    describe('revocarAutorizacion', () => {
        it('hace PATCH /autorizaciones-estudio/:id/revocar y devuelve la autorización revocada', async () => {
            const revocada = { ...autorizacionBase, estado: 'VENCIDO' }
            mockedApi.patch.mockResolvedValue(response(revocada))

            const resultado = await revocarAutorizacion(1)

            expect(resultado).toEqual(revocada)
            expect(mockedApi.patch).toHaveBeenCalledWith(
                '/autorizacionestudios/1/revocar',
            )
        })

        it('propaga el error si falla la revocación', async () => {
            mockedApi.patch.mockRejectedValue(new Error('Error al revocar'))
            await expect(revocarAutorizacion(1)).rejects.toThrow(
                'Error al revocar',
            )
        })
    })
})
