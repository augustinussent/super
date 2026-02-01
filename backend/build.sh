#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Fetching Prisma binaries..."
python -m prisma py fetch

echo "Generating Prisma Client..."
python -m prisma generate

echo "Build script completed successfully."
