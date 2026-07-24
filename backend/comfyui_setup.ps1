# ComfyUI Local Installation & Setup Script
# Configures ComfyUI in C:\Users\SE\ComfyUI with PyTorch CUDA support

$InstallDir = "C:\Users\SE\ComfyUI"

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Starting ComfyUI Local Installation & Setup..." -ForegroundColor Cyan
Write-Host "Installation Directory: $InstallDir" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# 1. Clone ComfyUI Repository
if (-not (Test-Path $InstallDir)) {
    Write-Host "Cloning ComfyUI repository..." -ForegroundColor Yellow
    git clone https://github.com/comfyanonymous/ComfyUI.git $InstallDir
} else {
    Write-Host "ComfyUI repository already exists. Pulling latest updates..." -ForegroundColor Yellow
    cd $InstallDir
    git pull
}

# 2. Create Python Virtual Environment
$VenvPath = "$InstallDir\venv"
if (-not (Test-Path $VenvPath)) {
    Write-Host "Creating python virtual environment..." -ForegroundColor Yellow
    python -m venv $VenvPath
} else {
    Write-Host "Virtual environment already exists." -ForegroundColor Yellow
}

# 3. Install PyTorch with CUDA 12.1 Support
Write-Host "Installing PyTorch with CUDA 12.1 support (this may take a few minutes)..." -ForegroundColor Yellow
& "$VenvPath\Scripts\pip.exe" install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu121

# 4. Install ComfyUI Dependencies
Write-Host "Installing ComfyUI requirements..." -ForegroundColor Yellow
& "$VenvPath\Scripts\pip.exe" install -r "$InstallDir\requirements.txt"

Write-Host "===============================================" -ForegroundColor Green
Write-Host "ComfyUI successfully installed!" -ForegroundColor Green
Write-Host "To start ComfyUI, run:" -ForegroundColor Green
Write-Host "  & '$VenvPath\Scripts\python.exe' '$InstallDir\main.py' --listen 127.0.0.1 --port 8188" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
