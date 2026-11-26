import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { crearEspacio } from '../../services/espacioService'
import type { TipoEspacio, UbicacionEspacio } from '../../types/espacio'
import { obtenerMensajeError } from '../../utils/errores'

const TIPOS: TipoEspacio[] = ['CONSULTORIO', 'GIMNASIO']
const UBICACIONES: UbicacionEspacio[] = ['ADELANTE', 'ATRAS']

export function CrearEspacioPage() {
    const navigate = useNavigate()

    const [nombre, setNombre] = useState('')
    const [tipo, setTipo] = useState<TipoEspacio>('CONSULTORIO')
    const [ubicacion, setUbicacion] = useState<UbicacionEspacio>('ADELANTE')
    const [error, setError] = useState('')
    const [guardando, setGuardando] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError('')

        if (!nombre.trim()) {
            setError('Ingresá el nombre del espacio.')
            return
        }
        if (nombre.trim().length > 100) {
            setError('El nombre no puede superar los 100 caracteres.')
            return
        }

        setGuardando(true)
        try {
            const creado = await crearEspacio({
                nombre: nombre.trim(),
                tipo,
                ubicacion,
            })
            navigate(`/espacios/${creado.id}`)
        } catch (err) {
            setError(obtenerMensajeError(err, 'No se pudo crear el espacio.'))
        } finally {
            setGuardando(false)
        }
    }

    return (
        <main>
            <h1>Nuevo espacio</h1>

            {error && (
                <p role="alert" className="mensaje-error">
                    {error}
                </p>
            )}

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="nombre">Nombre</label>
                    <input
                        id="nombre"
                        value={nombre}
                        maxLength={100}
                        required
                        onChange={(event) => setNombre(event.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="tipo">Tipo</label>
                    <select
                        id="tipo"
                        value={tipo}
                        onChange={(event) =>
                            setTipo(event.target.value as TipoEspacio)
                        }
                    >
                        {TIPOS.map((opcion) => (
                            <option key={opcion} value={opcion}>
                                {opcion === 'CONSULTORIO'
                                    ? 'Consultorio'
                                    : 'Gimnasio'}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="ubicacion">Ubicación</label>
                    <select
                        id="ubicacion"
                        value={ubicacion}
                        onChange={(event) =>
                            setUbicacion(event.target.value as UbicacionEspacio)
                        }
                    >
                        {UBICACIONES.map((opcion) => (
                            <option key={opcion} value={opcion}>
                                {opcion === 'ADELANTE' ? 'Adelante' : 'Atrás'}
                            </option>
                        ))}
                    </select>
                </div>

                <button type="submit" disabled={guardando}>
                    {guardando ? 'Creando...' : 'Crear espacio'}
                </button>
            </form>

            <p>
                <Link to="/espacios">Volver al listado</Link>
            </p>
        </main>
    )
}
