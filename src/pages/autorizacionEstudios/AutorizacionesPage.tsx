import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { obtenerUsuarioGuardado } from '../../services/authService'
import {
    listarAutorizaciones,
    revocarAutorizacion,
} from '../../services/autorizacionEstudioService'
import {
    listarEstudios,
    listarEstudiosPaciente,
} from '../../services/estudioService'
import { obtenerMiPerfil } from '../../services/pacienteService'
import type { AutorizacionEstudio, Estudio } from '../../types/estudio'
import { obtenerMensajeError } from '../../utils/errores'

const ELEMENTOS_POR_PAGINA = 10

export function AutorizacionesPage() {
    const [autorizaciones, setAutorizaciones] = useState<AutorizacionEstudio[]>(
        [],
    )
    const [estudios, setEstudios] = useState<Pick<Estudio, 'id' | 'tipo'>[]>([])
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(true)
    const [busqueda, setBusqueda] = useState('')
    const [paginaActual, setPaginaActual] = useState(1)
    const [revocando, setRevocando] = useState<number | null>(null)

    const usuario = obtenerUsuarioGuardado()
    const rol = usuario?.rol

    const esAdmin = rol === 'ADMIN'
    const esProfesional = rol === 'PROFESIONAL'
    const esPaciente = rol === 'PACIENTE'

    useEffect(() => {
        async function cargar() {
            setCargando(true)
            setError('')
            try {
                if (!rol) return

                const [listaAutorizaciones, listaEstudios] = await Promise.all([
                    listarAutorizaciones(),
                    esPaciente
                        ? obtenerMiPerfil().then((perfil) =>
                              listarEstudiosPaciente(perfil.id),
                          )
                        : listarEstudios(),
                ])

                setAutorizaciones(listaAutorizaciones)
                setEstudios(
                    listaEstudios.map((e) => ({ id: e.id, tipo: e.tipo })),
                )
            } catch (err) {
                setError(
                    obtenerMensajeError(
                        err,
                        'No se pudieron cargar las autorizaciones.',
                    ),
                )
            } finally {
                setCargando(false)
            }
        }

        cargar()
    }, [rol, esPaciente])

    const estudioPorId = useMemo(() => {
        const mapa = new Map<number, string>()
        for (const e of estudios) {
            mapa.set(e.id, e.tipo)
        }
        return mapa
    }, [estudios])

    const termino = busqueda.trim().toLowerCase()

    const autorizacionesFiltradas = useMemo(() => {
        if (!termino) return autorizaciones
        return autorizaciones.filter((a) => {
            const id = String(a.id)
            const estudio = estudioPorId.get(a.estudioId)?.toLowerCase() ?? ''
            const prof = a.profesional
                ? `${a.profesional.nombre} ${a.profesional.apellido}`.toLowerCase()
                : ''
            return (
                id.includes(termino) ||
                estudio.includes(termino) ||
                prof.includes(termino) ||
                a.estado.toLowerCase().includes(termino)
            )
        })
    }, [autorizaciones, termino, estudioPorId])

    const totalPaginas = Math.max(
        1,
        Math.ceil(autorizacionesFiltradas.length / ELEMENTOS_POR_PAGINA),
    )
    const paginaSegura = Math.min(paginaActual, totalPaginas)
    const autorizacionesPaginadas = useMemo(() => {
        const inicio = (paginaSegura - 1) * ELEMENTOS_POR_PAGINA
        return autorizacionesFiltradas.slice(
            inicio,
            inicio + ELEMENTOS_POR_PAGINA,
        )
    }, [autorizacionesFiltradas, paginaSegura])

    const manejarRevocar = async (id: number) => {
        if (!window.confirm('¿Estás seguro de revocar esta autorización?'))
            return
        setRevocando(id)
        try {
            await revocarAutorizacion(id)
            setAutorizaciones((prev) =>
                prev.map((a) =>
                    a.id === id ? { ...a, estado: 'VENCIDO' } : a,
                ),
            )
        } catch (err) {
            setError(
                obtenerMensajeError(err, 'No se pudo revocar la autorización.'),
            )
        } finally {
            setRevocando(null)
        }
    }

    if (cargando) return <p>Cargando autorizaciones...</p>

    return (
        <main>
            <h1>Autorizaciones de Estudio</h1>

            {(esAdmin || esProfesional || esPaciente) && (
                <p>
                    <Link to="/autorizaciones/nuevo">Nueva autorización</Link>
                </p>
            )}

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            {!cargando && autorizaciones.length > 0 && (
                <div style={{ marginTop: '16px', marginBottom: '12px' }}>
                    <input
                        type="search"
                        placeholder="Buscar por ID, estudio, profesional o estado..."
                        value={busqueda}
                        onChange={(e) => {
                            setBusqueda(e.target.value)
                            setPaginaActual(1)
                        }}
                    />
                </div>
            )}

            {autorizaciones.length === 0 ? (
                <p>No hay autorizaciones registradas.</p>
            ) : autorizacionesFiltradas.length === 0 ? (
                <p>No se encontraron autorizaciones con ese criterio.</p>
            ) : (
                <>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Estudio</th>
                                {!esPaciente && <th>Profesional</th>}
                                <th>Fecha Autorización</th>
                                <th>Fecha Vencimiento</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {autorizacionesPaginadas.map((a) => (
                                <tr key={a.id}>
                                    <td>{a.id}</td>
                                    <td>
                                        {estudioPorId.get(a.estudioId) ??
                                            `#${a.estudioId}`}
                                    </td>
                                    {!esPaciente && (
                                        <td>
                                            {a.profesional ? (
                                                <>
                                                    {a.profesional.nombre}{' '}
                                                    {a.profesional.apellido}
                                                    <br />
                                                    <small>
                                                        {
                                                            a.profesional
                                                                .especialidad
                                                        }
                                                    </small>
                                                </>
                                            ) : (
                                                `#${a.profesionalId}`
                                            )}
                                        </td>
                                    )}
                                    <td>{a.fechaAutorizacion}</td>
                                    <td>{a.fechaVencimiento}</td>
                                    <td>
                                        <span
                                            className={
                                                a.estado === 'DISPONIBLE'
                                                    ? 'estado-disponible'
                                                    : 'estado-vencido'
                                            }
                                        >
                                            {a.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="acciones">
                                            <Link
                                                to={`/autorizaciones/${a.id}`}
                                            >
                                                Ver
                                            </Link>
                                            {(esAdmin ||
                                                esProfesional ||
                                                esPaciente) &&
                                                a.estado === 'DISPONIBLE' && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            manejarRevocar(a.id)
                                                        }
                                                        disabled={
                                                            revocando === a.id
                                                        }
                                                    >
                                                        {revocando === a.id
                                                            ? 'Revocando...'
                                                            : 'Revocar'}
                                                    </button>
                                                )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            marginTop: '16px',
                            flexWrap: 'wrap',
                        }}
                    >
                        <p>
                            Mostrando{' '}
                            {(paginaSegura - 1) * ELEMENTOS_POR_PAGINA + 1} -{' '}
                            {Math.min(
                                paginaSegura * ELEMENTOS_POR_PAGINA,
                                autorizacionesFiltradas.length,
                            )}{' '}
                            de {autorizacionesFiltradas.length} resultados
                        </p>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setPaginaActual((p) => Math.max(1, p - 1))
                                }
                                disabled={paginaSegura <= 1}
                            >
                                Anterior
                            </button>
                            <span>
                                Página {paginaSegura} de {totalPaginas}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setPaginaActual((p) =>
                                        Math.min(totalPaginas, p + 1),
                                    )
                                }
                                disabled={paginaSegura >= totalPaginas}
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </>
            )}
        </main>
    )
}
