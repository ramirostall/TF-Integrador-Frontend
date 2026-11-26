import type { Paciente } from './paciente'
import type { Profesional } from './profesional'

export type EstadoTurno =
    'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO' | 'COMPLETADO'

export const ESTADOS_TURNO: EstadoTurno[] = [
    'PENDIENTE',
    'CONFIRMADO',
    'CANCELADO',
    'COMPLETADO',
]

export const ESTADOS_CANCELABLES: EstadoTurno[] = ['PENDIENTE', 'CONFIRMADO']

export interface AgendaTurno {
    id: number
    profesionalId: number
    diaSemana: string
    horaInicio: string
    horaFin: string
    duracionTurno: number
    activo: boolean
}

export interface Turno {
    id: number
    pacienteId: number
    profesionalId: number
    agendaId: number
    fecha: string
    hora: string
    estado: EstadoTurno
    motivo: string
    observaciones?: string | null
    createdAt?: string
    updatedAt?: string
    paciente?: Paciente
    // Al PACIENTE le llega solo con id, nombre, apellido y especialidad.
    profesional?: Profesional
    agenda?: AgendaTurno
}

export interface CrearTurno {
    // Solo lo manda el ADMIN; para el PACIENTE sale del token.
    pacienteId?: number
    profesionalId: number
    agendaId: number
    fecha: string
    hora: string
    motivo: string
    observaciones?: string
}

export interface ActualizarTurno {
    fecha?: string
    hora?: string
    motivo?: string
    observaciones?: string
    estado?: EstadoTurno
}

export interface FiltrosTurnos {
    profesionalId?: number
    pacienteId?: number
    fecha?: string
    estado?: EstadoTurno
}

export interface HorarioLibre {
    agendaId: number
    hora: string
}
