#!/bin/bash
cd /root/avo-po
git pull origin master
npm install
npm run build
cp -r dist/. /var/www/avo-po/
echo "avo-po deployed successfully"
