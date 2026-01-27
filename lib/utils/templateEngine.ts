/**
 * Template Engine Simple
 * Remplace les variables {{variable}} dans un template
 */

/**
 * Rend un template avec les données fournies
 * @param template - Template avec des variables {{variable}}
 * @param data - Objet contenant les valeurs des variables
 * @returns Template rendu avec les valeurs
 * 
 * @example
 * renderTemplate("Bonjour {{nom}}", { nom: "Jean" })
 * // => "Bonjour Jean"
 */
export function renderTemplate(
    template: string,
    data: Record<string, any>
): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] !== undefined ? String(data[key]) : match;
    });
}

/**
 * Vérifie si un template est valide
 * @param template - Template à vérifier
 * @returns true si le template est valide
 */
export function isValidTemplate(template: string): boolean {
    try {
        // Vérifie que les accolades sont bien fermées
        const openBraces = (template.match(/\{\{/g) || []).length;
        const closeBraces = (template.match(/\}\}/g) || []).length;
        return openBraces === closeBraces;
    } catch {
        return false;
    }
}

/**
 * Extrait les variables d'un template
 * @param template - Template à analyser
 * @returns Liste des noms de variables
 * 
 * @example
 * extractVariables("Bonjour {{nom}}, vous avez {{count}} messages")
 * // => ["nom", "count"]
 */
export function extractVariables(template: string): string[] {
    const matches = template.match(/\{\{(\w+)\}\}/g) || [];
    return matches.map(match => match.replace(/\{\{|\}\}/g, ''));
}
