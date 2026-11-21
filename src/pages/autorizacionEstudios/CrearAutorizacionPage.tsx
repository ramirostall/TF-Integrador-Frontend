import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { obtenerUsuarioGuardado } from '../../services/authService'
import {
    listarEstudios,
    listarEstudiosPaciente,
} from '../../services/estudioService'
import { crearAutorizacion } from '../../services/autorizacionEstudioService'
import { obtenerMiPerfil } from '../../services/pacienteService'
import { listarProfesionales } from '../../services/profesionalService'
import type { ProfesionalOpcion } from '../../services/profesionalService'
import type { Estudio } from '../../types/estudio'
import { obtenerMensajeError } from '../../utils/errores'

export function CrearAutorizacionPage() {
    const [estudios, setEstudios] = useState<Estudio[]>([])
    const [profesionales, setProfesionales] = useState<ProfesionalOpcion[]>([])
    const [cargandoInicial, setCargandoInicial] = useState(true)
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState('')

    const [estudioId, setEstudioId] = useState<number | null>(null)
    const [profesionalId, setProfesionalId] = useState<number | null>(null)
    const [fechaAutorizacion, setFechaAutorizacion] = useState('')
    const [fechaVencimiento, setFechaVencimiento] = useState('')

    const navigate = useNavigate()

    const usuario = obtenerUsuarioGuardado()
    const rol = usuario?.rol
    const esPaciente = rol === 'PACIENTE'
    const puedeCrear = rol === 'ADMIN' || rol === 'PROFESIONAL' || esPaciente

    useEffect(() => {
        async function cargarDatos() {
            try {
                const [listaEstudios, listaProfesionales] = await Promise.all([
                    esPaciente
                        ? obtenerMiPerfil().then((perfil) =>
                              listarEstudiosPaciente(perfil.id),
                          )
                        : listarEstudios(),
                    listarProfesionales(),
                ])

                setEstudios(listaEstudios)
                setProfesionales(listaProfesionales)
            } catch (err) {
                setError(
                    obtenerMensajeError(
                        err,
                        'No se pudieron cargar los estudios ni los profesionales.',
                    ),
                )
            } finally {
                setCargandoInicial(false)
            }
        }

        cargarDatos()
    }, [esPaciente])

    const manejarSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError('')

        if (!puedeCrear) {
            setError('No tienes permiso para crear autorizaciones.')
            return
        }

        if (
            !estudioId ||
            !profesionalId ||
            !fechaAutorizacion ||
            !fechaVencimiento
        ) {
            setError('Todos los campos son obligatorios.')
            return
        }

        if (fechaVencimiento < fechaAutorizacion) {
            setError(
                'La fecha de vencimiento no puede ser anterior a la de autorización.',
            )
            return
        }

        try {
            setCargando(true)

            const autorizacion = await crearAutorizacion({
                estudioId,
                profesionalId,
                fechaAutorizacion,
                fechaVencimiento,
            })

            navigate(`/autorizaciones/${autorizacion.id}`)
        } catch (err) {
            setError(
                obtenerMensajeError(err, 'No se pudo crear la autorización.'),
            )
        } finally {
            setCargando(false)
        }
    }

    if (cargandoInicial) {
        return <p>Cargando estudios y profesionales...</p>
    }

    return (
        <main>
            <h1>Nueva Autorización de Estudio</h1>

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            {!puedeCrear && (
                <p>No tienes permisos para crear autorizaciones.</p>
            )}

            <form onSubmit={manejarSubmit}>
                <div>
                    <label htmlFor="estudioId">Estudio</label>

                    <select
                        id="estudioId"
                        required
                        disabled={!puedeCrear}
                        value={estudioId ?? ''}
                        onChange={(e) =>
                            setEstudioId(Number(e.target.value) || null)
                        }
                    >
                        <option value="">Seleccionar estudio</option>

                        {estudios.map((estudio) => (
                            <option key={estudio.id} value={estudio.id}>
                                #{estudio.id} - {estudio.tipo}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="profesionalId">Profesional</label>

                    <select
                        id="profesionalId"
                        required
                        disabled={!puedeCrear}
                        value={profesionalId ?? ''}
                        onChange={(e) =>
                            setProfesionalId(Number(e.target.value) || null)
                        }
                    >
                        <option value="">Seleccionar profesional</option>

                        {profesionales.map((profesional) => (
                            <option key={profesional.id} value={profesional.id}>
                                {profesional.apellido}, {profesional.nombre} -
                                {profesional.especialidad}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="fechaAutorizacion">
                        Fecha de Autorización
                    </label>

                    <input
                        id="fechaAutorizacion"
                        type="date"
                        required
                        disabled={!puedeCrear}
                        value={fechaAutorizacion}
                        onChange={(e) => setFechaAutorizacion(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="fechaVencimiento">
                        Fecha de Vencimiento
                    </label>

                    <input
                        id="fechaVencimiento"
                        type="date"
                        required
                        disabled={!puedeCrear}
                        min={fechaAutorizacion || undefined}
                        value={fechaVencimiento}
                        onChange={(e) => setFechaVencimiento(e.target.value)}
                    />
                </div>

                <button type="submit" disabled={cargando || !puedeCrear}>
                    {cargando ? 'Creando...' : 'Crear autorización'}
                </button>

                <button
                    type="button"
                    onClick={() => navigate('/autorizaciones')}
                >
                    Cancelar
                </button>
            </form>

            <p style={{ marginTop: '16px' }}>
                <Link to="/autorizaciones">Volver al listado</Link>
            </p>
        </main>
    )
}
