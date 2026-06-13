# PowerShell Setup Script for GCP Project - Gold Frame Meme Generator
# This script sets up GCP services, APIs, Datastore, and IAM permissions.

$ErrorActionPreference = "Stop"

# Helper function to check last CLI exit code
function Check-LastExitCode {
    param (
        [string]$ErrorMessage
    )
    if ($LastExitCode -ne 0) {
        Write-Host "[ERROR] $ErrorMessage" -ForegroundColor Red
        exit $LastExitCode
    }
}

# Stylized Header
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🪙 โปรเจกต์ทองอร่าม (Gold Frame Meme Generator) 🪙" -ForegroundColor Yellow
Write-Host "        GCP Project Infrastructure Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Verify gcloud CLI is installed
Write-Host "[CHECK] Verifying gcloud CLI installation..." -ForegroundColor Cyan
if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] gcloud CLI not found on this system." -ForegroundColor Red
    Write-Host "Please install Google Cloud SDK: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ gcloud CLI is installed." -ForegroundColor Green

# 2. Authenticate if not already logged in
Write-Host "`n[AUTH] Checking gcloud auth status..." -ForegroundColor Cyan
$activeAccount = gcloud config get-value account 2>$null
if ([string]::IsNullOrEmpty($activeAccount)) {
    Write-Host "⚠️ No active gcloud account found. Launching login..." -ForegroundColor Yellow
    gcloud auth login
    Check-LastExitCode "Failed to authenticate with gcloud."
} else {
    Write-Host "✅ Active account: $activeAccount" -ForegroundColor Green
}

# 3. Retrieve or Select Project ID
Write-Host "`n[PROJECT] Resolving GCP Project ID..." -ForegroundColor Cyan
$currentProject = gcloud config get-value project 2>$null

if (![string]::IsNullOrEmpty($currentProject)) {
    Write-Host "Current active project in gcloud is: $currentProject" -ForegroundColor Green
    $confirmation = Read-Host "Do you want to use this project? (Y/N) [Default: Y]"
    if ($confirmation -match "^[Nn]") {
        $PROJECT_ID = Read-Host "Enter your GCP Project ID"
    } else {
        $PROJECT_ID = $currentProject
    }
} else {
    $PROJECT_ID = Read-Host "Enter your GCP Project ID"
}

if ([string]::IsNullOrEmpty($PROJECT_ID)) {
    Write-Host "[ERROR] Project ID cannot be empty." -ForegroundColor Red
    exit 1
}

Write-Host "Setting active project to '$PROJECT_ID'..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID
Check-LastExitCode "Failed to set active project."

# 4. Enable Required GCP APIs
Write-Host "`n[APIs] Enabling required GCP APIs..." -ForegroundColor Cyan
Write-Host "This might take a minute..." -ForegroundColor Yellow

$apis = @(
    "artifactregistry.googleapis.com",
    "run.googleapis.com",
    "datastore.googleapis.com",
    "cloudbuild.googleapis.com"
)

foreach ($api in $apis) {
    Write-Host "Enabling $api..." -ForegroundColor Yellow
    gcloud services enable $api
    Check-LastExitCode "Failed to enable API: $api"
}
Write-Host "✅ All required APIs enabled successfully." -ForegroundColor Green

# 5. Create Firestore in Datastore Mode
Write-Host "`n[DATASTORE] Setting up Firestore in Datastore Mode..." -ForegroundColor Cyan
$dbLocation = "asia-southeast1" # Default to Singapore (near Thailand)

# Check if database (default) already exists
Write-Host "Checking for existing (default) database..." -ForegroundColor Yellow
$dbInfoRaw = gcloud firestore databases describe --database="(default)" --format="json" 2>$null

if ($LastExitCode -eq 0 -and ![string]::IsNullOrEmpty($dbInfoRaw)) {
    $dbInfo = $dbInfoRaw | ConvertFrom-Json
    $dbType = $dbInfo.type
    $dbLoc = $dbInfo.locationId
    Write-Host "✅ Found existing (default) database." -ForegroundColor Green
    Write-Host "   - Location: $dbLoc" -ForegroundColor Cyan
    Write-Host "   - Mode: $dbType" -ForegroundColor Cyan

    if ($dbType -ne "DATASTORE_MODE") {
        Write-Host "⚠️ WARNING: The existing database is in $dbType mode." -ForegroundColor Red
        Write-Host "   This project requires DATASTORE_MODE. Firestore modes cannot be changed after creation." -ForegroundColor Red
        Write-Host "   If you face errors, you may need to use a different GCP project." -ForegroundColor Yellow
    }
} else {
    Write-Host "Creating Firestore database in Datastore Mode..." -ForegroundColor Yellow
    gcloud firestore databases create --location=$dbLocation --type="datastore-mode"
    Check-LastExitCode "Failed to create Datastore mode database."
    Write-Host "✅ Datastore Mode database created in $dbLocation." -ForegroundColor Green
}

# 6. Configure IAM permissions for Cloud Run service account
Write-Host "`n[IAM] Configuring permissions for Cloud Run service account..." -ForegroundColor Cyan
Write-Host "Retrieving project number..." -ForegroundColor Yellow
$projectNumber = gcloud projects describe $PROJECT_ID --format="value(projectNumber)"
Check-LastExitCode "Failed to retrieve project number."

$saEmail = "$($projectNumber.Trim())-compute@developer.gserviceaccount.com"
Write-Host "Found default Compute Engine service account: $saEmail" -ForegroundColor Yellow
Write-Host "Binding Cloud Datastore User (roles/datastore.user) role..." -ForegroundColor Yellow

gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:$saEmail" `
    --role="roles/datastore.user"

if ($LastExitCode -ne 0) {
    Write-Host "⚠️ Warning: Failed to bind IAM policy." -ForegroundColor Yellow
    Write-Host "This usually happens if the default Compute Engine service account has not been created yet." -ForegroundColor Yellow
    Write-Host "It will be automatically created when you deploy to Cloud Run for the first time." -ForegroundColor Yellow
    Write-Host "After your first deployment, please run this command manually:" -ForegroundColor Yellow
    Write-Host "gcloud projects add-iam-policy-binding $PROJECT_ID --member=`"serviceAccount:$saEmail`" --role=`"roles/datastore.user`"" -ForegroundColor Cyan
} else {
    Write-Host "✅ IAM policy binding completed." -ForegroundColor Green
}

# 7. Configure Application Default Credentials (ADC) for local development/scripts
Write-Host "`n[LOCAL SETUP] Configuring Application Default Credentials (ADC)..." -ForegroundColor Cyan
$adcChoice = Read-Host "Do you want to log in to Application Default Credentials (ADC)? (Y/N) [Default: Y]"
if ($adcChoice -notmatch "^[Nn]") {
    Write-Host "Running gcloud auth application-default login..." -ForegroundColor Yellow
    gcloud auth application-default login
    Check-LastExitCode "Failed to set up Application Default Credentials."
    Write-Host "✅ ADC configuration complete." -ForegroundColor Green
}

# 8. Upload Whitelist data to Datastore
Write-Host "`n[WHITELIST] Uploading Whitelist data to Datastore..." -ForegroundColor Cyan
$whitelistChoice = Read-Host "Do you want to upload the whitelist from whitelist.json now? (Y/N) [Default: Y]"
if ($whitelistChoice -notmatch "^[Nn]") {
    # Check if whitelist.json exists. If not, copy from whitelist.json.example
    if (!(Test-Path "whitelist.json")) {
        if (Test-Path "whitelist.json.example") {
            Write-Host "whitelist.json not found. Copying from whitelist.json.example..." -ForegroundColor Yellow
            Copy-Item "whitelist.json.example" "whitelist.json"
            Write-Host "Created whitelist.json. Please edit it to customize your whitelist." -ForegroundColor Yellow
        } else {
            Write-Host "⚠️ Warning: Neither whitelist.json nor whitelist.json.example found." -ForegroundColor Red
        }
    }

    if (Test-Path "whitelist.json") {
        # Check if Python is installed
        if (Get-Command python -ErrorAction SilentlyContinue) {
            # Try installing dependencies
            Write-Host "Installing Python dependencies (google-cloud-datastore)..." -ForegroundColor Yellow
            pip install -r requirements.txt
            Check-LastExitCode "Failed to install Python dependencies."
            
            Write-Host "Running upload_whitelist.py..." -ForegroundColor Yellow
            python scripts/upload_whitelist.py
            Check-LastExitCode "Failed to upload whitelist."
        } else {
            Write-Host "⚠️ Python is not installed or not in PATH. Skipping automated upload." -ForegroundColor Yellow
            Write-Host "Please run 'python scripts/upload_whitelist.py' manually later." -ForegroundColor Yellow
        }
    }
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "🎉 GCP Project Setup Completed Successfully! 🎉" -ForegroundColor Green
Write-Host "You are now ready to build and deploy your app." -ForegroundColor Green
Write-Host "Run '.\deploy.ps1' to deploy to Google Cloud Run." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
