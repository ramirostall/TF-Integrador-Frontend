export type DiaSemana =
    | 'LUNES'
    | 'MARTES'
    | 'MIERCOLES'
    | 'JUEVES'
    | 'VIERNES'
    | 'SABADO'
    | 'DOMINGO'

export interface ProfesionalAgenda {
    id: number
    nombre: string
    apellido: string
    matricula: string
    especialidad: string
}

export interface Agenda {
    id: number
    profesionalId: number
    diaSemana: DiaSemana
    horaInicio: string
    horaFin: string
    duracionTurno: number
    activo: boolean
    createdAt: string
    updatedAt: string
    profesional: ProfesionalAgenda
}

export interface CrearAgenda {
    profesionalId: number
    diaSemana: DiaSemana
    horaInicio: string
    horaFin: string
    duracionTurno: number
}

export interface ActualizarAgenda {
    diaSemana?: DiaSemana
    horaInicio?: string
    horaFin?: string
    duracionTurno?: number
    cancelarTurnosAfectados?: boolean
}

export interface FiltrosAgenda {
    profesionalId?: number
    activo?: boolean
}
