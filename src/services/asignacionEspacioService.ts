import { api } from './api'
import type {
    ActualizarAsignacionEspacio,
    AsignacionEspacio,
    CrearAsignacionEspacio,
    FiltrosAsignacionEspacio,
} from '../types/asignacionEspacio'

export async function listarAsignacionesEspacio(
    filtros?: FiltrosAsignacionEspacio,
): Promise<AsignacionEspacio[]> {
    const respuesta = await api.get<AsignacionEspacio[]>(
        '/asignaciones-espacio',
        { params: filtros },
    )
    return respuesta.data
}

export async function obtenerAsignacionEspacioPorId(
    id: number,
): Promise<AsignacionEspacio> {
    const respuesta = await api.get<AsignacionEspacio>(
        `/asignaciones-espacio/${id}`,
    )
    return respuesta.data
}

export async function crearAsignacionEspacio(
    datos: CrearAsignacionEspacio,
): Promise<AsignacionEspacio> {
    const respuesta = await api.post<AsignacionEspacio>(
        '/asignaciones-espacio',
        datos,
    )
    return respuesta.data
}

export async function modificarAsignacionEspacio(
    id: number,
    datos: ActualizarAsignacionEspacio,
): Promise<AsignacionEspacio> {
    const respuesta = await api.put<AsignacionEspacio>(
        `/asignaciones-espacio/${id}`,
        datos,
    )
    return respuesta.data
}

export async function eliminarAsignacionEspacio(id: number): Promise<void> {
    await api.delete(`/asignaciones-espacio/${id}`)
}
