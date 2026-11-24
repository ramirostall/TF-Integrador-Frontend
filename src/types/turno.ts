export type EstadoTurno =
    'PENDIENTE' | 'CONFIRMADO' | 'CANCELADO' | 'COMPLETADO'

export interface Turno {
    id: number
    profesionalId: number
    pacienteId: number
    agendaId: number
    fecha: string
    hora: string
    duracion: number
    estado: EstadoTurno
    notas?: string
    createdAt?: string
    updatedAt?: string
}

export interface CrearTurno {
    profesionalId: number
    pacienteId: number
    agendaId: number
    fecha: string
    hora: string
    duracion: number
    notas?: string
}

export interface ActualizarTurno {
    fecha?: string
    hora?: string
    duracion?: number
    estado?: EstadoTurno
    notas?: string
}

export interface FiltrosTurnos {
    profesionalId?: number
    pacienteId?: number
    fecha?: string
    estado?: EstadoTurno
}
