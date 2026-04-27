# Galaga Game - Windows 자동 설치 스크립트
# PowerShell을 관리자 권한으로 실행하세요

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Galaga Game - 환경 설치 스크립트" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 관리자 권한 확인
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[ERROR] 관리자 권한으로 실행해주세요." -ForegroundColor Red
    Write-Host "PowerShell을 우클릭 -> '관리자 권한으로 실행' 후 다시 시도하세요." -ForegroundColor Yellow
    exit 1
}

# winget 확인
Write-Host "`n[1/3] winget 확인 중..." -ForegroundColor Yellow
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] winget이 없습니다. Windows 10 1709 이상에서 Microsoft Store -> 'App Installer'를 설치하세요." -ForegroundColor Red
    exit 1
}
Write-Host "  winget OK" -ForegroundColor Green

# Node.js 설치
Write-Host "`n[2/3] Node.js 설치 중..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = node --version
    Write-Host "  Node.js 이미 설치됨: $nodeVer" -ForegroundColor Green
} else {
    Write-Host "  Node.js LTS 설치 중 (winget)..." -ForegroundColor White
    winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements -e
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Node.js 설치 완료" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] winget 설치 실패. https://nodejs.org 에서 수동 설치하세요." -ForegroundColor Yellow
    }
}

# Docker Desktop 설치
Write-Host "`n[3/3] Docker Desktop 설치 중..." -ForegroundColor Yellow
if (Get-Command docker -ErrorAction SilentlyContinue) {
    $dockerVer = docker --version
    Write-Host "  Docker 이미 설치됨: $dockerVer" -ForegroundColor Green
} else {
    Write-Host "  Docker Desktop 설치 중 (winget)..." -ForegroundColor White
    winget install --id Docker.DockerDesktop --accept-source-agreements --accept-package-agreements -e
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Docker Desktop 설치 완료" -ForegroundColor Green
        Write-Host "  [!] Docker Desktop을 시작하고 PC를 재시작해야 할 수 있습니다." -ForegroundColor Yellow
    } else {
        Write-Host "  [WARN] winget 설치 실패. https://www.docker.com/products/docker-desktop 에서 수동 설치하세요." -ForegroundColor Yellow
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  설치 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor White
Write-Host "  1. 터미널을 닫고 새로 열기 (PATH 갱신)" -ForegroundColor White
Write-Host "  2. Docker Desktop 실행 후 대기 (고래 아이콘이 트레이에 뜰 때까지)" -ForegroundColor White
Write-Host "  3. 아래 명령어로 게임 실행:" -ForegroundColor White
Write-Host ""
Write-Host "     cd galaga-game" -ForegroundColor Cyan
Write-Host "     docker compose up --build" -ForegroundColor Cyan
Write-Host ""
Write-Host "  게임: http://localhost:3000" -ForegroundColor Green
Write-Host "  API:  http://localhost:4000/api/scores" -ForegroundColor Green
