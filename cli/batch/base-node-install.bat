@echo off
SETLOCAL ENABLEEXTENSIONS

:: Vérifie si Node est déjà installé
node -v > nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    echo Node.js est déjà installé.
) ELSE (
    :: Définir le chemin et le nom de l'installateur
    set installerPath=%~dp0nodejs-installer.msi

    :: Télécharger l'installateur Node.js LTS
    echo Téléchargement de Node.js...
    curl -o "%installerPath%" https://nodejs.org/dist/v22.12.0/node-v22.12.0-x64.msi

    :: Installe Node.js en mode silencieux
    echo Installation de Node.js...
    msiexec /i "%installerPath%" /qn

    :: Nettoyer le fichier d'installation
    del "%installerPath%"
)

:: Vérifie si Yarn est déjà installé
yarn -v > nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    echo Yarn est déjà installé.
) ELSE (
    :: Installer Yarn
    echo Installation de Yarn...
    npm install -g yarn
)

yarn -v > nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    echo Yarn est installé avec succès.
) ELSE (
    echo Erreur lors de l'installation de Yarn.
)

echo Installation terminée.

ENDLOCAL
