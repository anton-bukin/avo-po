#!/bin/bash
cd /root/avo-po

# Frontend
npm install
npm run build
cp -r dist/. /var/www/avo-po/

# API
cd /root/avo-po/api
npm install
pm2 restart pspay-api

echo "avo-po deployed successfully"
