import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { obtenerUsuarioGuardado } from '../../services/authService'
import {
    listarEstudios,
    listarEstudiosPaciente,
} from '../../services/estudioService'
import {
    listarPacientes,
    obtenerMiPerfil,
} from '../../services/pacienteService'
import type { Estudio } from '../../types/estudio'
import type { Paciente } from '../../types/paciente'
import { obtenerMensajeError } from '../../utils/errores'

const ELEMENTOS_POR_PAGINA = 10

export function EstudiosPage() {
    const [estudios, setEstudios] = useState<Estudio[]>([])
    const [pacientes, setPacientes] = useState<Paciente[]>([])
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(true)
    const [busqueda, setBusqueda] = useState('')
    const [paginaActual, setPaginaActual] = useState(1)

    const [searchParams, setSearchParams] = useSearchParams()

    const usuario = obtenerUsuarioGuardado()
    const rol = usuario?.rol

    const pacienteIdParam = searchParams.get('pacienteId')
    const pacienteIdFiltro =
        pacienteIdParam && !Number.isNaN(Number(pacienteIdParam))
            ? Number(pacienteIdParam)
            : null

    useEffect(() => {
        async function cargarEstudios() {
            setCargando(true)
            setError('')

            try {
                if (!rol) {
                    return
                }

                if (rol === 'PACIENTE') {
                    const perfil = await obtenerMiPerfil()
                    const datos = await listarEstudiosPaciente(perfil.id)
                    setEstudios(datos)
                    return
                }

                const datos = pacienteIdFiltro
                    ? await listarEstudiosPaciente(pacienteIdFiltro)
                    : await listarEstudios()

                setEstudios(datos)

                if (rol === 'ADMIN') {
                    const listaPacientes = await listarPacientes()
                    setPacientes(listaPacientes)
                }
            } catch (error) {
                setError(
                    obtenerMensajeError(
                        error,
                        'No se pudieron cargar los estudios.',
                    ),
                )
            } finally {
                setCargando(false)
            }
        }

        cargarEstudios()
    }, [rol, pacienteIdFiltro])

    const pacientesPorId = useMemo(() => {
        const mapa = new Map<number, string>()

        for (const paciente of pacientes) {
            mapa.set(paciente.id, `${paciente.apellido}, ${paciente.nombre}`)
        }

        return mapa
    }, [pacientes])

    const estudiosFiltrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase()

        if (!termino) {
            return estudios
        }

        return estudios.filter((estudio) => {
            const tipo = estudio.tipo?.toLowerCase() ?? ''
            const descripcion = estudio.descripcion?.toLowerCase() ?? ''
            const fecha = estudio.fecha?.toLowerCase() ?? ''
            const paciente =
                pacientesPorId.get(estudio.pacienteId)?.toLowerCase() ?? ''

            return (
                tipo.includes(termino) ||
                descripcion.includes(termino) ||
                fecha.includes(termino) ||
                paciente.includes(termino) ||
                String(estudio.id).includes(termino) ||
                String(estudio.pacienteId).includes(termino)
            )
        })
    }, [estudios, busqueda, pacientesPorId])

    const totalPaginas = Math.max(
        1,
        Math.ceil(estudiosFiltrados.length / ELEMENTOS_POR_PAGINA),
    )

    const paginaSegura = Math.min(paginaActual, totalPaginas)

    const estudiosPaginados = useMemo(() => {
        const inicio = (paginaSegura - 1) * ELEMENTOS_POR_PAGINA
        const fin = inicio + ELEMENTOS_POR_PAGINA

        return estudiosFiltrados.slice(inicio, fin)
    }, [estudiosFiltrados, paginaSegura])

    const esAdmin = rol === 'ADMIN'
    const esProfesional = rol === 'PROFESIONAL'
    const esPaciente = rol === 'PACIENTE'

    const nombrePacienteFiltro = pacienteIdFiltro
        ? pacientesPorId.get(pacienteIdFiltro)
        : null

    return (
        <main>
            <h1>Estudios</h1>

            {(esAdmin || esPaciente) && (
                <p>
                    <Link to="/estudios/nuevo">Crear estudio</Link>
                </p>
            )}

            {(esAdmin || esProfesional || esPaciente) && (
                <p>
                    <Link to="/autorizaciones">Gestionar autorizaciones</Link>
                </p>
            )}

            {esAdmin && pacienteIdFiltro && (
                <p>
                    Mostrando estudios del paciente{' '}
                    {nombrePacienteFiltro ?? `#${pacienteIdFiltro}`}.{' '}
                    <button type="button" onClick={() => setSearchParams({})}>
                        Quitar filtro
                    </button>
                </p>
            )}

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            {!cargando && estudios.length > 0 && (
                <div style={{ marginTop: '16px', marginBottom: '12px' }}>
                    <input
                        type="search"
                        placeholder={
                            esPaciente
                                ? 'Buscar por tipo, fecha o descripción...'
                                : 'Buscar por ID, paciente, tipo, fecha o descripción...'
                        }
                        value={busqueda}
                        onChange={(event) => {
                            setBusqueda(event.target.value)
                            setPaginaActual(1)
                        }}
                    />
                </div>
            )}

            {cargando ? (
                <p>Cargando estudios...</p>
            ) : estudios.length === 0 ? (
                <p>No hay estudios registrados.</p>
            ) : estudiosFiltrados.length === 0 ? (
                <p>No se encontraron estudios con ese criterio de búsqueda.</p>
            ) : (
                <>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                {!esPaciente && <th>Paciente</th>}
                                <th>Tipo</th>
                                <th>Fecha</th>
                                <th>Descripción</th>
                                <th>Archivo</th>
                                {esPaciente && <th>Autorizaciones</th>}
                                {(esAdmin || esProfesional || esPaciente) && (
                                    <th>Acciones</th>
                                )}
                            </tr>
                        </thead>

                        <tbody>
                            {estudiosPaginados.map((estudio) => (
                                <tr key={estudio.id}>
                                    <td>{estudio.id}</td>

                                    {!esPaciente && (
                                        <td>
                                            {pacientesPorId.get(
                                                estudio.pacienteId,
                                            ) ?? `#${estudio.pacienteId}`}
                                        </td>
                                    )}

                                    <td>{estudio.tipo}</td>
                                    <td>{estudio.fecha}</td>
                                    <td>{estudio.descripcion}</td>
                                    <td>{estudio.archivoURL ? 'Sí' : 'No'}</td>

                                    {esPaciente && (
                                        <td>
                                            {estudio.autorizaciones?.length ??
                                                0}
                                        </td>
                                    )}

                                    {(esAdmin ||
                                        esProfesional ||
                                        esPaciente) && (
                                        <td>
                                            <div className="acciones">
                                                <Link
                                                    to={`/estudios/${estudio.id}`}
                                                >
                                                    Ver
                                                </Link>
                                            </div>
                                        </td>
                                    )}
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
                                estudiosFiltrados.length,
                            )}{' '}
                            de {estudiosFiltrados.length} resultados
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
                                    setPaginaActual((pagina) =>
                                        Math.max(1, pagina - 1),
                                    )
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
                                    setPaginaActual((pagina) =>
                                        Math.min(totalPaginas, pagina + 1),
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
