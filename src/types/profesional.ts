export interface Profesional {
    id: number
    nombre: string
    apellido: string
    dni: string
    telefono: string
    email: string
    especialidad: string
    matricula: string
    activo: boolean
    createdAt?: string
    updatedAt?: string
}

export interface CrearProfesional {
    nombre: string
    apellido: string
    dni: string
    telefono: string
    email: string
    password: string
    especialidad: string
    matricula: string
    activo?: boolean
}

export interface ActualizarProfesional {
    nombre?: string
    apellido?: string
    dni?: string
    telefono?: string
    email?: string
    especialidad?: string
    matricula?: string
    activo?: boolean
}
