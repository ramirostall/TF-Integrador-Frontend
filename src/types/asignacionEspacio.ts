import type { DiaSemana } from './agenda'
import type { TipoAsignacion } from './espacio'

export interface ProfesionalAsignacion {
    id: number
    nombre: string
    apellido: string
}

export interface EspacioAsignacion {
    id: number
    nombre: string
    tipo: string
    ubicacion: string
}

export interface AsignacionEspacio {
    id: number
    profesionalId: number
    espacioId: number
    tipo: TipoAsignacion
    diaSemana: DiaSemana | null
    fecha: string | null
    horaInicio: string
    horaFin: string
    createdAt: string
    updatedAt: string
    profesional: ProfesionalAsignacion
    espacio: EspacioAsignacion
}

export interface CrearAsignacionEspacio {
    profesionalId: number
    espacioId: number
    tipo: TipoAsignacion
    diaSemana?: DiaSemana
    fecha?: string
    horaInicio: string
    horaFin: string
}

export interface ActualizarAsignacionEspacio {
    profesionalId: number
    espacioId: number
    tipo: TipoAsignacion
    diaSemana?: DiaSemana | null
    fecha?: string | null
    horaInicio: string
    horaFin: string
}

export interface FiltrosAsignacionEspacio {
    espacioId?: number
    profesionalId?: number
    tipo?: TipoAsignacion
}
