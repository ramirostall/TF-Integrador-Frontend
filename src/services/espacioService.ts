import { api } from './api'
import type {
    ActualizarEspacio,
    CrearEspacio,
    Espacio,
    EspacioOcupacion,
    FiltrosEspacio,
} from '../types/espacio'

export async function listarEspacios(
    filtros?: FiltrosEspacio,
): Promise<Espacio[]> {
    const respuesta = await api.get<Espacio[]>('/espacios', {
        params: filtros,
    })
    return respuesta.data
}

export async function obtenerEspacioPorId(id: number): Promise<Espacio> {
    const respuesta = await api.get<Espacio>(`/espacios/${id}`)
    return respuesta.data
}

export async function crearEspacio(datos: CrearEspacio): Promise<Espacio> {
    const respuesta = await api.post<Espacio>('/espacios', datos)
    return respuesta.data
}

export async function modificarEspacio(
    id: number,
    datos: ActualizarEspacio,
): Promise<Espacio> {
    const respuesta = await api.put<Espacio>(`/espacios/${id}`, datos)
    return respuesta.data
}

export async function desactivarEspacio(id: number): Promise<Espacio> {
    const respuesta = await api.patch<Espacio>(`/espacios/${id}/desactivar`)
    return respuesta.data
}

export async function reactivarEspacio(id: number): Promise<Espacio> {
    const respuesta = await api.patch<Espacio>(`/espacios/${id}/reactivar`)
    return respuesta.data
}

export async function eliminarEspacio(id: number): Promise<void> {
    await api.delete(`/espacios/${id}`)
}

export async function obtenerOcupacion(
    start: string,
    end: string,
): Promise<EspacioOcupacion[]> {
    const respuesta = await api.get<{ data: EspacioOcupacion[] }>(
        '/espacios/ocupacion',
        { params: { start, end } },
    )
    return respuesta.data.data
}
