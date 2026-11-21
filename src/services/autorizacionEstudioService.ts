import { api } from './api'
import type {
    AutorizacionEstudio,
    CrearAutorizacionEstudio,
    VigenciaAutorizacion,
} from '../types/estudio'

export async function listarAutorizaciones(): Promise<AutorizacionEstudio[]> {
    const respuesta = await api.get<AutorizacionEstudio[]>(
        '/autorizaciones-estudio',
    )
    return respuesta.data
}

export async function obtenerAutorizacionPorId(
    id: number,
): Promise<AutorizacionEstudio> {
    const respuesta = await api.get<AutorizacionEstudio>(
        `/autorizaciones-estudio/${id}`,
    )
    return respuesta.data
}

export async function verificarVigencia(
    id: number,
): Promise<VigenciaAutorizacion> {
    const respuesta = await api.get<VigenciaAutorizacion>(
        `/autorizaciones-estudio/${id}/vigencia`,
    )
    return respuesta.data
}

export async function crearAutorizacion(
    datos: CrearAutorizacionEstudio,
): Promise<AutorizacionEstudio> {
    const respuesta = await api.post<AutorizacionEstudio>(
        '/autorizaciones-estudio',
        datos,
    )
    return respuesta.data
}

export async function revocarAutorizacion(
    id: number,
): Promise<AutorizacionEstudio> {
    const respuesta = await api.patch<AutorizacionEstudio>(
        `/autorizaciones-estudio/${id}/revocar`,
    )
    return respuesta.data
}
