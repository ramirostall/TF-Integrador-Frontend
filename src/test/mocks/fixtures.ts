import type { Agenda } from '../../types/agenda'
import type { Paciente } from '../../types/paciente'
import type { Espacio } from '../../types/espacio'
import type { Profesional } from '../../types/profesional'
import type { HorarioLibre, Turno } from '../../types/turno'
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

export const espaciosFixture: Espacio[] = [
    {
        id: 1,
        nombre: 'Gimnasio Adelante',
        tipo: 'GIMNASIO',
        ubicacion: 'ADELANTE',
        activo: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
    },
    {
        id: 2,
        nombre: 'Consultorio Atras',
        tipo: 'CONSULTORIO',
        ubicacion: 'ATRAS',
        activo: false,
        createdAt: '2026-01-02T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
    },
]

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

// Vista completa (ADMIN). usuarioId 2 (pro@test.com) queda sin perfil a
// propósito, para el select de CrearProfesionalPage.
export const profesionalesFixture: Profesional[] = [
    {
        id: 1,
        usuarioId: 20,
        nombre: 'Ana',
        apellido: 'Lopez',
        dni: '30111222',
        telefono: '1144445555',
        matricula: 'MP-1234',
        especialidad: 'Kinesiologia',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        usuario: {
            id: 20,
            email: 'ana.lopez@test.com',
            rol: 'PROFESIONAL',
            activo: true,
        },
    },
    {
        id: 2,
        usuarioId: 21,
        nombre: 'Carlos',
        apellido: 'Ruiz',
        dni: '28999888',
        telefono: '1166667777',
        matricula: 'MP-5678',
        especialidad: 'Cardiologia',
        createdAt: '2026-01-02T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
        usuario: {
            id: 21,
            email: 'carlos.ruiz@test.com',
            rol: 'PROFESIONAL',
            activo: true,
        },
    },
]

// Vista reducida que reciben PACIENTE y PROFESIONAL.
export const profesionalesResumenFixture: Profesional[] =
    profesionalesFixture.map(({ id, nombre, apellido, especialidad }) => ({
        id,
        nombre,
        apellido,
        especialidad,
    }))

export const turnosFixture: Turno[] = [
    {
        id: 1,
        pacienteId: 10,
        profesionalId: 1,
        agendaId: 1,
        fecha: '2030-01-07',
        hora: '09:00:00',
        estado: 'PENDIENTE',
        motivo: 'Dolor de espalda',
        observaciones: 'Traer resonancia',
        paciente: pacientesFixture[0],
        profesional: profesionalesResumenFixture[0],
    },
    {
        id: 2,
        pacienteId: 11,
        profesionalId: 2,
        agendaId: 3,
        fecha: '2030-01-08',
        hora: '15:30:00',
        estado: 'COMPLETADO',
        motivo: 'Control anual',
        observaciones: null,
        paciente: pacientesFixture[1],
        profesional: profesionalesResumenFixture[1],
    },
]

export const horariosLibresFixture: HorarioLibre[] = [
    { agendaId: 1, hora: '09:30' },
    { agendaId: 1, hora: '10:00' },
]
