import type { AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../api'
import {
    actualizarArchivoEstudio,
    crearEstudio,
    listarEstudios,
    listarEstudiosPaciente,
    obtenerEstudioPorId,
    obtenerUrlArchivo,
} from '../estudioService'
import type {
    CrearEstudio,
    Estudio,
    RespuestaArchivo,
} from '../../types/estudio'

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

const estudioBase: Estudio = {
    id: 1,
    pacienteId: 10,
    tipo: 'Hemograma completo',
    fecha: '2026-02-10',
    descripcion: 'Control de rutina',
    archivoURL: null,
    createdAt: '2026-02-10T08:00:00Z',
    updatedAt: '2026-02-10T08:00:00Z',
}

describe('estudioService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('listarEstudios', () => {
        it('hace GET /estudios y devuelve el listado', async () => {
            const data = [estudioBase]
            mockedApi.get.mockResolvedValue(response(data))

            await expect(listarEstudios()).resolves.toEqual(data)
            expect(mockedApi.get).toHaveBeenCalledWith('/estudios')
        })

        it('propaga el error si falla la petición', async () => {
            mockedApi.get.mockRejectedValue(new Error('Error de red'))
            await expect(listarEstudios()).rejects.toThrow('Error de red')
        })
    })

    describe('obtenerEstudioPorId', () => {
        it('hace GET /estudios/:id y devuelve el estudio', async () => {
            mockedApi.get.mockResolvedValue(response(estudioBase))

            await expect(obtenerEstudioPorId(1)).resolves.toEqual(estudioBase)
            expect(mockedApi.get).toHaveBeenCalledWith('/estudios/1')
        })

        it('propaga el error si falla la petición', async () => {
            mockedApi.get.mockRejectedValue(new Error('No encontrado'))
            await expect(obtenerEstudioPorId(999)).rejects.toThrow(
                'No encontrado',
            )
        })
    })

    describe('listarEstudiosPaciente', () => {
        it('hace GET /estudios/paciente/:pacienteId y devuelve los estudios del paciente', async () => {
            const data = [estudioBase]
            mockedApi.get.mockResolvedValue(response(data))

            await expect(listarEstudiosPaciente(10)).resolves.toEqual(data)
            expect(mockedApi.get).toHaveBeenCalledWith('/estudios/paciente/10')
        })
    })

    describe('crearEstudio', () => {
        const datos: CrearEstudio = {
            pacienteId: 10,
            tipo: 'Hemograma',
            fecha: '2026-02-10',
            descripcion: 'Control',
        }

        it('hace POST /estudios con FormData sin archivo', async () => {
            const creado = { ...estudioBase, id: 2 }
            mockedApi.post.mockResolvedValue(response(creado))

            const resultado = await crearEstudio(datos)

            expect(resultado).toEqual(creado)
            expect(mockedApi.post).toHaveBeenCalledWith(
                '/estudios',
                expect.any(FormData),
            )

            const formData = mockedApi.post.mock.calls[0][1] as FormData
            expect(formData.get('pacienteId')).toBe('10')
            expect(formData.get('tipo')).toBe('Hemograma')
            expect(formData.get('fecha')).toBe('2026-02-10')
            expect(formData.get('descripcion')).toBe('Control')
            expect(formData.get('archivo')).toBeNull()
        })

        it('hace POST /estudios con FormData incluyendo el archivo', async () => {
            const archivo = new File(['contenido'], 'analisis.pdf', {
                type: 'application/pdf',
            })
            const creado = { ...estudioBase, id: 3, archivoURL: 'url.pdf' }
            mockedApi.post.mockResolvedValue(response(creado))

            await crearEstudio({ ...datos, archivo })

            expect(mockedApi.post).toHaveBeenCalledWith(
                '/estudios',
                expect.any(FormData),
            )
            const formData = mockedApi.post.mock.calls[0][1] as FormData
            expect(formData.get('archivo')).toBe(archivo)
            expect(formData.get('archivo')).toBeInstanceOf(File)
        })

        it('propaga el error si falla la creación', async () => {
            mockedApi.post.mockRejectedValue(new Error('Error al crear'))
            await expect(crearEstudio(datos)).rejects.toThrow('Error al crear')
        })
    })

    describe('actualizarArchivoEstudio', () => {
        it('hace PUT /estudios/:id/archivo con FormData solo con el archivo', async () => {
            const archivo = new File(['contenido'], 'nuevo.pdf', {
                type: 'application/pdf',
            })
            const actualizado = { ...estudioBase, archivoURL: 'url.pdf' }
            mockedApi.put.mockResolvedValue(response(actualizado))

            const resultado = await actualizarArchivoEstudio(1, archivo)

            expect(resultado).toEqual(actualizado)
            expect(mockedApi.put).toHaveBeenCalledWith(
                '/estudios/1/archivo',
                expect.any(FormData),
            )

            const formData = mockedApi.put.mock.calls[0][1] as FormData
            expect(formData.get('archivo')).toBe(archivo)
            // No debe enviar otros campos del estudio
            expect(formData.get('pacienteId')).toBeNull()
            expect(formData.get('tipo')).toBeNull()
        })

        it('propaga el error si falla la actualización', async () => {
            mockedApi.put.mockRejectedValue(new Error('Error al actualizar'))
            await expect(
                actualizarArchivoEstudio(
                    1,
                    new File(['x'], 'a.pdf', { type: 'application/pdf' }),
                ),
            ).rejects.toThrow('Error al actualizar')
        })
    })

    describe('obtenerUrlArchivo', () => {
        it('hace GET /estudios/:id/archivo y devuelve la URL de descarga', async () => {
            const data: RespuestaArchivo = {
                url: 'https://archivos.test.com/estudios/1/download',
                expiresIn: 3600,
            }
            mockedApi.get.mockResolvedValue(response(data))

            const resultado = await obtenerUrlArchivo(1)

            expect(resultado).toEqual(data)
            expect(mockedApi.get).toHaveBeenCalledWith('/estudios/1/archivo')
        })

        it('propaga el error si falla la obtención de la URL', async () => {
            mockedApi.get.mockRejectedValue(new Error('Sin archivo'))
            await expect(obtenerUrlArchivo(1)).rejects.toThrow('Sin archivo')
        })
    })
})
