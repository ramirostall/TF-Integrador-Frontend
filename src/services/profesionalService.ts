import { api } from './api'

export interface ProfesionalOpcion {
    id: number
    nombre: string
    apellido: string
    especialidad: string
}

export async function listarProfesionales(): Promise<ProfesionalOpcion[]> {
    const respuesta = await api.get<ProfesionalOpcion[]>('/profesionales')
    return respuesta.data
}
