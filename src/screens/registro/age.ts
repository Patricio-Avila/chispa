/** Edad en años cumplidos a la fecha dada (por defecto hoy). */
export function ageFromBirthdate(birthdate: string, today = new Date()): number {
  const birth = new Date(`${birthdate}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return Number.NaN
  let age = today.getFullYear() - birth.getFullYear()
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  if (beforeBirthday) age -= 1
  return age
}

export const MIN_AGE = 18

export function isAdult(birthdate: string, today = new Date()): boolean {
  const age = ageFromBirthdate(birthdate, today)
  return !Number.isNaN(age) && age >= MIN_AGE
}
