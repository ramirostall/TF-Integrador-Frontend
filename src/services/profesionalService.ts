import { api } from './api'
import type {
    Profesional,
    ProfesionalResumen,
    CrearProfesional,
    ActualizarProfesional,
} from '../types/profesional'

// Alias que usan los selects de Agendas y Autorizaciones.
export type ProfesionalOpcion = ProfesionalResumen

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
    const respuesta = await api.put<Profesional>(`/profesionales/${id}`, datos)
    return respuesta.data
}
