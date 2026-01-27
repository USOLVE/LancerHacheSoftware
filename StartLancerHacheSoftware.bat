@echo off
title Lancer de Hache - Serveur
color 0A

echo.
echo  ========================================
echo       LANCER DE HACHE SOFTWARE
echo  ========================================
echo.
echo  Demarrage du serveur web local...
echo.
echo  URL: http://localhost:5000
echo.
echo  Appuyez sur Ctrl+C pour arreter
echo  ========================================
echo.

REM Change vers le répertoire du script
cd /d "%~dp0"

REM Ouvre le navigateur automatiquement
start http://localhost:5000

REM Tente avec Python 3 (commande python)
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Serveur Python detecte, demarrage...
    python -m http.server 5000
    goto :end
)

REM Tente avec python3
python3 --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Serveur Python3 detecte, demarrage...
    python3 -m http.server 5000
    goto :end
)

REM Tente avec Node.js npx
npx --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Serveur Node.js detecte, demarrage...
    npx http-server -p 5000 -c-1
    goto :end
)

REM Aucun serveur trouvé
echo.
echo  ERREUR: Aucun serveur web disponible!
echo.
echo  Veuillez installer l'une des options suivantes:
echo    - Python: https://www.python.org/downloads/
echo    - Node.js: https://nodejs.org/
echo.
pause

:end
