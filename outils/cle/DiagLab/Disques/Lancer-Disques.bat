@echo off
rem DiagLab Pro - Disques internes et externes (demande les droits administrateur)
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0DiagLab-Disques.ps1"
