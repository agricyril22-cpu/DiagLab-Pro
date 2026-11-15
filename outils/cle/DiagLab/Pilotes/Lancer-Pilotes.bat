@echo off
rem DiagLab Pro - Pilotes hors connexion (demande les droits administrateur)
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0DiagLab-Pilotes.ps1"
