import type { DiaSemana } from './agenda'

export type TipoEspacio = 'GIMNASIO' | 'CONSULTORIO'
export type UbicacionEspacio = 'ADELANTE' | 'ATRAS'
export type TipoAsignacion = 'FIJA' | 'ESPECIFICA'

export interface Espacio {
    id: number
    nombre: string
    tipo: TipoEspacio
    ubicacion: UbicacionEspacio
    activo: boolean
    createdAt: string
    updatedAt: string
}

export interface CrearEspacio {
    nombre: string
    tipo: TipoEspacio
    ubicacion: UbicacionEspacio
}

export interface ActualizarEspacio {
    nombre?: string
    tipo?: TipoEspacio
    ubicacion?: UbicacionEspacio
}

export interface FiltrosEspacio {
    activo?: boolean
    tipo?: TipoEspacio
    ubicacion?: UbicacionEspacio
}

export interface ProfesionalResumido {
    id: number
    nombre: string
    apellido: string
}

export interface AsignacionOcupacion {
    id: number
    tipo: TipoAsignacion
    diaSemana: DiaSemana | null
    fecha: string | null
    horaInicio: string
    horaFin: string
    profesional: ProfesionalResumido
}

export interface EspacioOcupacion {
    id: number
    nombre: string
    tipo: TipoEspacio
    ubicacion: UbicacionEspacio
    activo: boolean
    asignaciones: AsignacionOcupacion[]
}
