import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    desactivarEspacio,
    eliminarEspacio,
    listarEspacios,
    reactivarEspacio,
} from '../../services/espacioService'
import { obtenerUsuarioGuardado } from '../../services/authService'
import type {
    Espacio,
    TipoEspacio,
    UbicacionEspacio,
} from '../../types/espacio'
import { obtenerMensajeError } from '../../utils/errores'

const ELEMENTOS_POR_PAGINA = 10

const ETIQUETAS_TIPO: Record<TipoEspacio, string> = {
    GIMNASIO: 'Gimnasio',
    CONSULTORIO: 'Consultorio',
}

const ETIQUETAS_UBICACION: Record<UbicacionEspacio, string> = {
    ADELANTE: 'Adelante',
    ATRAS: 'Atrás',
}

export function EspaciosPage() {
    const [espacios, setEspacios] = useState<Espacio[]>([])
    const [busqueda, setBusqueda] = useState('')
    const [paginaActual, setPaginaActual] = useState(1)
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(true)
    const [accionId, setAccionId] = useState<number | null>(null)

    const esAdmin = obtenerUsuarioGuardado()?.rol === 'ADMIN'

    useEffect(() => {
        async function cargar() {
            try {
                setEspacios(await listarEspacios())
            } catch (err) {
                setError(
                    obtenerMensajeError(
                        err,
                        'No se pudieron cargar los espacios.',
                    ),
                )
            } finally {
                setCargando(false)
            }
        }

        cargar()
    }, [])

    const termino = busqueda.trim().toLowerCase()

    const espaciosFiltrados = useMemo(() => {
        if (!termino) return espacios

        return espacios.filter(
            (espacio) =>
                String(espacio.id).includes(termino) ||
                espacio.nombre.toLowerCase().includes(termino) ||
                ETIQUETAS_TIPO[espacio.tipo].toLowerCase().includes(termino) ||
                ETIQUETAS_UBICACION[espacio.ubicacion]
                    .toLowerCase()
                    .includes(termino),
        )
    }, [espacios, termino])

    const totalPaginas = Math.max(
        1,
        Math.ceil(espaciosFiltrados.length / ELEMENTOS_POR_PAGINA),
    )
    const paginaSegura = Math.min(paginaActual, totalPaginas)

    const espaciosPaginados = useMemo(() => {
        const inicio = (paginaSegura - 1) * ELEMENTOS_POR_PAGINA
        return espaciosFiltrados.slice(inicio, inicio + ELEMENTOS_POR_PAGINA)
    }, [espaciosFiltrados, paginaSegura])

    async function ejecutarAccion(
        id: number,
        accion: 'desactivar' | 'reactivar' | 'eliminar',
    ) {
        const mensajes = {
            desactivar: '¿Desactivar el espacio?',
            eliminar: '¿Eliminar el espacio? Esta acción no se puede deshacer.',
        }
        if (accion !== 'reactivar' && !window.confirm(mensajes[accion])) {
            return
        }

        setAccionId(id)
        setError('')

        try {
            if (accion === 'desactivar') {
                const actualizado = await desactivarEspacio(id)
                setEspacios((prev) =>
                    prev.map((espacio) =>
                        espacio.id === id ? actualizado : espacio,
                    ),
                )
            } else if (accion === 'reactivar') {
                const actualizado = await reactivarEspacio(id)
                setEspacios((prev) =>
                    prev.map((espacio) =>
                        espacio.id === id ? actualizado : espacio,
                    ),
                )
            } else {
                await eliminarEspacio(id)
                setEspacios((prev) =>
                    prev.filter((espacio) => espacio.id !== id),
                )
            }
        } catch (err) {
            setError(obtenerMensajeError(err, 'No se pudo realizar la acción.'))
        } finally {
            setAccionId(null)
        }
    }

    if (cargando) return <p>Cargando espacios...</p>

    return (
        <main>
            <h1>Espacios</h1>

            {esAdmin && (
                <p>
                    <Link to="/espacios/nuevo">Nuevo espacio</Link>
                </p>
            )}

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            {espacios.length > 0 && (
                <div style={{ marginTop: '16px', marginBottom: '12px' }}>
                    <input
                        type="search"
                        placeholder="Buscar por ID, nombre, tipo o ubicación..."
                        value={busqueda}
                        onChange={(event) => {
                            setBusqueda(event.target.value)
                            setPaginaActual(1)
                        }}
                    />
                </div>
            )}

            {espacios.length === 0 ? (
                <p>No hay espacios registrados.</p>
            ) : espaciosFiltrados.length === 0 ? (
                <p>No se encontraron espacios con ese criterio.</p>
            ) : (
                <>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Tipo</th>
                                <th>Ubicación</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {espaciosPaginados.map((espacio) => (
                                <tr key={espacio.id}>
                                    <td>{espacio.id}</td>
                                    <td>{espacio.nombre}</td>
                                    <td>{ETIQUETAS_TIPO[espacio.tipo]}</td>
                                    <td>
                                        {ETIQUETAS_UBICACION[espacio.ubicacion]}
                                    </td>
                                    <td>
                                        <span
                                            className={
                                                espacio.activo
                                                    ? 'estado-disponible'
                                                    : 'estado-vencido'
                                            }
                                        >
                                            {espacio.activo
                                                ? 'Activo'
                                                : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="acciones">
                                            <Link
                                                to={`/espacios/${espacio.id}`}
                                            >
                                                Ver
                                            </Link>
                                            {esAdmin && (
                                                <>
                                                    {espacio.activo ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                ejecutarAccion(
                                                                    espacio.id,
                                                                    'desactivar',
                                                                )
                                                            }
                                                            disabled={
                                                                accionId ===
                                                                espacio.id
                                                            }
                                                        >
                                                            Desactivar
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                ejecutarAccion(
                                                                    espacio.id,
                                                                    'reactivar',
                                                                )
                                                            }
                                                            disabled={
                                                                accionId ===
                                                                espacio.id
                                                            }
                                                        >
                                                            Reactivar
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            ejecutarAccion(
                                                                espacio.id,
                                                                'eliminar',
                                                            )
                                                        }
                                                        disabled={
                                                            accionId ===
                                                            espacio.id
                                                        }
                                                    >
                                                        Eliminar
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <p>
                        Página {paginaSegura} de {totalPaginas}
                    </p>
                    <button
                        type="button"
                        onClick={() =>
                            setPaginaActual((pagina) => Math.max(1, pagina - 1))
                        }
                        disabled={paginaSegura <= 1}
                    >
                        Anterior
                    </button>
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
                </>
            )}
        </main>
    )
}
