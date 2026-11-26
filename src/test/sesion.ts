import type { Rol } from '../types/usuario'

// Simula un usuario logueado guardándolo como lo hace LoginPage.
export function iniciarSesionComo(rol: Rol, id = 1) {
    localStorage.setItem(
        'usuario',
        JSON.stringify({
            id,
            email: `${rol.toLowerCase()}@test.com`,
            rol,
            activo: true,
        }),
    )
}
