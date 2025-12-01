import * as fs from 'fs';
import * as path from 'path';

type MatchResult = {
    file: string;
    lineNumber: number;
    lineContent: string;
    pattern: string;
};

function readPatterns(patternFilePath: string): string[] {
    const content = fs.readFileSync(patternFilePath, 'utf-8');
    // Pattern séparés par des espaces (on ignore les blancs multiples)
    return content
        .split(/\s+/)
        .map(p => p.trim())
        .filter(p => {
            // Au moins une lettre (a-zA-Z)
            const hasLetter = /[a-zA-Z]/.test(p);
            if (!hasLetter) {
                return false;
            }

            // Tous les caractères doivent être dans le set autorisé :
            // lettres, chiffres, @, /, -
            const allowedCharsOnly = /^[a-zA-Z@/\-]+$/.test(p);
            return allowedCharsOnly;
        });
}

function listFilesRecursively(dir: string, visited = new Set<string>()): string[] {
    const files: string[] = [];

    // Normaliser pour éviter les doublons style C:\a\b\.. etc.
    const realPath = fs.realpathSync(dir);

    // Si déjà visité (symlink/jonction qui boucle), on s'arrête
    if (visited.has(realPath)) {
        return files;
    }
    visited.add(realPath);

    const entries = fs.readdirSync(realPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(realPath, entry.name);

        if (entry.isDirectory() && (entry.name === 'node_modules' || entry.name === '.dist' || entry.name === '.angular' || entry.name === '.git' || entry.name === '.nx' || entry.name === '.vs')) {
            continue;
        }

        if (entry.isDirectory()) {
            files.push(...listFilesRecursively(fullPath, visited));
        } else if (entry.isFile()) {
            files.push(fullPath);
        }
        // On ignore les autres types (symlink, fifo, etc.) pour éviter les surprises
    }

    return files;
}

function searchPatternsInFile(filePath: string, patterns: string[]): MatchResult[] {
    const results: MatchResult[] = [];

    let content: string;
    try {
        content = fs.readFileSync(filePath, 'utf-8');
    } catch {
        return results;
    }

    const lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        for (const pattern of patterns) {
            if (pattern.length === 0) {
                continue;
            }

            // Échapper les caractères spéciaux regex dans le pattern
            const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Définition d’un « séparateur de mot » : début/fin de ligne ou caractère non alphanumérique
            const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`);

            if (regex.test(line)) {
                results.push({
                    file: filePath,
                    lineNumber: i + 1,
                    lineContent: line,
                    pattern,
                });
            }
        }
    }

    return results;
}

/**
 * Fonction principale:
 *  - patternFilePath: chemin du fichier .txt contenant les patterns (séparés par des espaces)
 *  - targetDir: dossier à parcourir
 *  - outputFilePath: fichier de sortie pour les résultats
 */
export function searchPatternsFromFile(
    patternFilePath: string,
    targetDir: string,
    outputFilePath: string
): void {
    const patterns = readPatterns(patternFilePath);
    if (patterns.length === 0) {
        console.log('Aucun pattern à chercher.');
        return;
    }

    const allFiles = listFilesRecursively(targetDir);
    const allResults: MatchResult[] = [];

    for (const file of allFiles) {
        const fileResults = searchPatternsInFile(file, patterns);
        console.log(`Scanné: ${file}, Trouvé: ${fileResults.length} correspondances`);
        allResults.push(...fileResults);
    }

    const lines: string[] = [];
    lines.push(`Patterns: ${patterns.join(' ')}`);
    lines.push(`Dossier scanné: ${targetDir}`);
    lines.push(`Nombre total de correspondances: ${allResults.length}`);
    lines.push(''); // ligne vide

    for (const r of allResults) {
        lines.push(
            `${r.file}:${r.lineNumber} [${r.pattern}] ${r.lineContent}`
        );
    }

    fs.writeFileSync(outputFilePath, lines.join('\n'), 'utf-8');
    console.log(`Résultats écrits dans : ${outputFilePath}`);
}

if (require.main === module) {
    const [, , patternFile, targetDir, outputFile] = process.argv;

    if (!patternFile || !targetDir || !outputFile) {
        console.error('Usage: node packageCrawler.js <patterns.txt> <dossier> <resultats.txt>');
        console.error('Exemple: node packageCrawler.js patterns.txt ./src resultats.txt');
        process.exit(1);
    }

    if (!fs.existsSync(patternFile)) {
        console.error(`Fichier de patterns introuvable: ${patternFile}`);
        process.exit(1);
    }

    if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
        console.error(`Dossier à scanner invalide: ${targetDir}`);
        process.exit(1);
    }

    try {
        searchPatternsFromFile(patternFile, targetDir, outputFile);
    } catch (err) {
        console.error('Erreur lors de la recherche des patterns:', err);
        process.exit(1);
    }
}