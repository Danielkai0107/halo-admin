#!/bin/bash

echo "========================================="
echo "LIFF 應用部署腳本"
echo "========================================="

# 構建 LIFF 應用
echo ""
echo "步驟 1/3: 構建 LIFF 應用..."
cd liff
npm run build
if [ $? -ne 0 ]; then
  echo "❌ LIFF 構建失敗"
  exit 1
fi
cd ..

# 複製到部署目錄
echo ""
echo "步驟 2/3: 複製構建文件..."
rm -rf dist/liff
mkdir -p dist/liff
cp -r liff/dist/* dist/liff/

# 部署
echo ""
echo "步驟 3/3: 部署到 Firebase..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
  echo ""
  echo "========================================="
  echo "✅ 部署成功！"
  echo "========================================="
  echo "LIFF URL: https://safe-net-tw.web.app/liff"
  echo ""
else
  echo ""
  echo "❌ 部署失敗"
  exit 1
fi
