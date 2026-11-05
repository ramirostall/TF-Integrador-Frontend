import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarPacientes } from '../../services/pacienteService'
import type { Paciente } from '../../types/paciente'
import { obtenerMensajeError } from '../../utils/errores'

const ELEMENTOS_POR_PAGINA = 10

export function PacientesPage() {
    const [pacientes, setPacientes] = useState<Paciente[]>([])
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(true)
    const [busqueda, setBusqueda] = useState('')
    const [paginaActual, setPaginaActual] = useState(1)

    useEffect(() => {
        async function cargarPacientes() {
            try {
                const datos = await listarPacientes()
                setPacientes(datos)
            } catch (error) {
                setError(
                    obtenerMensajeError(
                        error,
                        'No se pudieron cargar los pacientes.',
                    ),
                )
            } finally {
                setCargando(false)
            }
        }

        cargarPacientes()
    }, [])

    const pacientesFiltrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase()

        if (!termino) {
            return pacientes
        }

        return pacientes.filter((paciente) => {
            const nombre = paciente.nombre?.toLowerCase() ?? ''
            const apellido = paciente.apellido?.toLowerCase() ?? ''
            const dni = paciente.dni?.toLowerCase() ?? ''
            const telefono = paciente.telefono?.toLowerCase() ?? ''
            const email = paciente.usuario?.email?.toLowerCase() ?? ''

            return (
                nombre.includes(termino) ||
                apellido.includes(termino) ||
                dni.includes(termino) ||
                telefono.includes(termino) ||
                email.includes(termino) ||
                String(paciente.id).includes(termino)
            )
        })
    }, [pacientes, busqueda])

    const totalPaginas = Math.max(
        1,
        Math.ceil(pacientesFiltrados.length / ELEMENTOS_POR_PAGINA),
    )

    const paginaSegura = Math.min(paginaActual, totalPaginas)

    const pacientesPaginados = useMemo(() => {
        const inicio = (paginaSegura - 1) * ELEMENTOS_POR_PAGINA
        const fin = inicio + ELEMENTOS_POR_PAGINA

        return pacientesFiltrados.slice(inicio, fin)
    }, [pacientesFiltrados, paginaSegura])

    return (
        <main>
            <h1>Pacientes</h1>

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            {!cargando && pacientes.length > 0 && (
                <div style={{ marginTop: '16px', marginBottom: '12px' }}>
                    <input
                        type="search"
                        placeholder="Buscar por nombre, apellido, DNI, email o teléfono..."
                        value={busqueda}
                        onChange={(e) => {
                            setBusqueda(e.target.value)
                            setPaginaActual(1)
                        }}
                        aria-label="Buscar pacientes"
                        style={{ maxWidth: '360px' }}
                    />
                </div>
            )}

            {cargando ? (
                <p>Cargando pacientes...</p>
            ) : pacientes.length === 0 ? (
                <p>No hay pacientes registrados.</p>
            ) : pacientesFiltrados.length === 0 ? (
                <p>No se encontraron pacientes con ese criterio de búsqueda.</p>
            ) : (
                <>
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Apellido</th>
                                <th>DNI</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {pacientesPaginados.map((paciente) => (
                                <tr key={paciente.id}>
                                    <td>{paciente.nombre}</td>
                                    <td>{paciente.apellido}</td>
                                    <td>{paciente.dni}</td>
                                    <td>{paciente.usuario?.email ?? '-'}</td>
                                    <td>{paciente.telefono}</td>
                                    <td>
                                        <div className="acciones">
                                            <Link
                                                to={`/pacientes/${paciente.id}`}
                                            >
                                                Ver
                                            </Link>
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
                                pacientesFiltrados.length,
                            )}{' '}
                            de {pacientesFiltrados.length} resultados
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
