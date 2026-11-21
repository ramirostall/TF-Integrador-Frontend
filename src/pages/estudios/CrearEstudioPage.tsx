import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { obtenerUsuarioGuardado } from '../../services/authService'
import { crearEstudio } from '../../services/estudioService'
import {
    listarPacientes,
    obtenerMiPerfil,
} from '../../services/pacienteService'
import type { Paciente } from '../../types/paciente'
import {
    ACEPTAR_ARCHIVO_ESTUDIO,
    validarArchivoEstudio,
} from '../../utils/archivos'
import { obtenerMensajeError } from '../../utils/errores'

export function CrearEstudioPage() {
    const [pacientes, setPacientes] = useState<Paciente[]>([])
    const [pacienteId, setPacienteId] = useState('')
    const [tipo, setTipo] = useState('')
    const [fecha, setFecha] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [archivo, setArchivo] = useState<File | null>(null)
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)

    const navigate = useNavigate()

    const usuario = obtenerUsuarioGuardado()
    const esPaciente = usuario?.rol === 'PACIENTE'

    useEffect(() => {
        async function cargarPacientes() {
            try {
                if (esPaciente) {
                    const perfil = await obtenerMiPerfil()
                    setPacienteId(String(perfil.id))
                    setPacientes([perfil])
                    return
                }

                const datos = await listarPacientes()
                setPacientes(datos)
            } catch (error) {
                setError(
                    obtenerMensajeError(
                        error,
                        'No se pudieron cargar los pacientes.',
                    ),
                )
            }
        }

        cargarPacientes()
    }, [esPaciente])

    function handleArchivoChange(event: React.ChangeEvent<HTMLInputElement>) {
        const seleccionado = event.target.files?.[0] ?? null
        setError('')

        if (seleccionado) {
            const errorArchivo = validarArchivoEstudio(seleccionado)

            if (errorArchivo) {
                setError(errorArchivo)
                event.target.value = ''
                setArchivo(null)
                return
            }
        }

        setArchivo(seleccionado)
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError('')

        if (archivo) {
            const errorArchivo = validarArchivoEstudio(archivo)

            if (errorArchivo) {
                setError(errorArchivo)
                return
            }
        }

        setCargando(true)

        try {
            const creado = await crearEstudio({
                pacienteId: Number(pacienteId),
                tipo,
                fecha,
                descripcion,
                archivo,
            })

            navigate(`/estudios/${creado.id}`)
        } catch (error) {
            setError(obtenerMensajeError(error, 'No se pudo crear el estudio.'))
        } finally {
            setCargando(false)
        }
    }

    return (
        <main>
            <h1>Crear estudio</h1>

            <form onSubmit={handleSubmit}>
                {esPaciente ? (
                    <p>
                        Paciente: {pacientes[0]?.apellido},{' '}
                        {pacientes[0]?.nombre} (DNI {pacientes[0]?.dni})
                    </p>
                ) : (
                    <label>
                        Paciente
                        <select
                            value={pacienteId}
                            onChange={(event) =>
                                setPacienteId(event.target.value)
                            }
                            required
                        >
                            <option value="">Seleccioná un paciente</option>
                            {pacientes.map((paciente) => (
                                <option key={paciente.id} value={paciente.id}>
                                    {paciente.apellido}, {paciente.nombre} (DNI{' '}
                                    {paciente.dni})
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                <label>
                    Tipo
                    <input
                        value={tipo}
                        onChange={(event) => setTipo(event.target.value)}
                        maxLength={100}
                        required
                    />
                </label>

                <label>
                    Fecha
                    <input
                        type="date"
                        value={fecha}
                        onChange={(event) => setFecha(event.target.value)}
                        max={new Date().toISOString().slice(0, 10)}
                        required
                    />
                </label>

                <label>
                    Descripción
                    <textarea
                        value={descripcion}
                        onChange={(event) => setDescripcion(event.target.value)}
                        rows={4}
                        required
                    />
                </label>

                <label>
                    Archivo (opcional)
                    <input
                        type="file"
                        accept={ACEPTAR_ARCHIVO_ESTUDIO}
                        onChange={handleArchivoChange}
                    />
                </label>

                {error && (
                    <p role="alert" className="mensaje-error">
                        {error}
                    </p>
                )}

                <button type="submit" disabled={cargando}>
                    {cargando ? 'Creando...' : 'Crear estudio'}
                </button>
            </form>

            <p>
                <Link to="/estudios">Volver a estudios</Link>
            </p>
        </main>
    )
}
