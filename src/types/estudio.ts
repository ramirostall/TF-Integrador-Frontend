export type EstadoAutorizacion = 'DISPONIBLE' | 'VENCIDO'

export interface PacienteEstudio {
    id: number
    nombre: string
    apellido: string
    dni: string
}

export interface ProfesionalEstudio {
    id: number
    nombre: string
    apellido: string
    especialidad: string
}

export interface AutorizacionEstudio {
    id: number
    estudioId: number
    profesionalId: number
    fechaAutorizacion: string
    fechaVencimiento: string
    estado: EstadoAutorizacion
    profesional?: ProfesionalEstudio
    estudio?: Pick<Estudio, 'id' | 'tipo'>
}

export interface Estudio {
    id: number
    pacienteId: number
    tipo: string
    fecha: string
    descripcion: string
    archivoURL: string | null
    createdAt?: string
    updatedAt?: string
    paciente?: PacienteEstudio
    autorizaciones?: AutorizacionEstudio[]
}

export interface CrearEstudio {
    pacienteId: number
    tipo: string
    fecha: string
    descripcion: string
    archivo?: File | null
}

export interface RespuestaArchivo {
    url: string
    expiresIn: number
}

export interface CrearAutorizacionEstudio {
    estudioId: number
    profesionalId: number
    fechaAutorizacion: string
    fechaVencimiento: string
}

export interface VigenciaAutorizacion {
    id: number
    estaVigente: boolean
    estaVencida: boolean
}
