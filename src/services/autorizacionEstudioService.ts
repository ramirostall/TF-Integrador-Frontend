import { api } from './api'
import type {
    AutorizacionEstudio,
    CrearAutorizacionEstudio,
    VigenciaAutorizacion,
} from '../types/estudio'

export async function listarAutorizaciones(): Promise<AutorizacionEstudio[]> {
    const respuesta = await api.get<AutorizacionEstudio[]>(
        '/autorizacionestudios',
    )
    return respuesta.data
}

export async function obtenerAutorizacionPorId(
    id: number,
): Promise<AutorizacionEstudio> {
    const respuesta = await api.get<AutorizacionEstudio>(
        `/autorizacionestudios/${id}`,
    )
    return respuesta.data
}

export async function verificarVigencia(
    id: number,
): Promise<VigenciaAutorizacion> {
    const respuesta = await api.get<VigenciaAutorizacion>(
        `/autorizacionestudios/${id}/vigencia`,
    )
    return respuesta.data
}

export async function crearAutorizacion(
    datos: CrearAutorizacionEstudio,
): Promise<AutorizacionEstudio> {
    const respuesta = await api.post<AutorizacionEstudio>(
        '/autorizacionestudios',
        datos,
    )
    return respuesta.data
}

export async function revocarAutorizacion(
    id: number,
): Promise<AutorizacionEstudio> {
    const respuesta = await api.patch<AutorizacionEstudio>(
        `/autorizacionestudios/${id}/revocar`,
    )
    return respuesta.data
}
