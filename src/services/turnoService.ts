import { api } from './api'
import type {
    Turno,
    CrearTurno,
    ActualizarTurno,
    FiltrosTurnos,
    HorarioLibre,
} from '../types/turno'

export async function listarTurnos(filtros?: FiltrosTurnos): Promise<Turno[]> {
    const respuesta = await api.get<Turno[]>('/turnos', {
        params: filtros,
    })
    return respuesta.data
}

export async function obtenerTurnoPorId(id: number): Promise<Turno> {
    const respuesta = await api.get<Turno>(`/turnos/${id}`)
    return respuesta.data
}

export async function obtenerHorariosLibres(
    profesionalId: number,
    fecha: string,
): Promise<HorarioLibre[]> {
    const respuesta = await api.get<HorarioLibre[]>('/turnos/horarios-libres', {
        params: { profesionalId, fecha },
    })
    return respuesta.data
}

export async function crearTurno(datos: CrearTurno): Promise<Turno> {
    const respuesta = await api.post<Turno>('/turnos', datos)
    return respuesta.data
}

export async function modificarTurno(
    id: number,
    datos: ActualizarTurno,
): Promise<Turno> {
    const respuesta = await api.put<Turno>(`/turnos/${id}`, datos)
    return respuesta.data
}

export async function cancelarTurno(id: number): Promise<Turno> {
    const respuesta = await api.delete<Turno>(`/turnos/${id}`)
    return respuesta.data
}
