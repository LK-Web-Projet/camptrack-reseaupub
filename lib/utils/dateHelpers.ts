/**
 * Date Helpers
 * Utilitaires pour manipuler les dates
 */

/**
 * Ajoute un nombre de jours à une date
 * @param date - Date de départ
 * @param days - Nombre de jours à ajouter (peut être négatif)
 * @returns Nouvelle date
 */
export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Retourne le début de la journée (00:00:00.000)
 * @param date - Date à traiter
 * @returns Date au début de la journée
 */
export function startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

/**
 * Retourne la fin de la journée (23:59:59.999)
 * @param date - Date à traiter
 * @returns Date à la fin de la journée
 */
export function endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
}

/**
 * Formate une date en français
 * @param date - Date à formater
 * @param format - Format optionnel ('short', 'long', 'full')
 * @returns Date formatée
 * 
 * @example
 * formatDate(new Date('2026-01-26'))
 * // => "26 janvier 2026"
 */
export function formatDate(date: Date, format: 'short' | 'long' | 'full' = 'long'): string {
    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: format === 'short' ? '2-digit' : 'long',
        year: 'numeric'
    };

    if (format === 'full') {
        options.weekday = 'long';
    }

    return new Intl.DateTimeFormat('fr-FR', options).format(date);
}

/**
 * Calcule le nombre de jours entre deux dates
 * @param date1 - Première date
 * @param date2 - Deuxième date
 * @returns Nombre de jours (peut être négatif)
 */
export function daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000; // millisecondes dans un jour
    const diffTime = date2.getTime() - date1.getTime();
    return Math.round(diffTime / oneDay);
}

/**
 * Vérifie si une date est dans le passé
 * @param date - Date à vérifier
 * @returns true si la date est passée
 */
export function isPast(date: Date): boolean {
    return date < new Date();
}

/**
 * Vérifie si une date est dans le futur
 * @param date - Date à vérifier
 * @returns true si la date est future
 */
export function isFuture(date: Date): boolean {
    return date > new Date();
}

/**
 * Formate une date en format ISO (pour l'API)
 * @param date - Date à formater
 * @returns Date en format ISO
 */
export function toISOString(date: Date): string {
    return date.toISOString();
}
