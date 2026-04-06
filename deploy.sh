#!/bin/bash
cd /root/avo-po

# Frontend
npm install
npm run build
cp -r dist/. /var/www/avo-po/

# API (Java Spring Boot)
cd /root/avo-po/api-java
mvn clean package -DskipTests
systemctl restart pspay-api

echo "avo-po deployed successfully"
