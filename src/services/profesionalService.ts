import { api } from './api'
import type {
    Profesional,
    CrearProfesional,
    ActualizarProfesional,
} from '../types/profesional'

export interface ProfesionalOpcion {
    id: number
    nombre: string
    apellido: string
    especialidad: string
}

export async function listarProfesionales(): Promise<Profesional[]> {
    const respuesta = await api.get<Profesional[]>('/profesionales')
    return respuesta.data
}

export async function obtenerProfesionalPorId(
    id: number,
): Promise<Profesional> {
    const respuesta = await api.get<Profesional>(`/profesionales/${id}`)
    return respuesta.data
}

export async function crearProfesional(
    datos: CrearProfesional,
): Promise<Profesional> {
    const respuesta = await api.post<Profesional>('/profesionales', datos)
    return respuesta.data
}

export async function modificarProfesional(
    id: number,
    datos: ActualizarProfesional,
): Promise<Profesional> {
    const respuesta = await api.put<Profesional>(
        `/profesionales/${id}`,
        datos,
    )
    return respuesta.data
}

export async function desactivarProfesional(id: number): Promise<void> {
    await api.patch(`/profesionales/${id}/desactivar`)
}

export async function activarProfesional(id: number): Promise<Profesional> {
    const respuesta = await api.patch<Profesional>(
        `/profesionales/${id}/activar`,
    )
    return respuesta.data
}
