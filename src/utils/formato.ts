// El back devuelve la hora como "HH:mm:ss"; en pantalla se muestra "HH:mm".
export function formatearHora(hora: string): string {
    return hora.slice(0, 5)
}

export function nombreCompleto(persona?: {
    nombre: string
    apellido: string
}): string {
    return persona ? `${persona.apellido}, ${persona.nombre}` : '-'
}

// Fecha local de hoy en formato YYYY-MM-DD (para el min de los inputs date).
export function fechaHoy(): string {
    const ahora = new Date()
    const mes = String(ahora.getMonth() + 1).padStart(2, '0')
    const dia = String(ahora.getDate()).padStart(2, '0')
    return `${ahora.getFullYear()}-${mes}-${dia}`
}
