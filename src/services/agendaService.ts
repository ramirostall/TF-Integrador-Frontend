import { api } from './api'
import type {
    ActualizarAgenda,
    Agenda,
    CrearAgenda,
    FiltrosAgenda,
} from '../types/agenda'

export async function listarAgendas(
    filtros?: FiltrosAgenda,
): Promise<Agenda[]> {
    const respuesta = await api.get<Agenda[]>('/agendas', {
        params: filtros,
    })
    return respuesta.data
}

export async function listarAgendasPorProfesional(
    profesionalId: number,
): Promise<Agenda[]> {
    const respuesta = await api.get<Agenda[]>(
        `/agendas/profesional/${profesionalId}`,
    )
    return respuesta.data
}

export async function obtenerAgendaPorId(id: number): Promise<Agenda> {
    const respuesta = await api.get<Agenda>(`/agendas/${id}`)
    return respuesta.data
}

export async function crearAgenda(datos: CrearAgenda): Promise<Agenda> {
    const respuesta = await api.post<Agenda>('/agendas', datos)
    return respuesta.data
}

export async function modificarAgenda(
    id: number,
    datos: ActualizarAgenda,
): Promise<Agenda> {
    const respuesta = await api.put<Agenda>(`/agendas/${id}`, datos)
    return respuesta.data
}

export async function desactivarAgenda(
    id: number,
    cancelarTurnosFuturos?: boolean,
): Promise<void> {
    await api.patch(
        `/agendas/${id}/desactivar`,
        cancelarTurnosFuturos === undefined
            ? undefined
            : { cancelarTurnosFuturos },
    )
}
