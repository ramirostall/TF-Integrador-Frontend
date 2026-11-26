import type { Usuario } from './usuario'

// Lo que recibe cualquier rol: PACIENTE y PROFESIONAL solo ven estos campos
// de los perfiles ajenos.
export interface ProfesionalResumen {
    id: number
    nombre: string
    apellido: string
    especialidad: string
}

// ADMIN (y el profesional dueño del perfil) reciben además los datos
// sensibles; por eso son opcionales.
export interface Profesional extends ProfesionalResumen {
    usuarioId?: number
    dni?: string
    telefono?: string
    matricula?: string
    createdAt?: string
    updatedAt?: string
    usuario?: Usuario
}

export interface CrearProfesional {
    usuarioId: number
    nombre: string
    apellido: string
    dni: string
    telefono: string
    matricula: string
    especialidad: string
}

export interface ActualizarProfesional {
    nombre?: string
    apellido?: string
    dni?: string
    telefono?: string
    matricula?: string
    especialidad?: string
}
