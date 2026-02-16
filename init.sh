#!/bin/bash
set -e

npm install

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "⚠️  Fill in .env.local with your API keys"
fi

npm run dev
