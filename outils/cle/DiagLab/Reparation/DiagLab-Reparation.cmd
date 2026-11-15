@echo off
rem ==========================================================================
rem  DiagLab Pro - Menu de reparation Windows hors ligne
rem  A lancer apres avoir demarre le PC sur la cle (Hiren's BootCD PE, WinPE,
rem  ou invite de commandes de la recuperation Windows : Maj + F10).
rem  Texte sans accents volontairement : compatible avec toutes les consoles.
rem ==========================================================================
setlocal EnableExtensions EnableDelayedExpansion
title DiagLab Pro - Reparation Windows
set "CLE=%~d0"
set "WIN="

:detect
for %%D in (C D E F G H I J K L M N O P Q R S T U V W Y Z) do (
  if not defined WIN if exist "%%D:\Windows\System32\config\SYSTEM" if /I not "%%D:"=="%CLE%" set "WIN=%%D:"
)

:menu
cls
echo  ==============================================================
echo   DiagLab Pro - Reparation de Windows hors ligne
echo  ==============================================================
if defined WIN (echo   Windows detecte sur : %WIN%) else (echo   ATTENTION : aucune installation Windows detectee.)
echo   Cle DiagLab : %CLE%
echo.
echo   1. Reparer le demarrage (UEFI et BIOS)
echo   2. Verifier et reparer les fichiers systeme (SFC hors ligne)
echo   3. Verifier et reparer le disque (CHKDSK)
echo   4. Reparer l'image Windows (DISM hors ligne)
echo   5. Injecter des pilotes depuis %CLE%\PILOTES (disque introuvable, RST/VMD)
echo   6. Sauvegarder les documents des utilisateurs sur la cle
echo   7. Choisir un autre lecteur Windows
echo   8. Ouvrir une invite de commandes
echo   0. Quitter
echo.
set "CHOIX="
set /p "CHOIX=  Votre choix : "
if "%CHOIX%"=="1" goto boot
if "%CHOIX%"=="2" goto sfc
if "%CHOIX%"=="3" goto chk
if "%CHOIX%"=="4" goto dism
if "%CHOIX%"=="5" goto drv
if "%CHOIX%"=="6" goto save
if "%CHOIX%"=="7" goto pick
if "%CHOIX%"=="8" (start cmd & goto menu)
if "%CHOIX%"=="0" goto fin
goto menu

:needwin
if defined WIN exit /b 0
echo.
echo  Aucune installation Windows : utilisez l'option 7 pour indiquer la lettre.
pause
exit /b 1

:confirm
set "OK="
set /p "OK=  Confirmer ? (O pour oui) : "
if /I "%OK%"=="O" exit /b 0
exit /b 1

:boot
call :needwin || goto menu
echo.
echo  Reconstruction des fichiers de demarrage a partir de %WIN%\Windows.
call :confirm || goto menu
mountvol S: /S >nul 2>&1
if exist S:\EFI (
  echo  Mode UEFI : partition EFI montee sur S:
  bcdboot %WIN%\Windows /s S: /f UEFI
  mountvol S: /D >nul 2>&1
) else (
  echo  Mode BIOS / Legacy
  bcdboot %WIN%\Windows /f BIOS
  bootsect /nt60 SYS /mbr >nul 2>&1
)
echo.
echo  Termine. Si "Les fichiers de demarrage ont ete crees", redemarrez sans la cle.
pause
goto menu

:sfc
call :needwin || goto menu
echo.
echo  Analyse des fichiers systeme de %WIN% (10 a 30 minutes).
sfc /scannow /offbootdir=%WIN%\ /offwindir=%WIN%\Windows
pause
goto menu

:chk
call :needwin || goto menu
echo.
echo  CHKDSK corrige les erreurs du systeme de fichiers de %WIN%.
echo  Option /r (secteurs defectueux) : beaucoup plus long. Sur un disque qui
echo  fait des clics, ne lancez PAS chkdsk : sauvegardez d'abord (option 6).
set "R="
set /p "R=  Rechercher aussi les secteurs defectueux (/r) ? (O/N) : "
call :confirm || goto menu
if /I "%R%"=="O" (chkdsk %WIN% /f /r /x) else (chkdsk %WIN% /f /x)
pause
goto menu

:dism
call :needwin || goto menu
echo.
echo  Reparation de l'image Windows de %WIN%.
echo  Sans internet, DISM a besoin d'une source : le fichier install.wim ou
echo  install.esd d'une ISO Windows de la meme version (dossier sources).
set "SRC="
set /p "SRC=  Chemin de install.wim / install.esd (Entree = sans source) : "
if defined SRC (
  dism /Image:%WIN%\ /Cleanup-Image /RestoreHealth /Source:"%SRC%" /LimitAccess
) else (
  dism /Image:%WIN%\ /Cleanup-Image /RestoreHealth
)
pause
goto menu

:drv
call :needwin || goto menu
if not exist "%CLE%\PILOTES" (
  echo.
  echo  Dossier %CLE%\PILOTES introuvable : copiez-y les pilotes, fichiers .inf.
  pause
  goto menu
)
echo.
echo  Ajout des pilotes de %CLE%\PILOTES dans le Windows de %WIN%.
echo  Utile apres l'erreur INACCESSIBLE_BOOT_DEVICE (pilote Intel RST / VMD).
call :confirm || goto menu
dism /Image:%WIN%\ /Add-Driver /Driver:"%CLE%\PILOTES" /Recurse
pause
goto menu

:save
call :needwin || goto menu
set "STAMP=%RANDOM%"
for /f "tokens=1-3 delims=/.- " %%a in ("%DATE%") do set "STAMP=%%c%%b%%a"
set "DEST=%CLE%\Sauvegardes\%STAMP%"
echo.
echo  Copie de %WIN%\Users vers %DEST%
echo  (sans les dossiers AppData ; verifiez l'espace libre de la cle).
call :confirm || goto menu
robocopy "%WIN%\Users" "%DEST%" /E /XJ /R:1 /W:1 /XD AppData "Default" "Default User" "All Users" /NFL /NDL /NP
echo.
echo  Sauvegarde terminee dans %DEST%
pause
goto menu

:pick
echo.
set "L="
set /p "L=  Lettre du lecteur Windows (ex. D) : "
if not defined L goto menu
if exist "%L%:\Windows\System32\config\SYSTEM" (set "WIN=%L%:") else (echo  Pas de Windows sur %L%: & pause)
goto menu

:fin
endlocal
exit /b 0
