/** Catálogos en español de México para los dummies (CLAUDE.md §10.1). */

import type { Gender } from '../data/repo/types'

/** Catálogo de 30 intereses. */
export const INTERESTS = [
  'Senderismo',
  'Café',
  'Música indie',
  'Gaming',
  'Cine',
  'Series',
  'Cocinar',
  'Tacos',
  'Conciertos',
  'Fotografía',
  'Viajar',
  'Leer',
  'Gym',
  'Yoga',
  'Correr',
  'Fútbol',
  'Básquet',
  'Escalada',
  'Mascotas',
  'Perros',
  'Gatos',
  'Arte',
  'Museos',
  'Baile',
  'Cumbia',
  'Rock',
  'Reggaetón',
  'Cerveza artesanal',
  'Mezcal',
  'Carnes asadas',
] as const

export const NAMES: Record<Gender, readonly string[]> = {
  mujer: [
    'Valeria', 'Camila', 'Regina', 'Ximena', 'Fernanda', 'Daniela', 'Andrea',
    'Mariana', 'Sofía', 'Paola', 'Alejandra', 'Gabriela', 'Renata', 'Melissa',
    'Karla', 'Diana', 'Brenda', 'Alondra', 'Jimena', 'Natalia', 'Montserrat',
    'Ana', 'Lucía', 'Abril',
  ],
  hombre: [
    'Santiago', 'Diego', 'Alejandro', 'Emiliano', 'Sebastián', 'Leonardo',
    'Mateo', 'Daniel', 'Gael', 'Rodrigo', 'Pablo', 'Andrés', 'Eduardo',
    'Fernando', 'Ricardo', 'Javier', 'Luis', 'Carlos', 'Marco', 'Héctor',
    'Iván', 'Óscar', 'Raúl', 'Bruno',
  ],
  no_binario: [
    'Alex', 'Sam', 'Cris', 'Dani', 'Fran', 'Ari', 'Noa', 'René', 'Mar',
    'Andy', 'Lu', 'Sasha',
  ],
}

/** Plantillas de bio; {interes} y {interes2} se sustituyen al generar. */
export const BIO_TEMPLATES = [
  'Fan de {interes} y de encontrar el mejor lugar de {interes2} de la ciudad.',
  'Entre semana {interes}; los sábados, {interes2} sin culpa.',
  'Dicen que hablo demasiado de {interes}. Tienen razón.',
  'Buscando con quién compartir {interes} y planes espontáneos.',
  'Mitad {interes}, mitad {interes2}, cero drama.',
  'Si tu plan ideal incluye {interes}, ya nos caímos bien.',
  'Colecciono atardeceres y recomendaciones de {interes}.',
  'Me convencen con {interes2} y buena plática.',
] as const

export const PERSONALITIES = ['bromista', 'directa', 'timida'] as const
