import type { Agenda } from '../../types/agenda'
import type { Paciente } from '../../types/paciente'
import type { Usuario } from '../../types/usuario'

export const usuariosFixture: Usuario[] = [
    { id: 1, email: 'admin@test.com', rol: 'ADMIN', activo: true },
    { id: 2, email: 'pro@test.com', rol: 'PROFESIONAL', activo: true },
    { id: 3, email: 'paciente@test.com', rol: 'PACIENTE', activo: false },
]

export const pacientesFixture: Paciente[] = [
    {
        id: 10,
        usuarioId: 3,
        nombre: 'Ana',
        apellido: 'Pérez',
        dni: '12345678',
        telefono: '123456789',
        fechaNacimiento: '1990-01-01',
        direccion: 'Calle 1',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        usuario: {
            id: 3,
            email: 'ana@test.com',
            rol: 'PACIENTE',
            activo: true,
        },
    },
    {
        id: 11,
        usuarioId: 4,
        nombre: 'Juan',
        apellido: 'Gómez',
        dni: '87654321',
        telefono: '987654321',
        fechaNacimiento: '1985-05-10',
        direccion: 'Calle 2',
        createdAt: '2026-01-02T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
        usuario: {
            id: 4,
            email: 'juan@test.com',
            rol: 'PACIENTE',
            activo: true,
        },
    },
]

const profesionalAgendaFixture = {
    id: 1,
    nombre: 'Ana',
    apellido: 'Lopez',
    matricula: 'MP-1234',
    especialidad: 'Kinesiologia',
}

export const agendasFixture: Agenda[] = [
    {
        id: 1,
        profesionalId: 1,
        diaSemana: 'LUNES',
        horaInicio: '09:00:00',
        horaFin: '13:00:00',
        duracionTurno: 30,
        activo: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        profesional: profesionalAgendaFixture,
    },
    {
        id: 2,
        profesionalId: 1,
        diaSemana: 'MIERCOLES',
        horaInicio: '14:00:00',
        horaFin: '18:00:00',
        duracionTurno: 45,
        activo: false,
        createdAt: '2026-01-02T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
        profesional: profesionalAgendaFixture,
    },
]
