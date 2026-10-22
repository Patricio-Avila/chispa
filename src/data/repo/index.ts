/** Punto único de acceso a los repositorios para la UI.
 *  Al migrar a Supabase solo cambian estas fábricas. */

export type * from './types'

export { localUserRepo as userRepo } from './local/localUserRepo'
export { localMediaRepo as mediaRepo } from './local/localMediaRepo'
export { localLocationRepo as locationRepo } from './local/localLocationRepo'
