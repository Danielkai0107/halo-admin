#!/bin/bash

echo "========================================="
echo "LIFF 應用部署腳本"
echo "========================================="

# 構建 LIFF 應用
echo ""
echo "步驟 1/2: 構建 LIFF 應用..."
cd liff
npm run build
if [ $? -ne 0 ]; then
  echo "❌ LIFF 構建失敗"
  exit 1
fi
cd ..

# 部署（Vite 已經直接輸出到 dist/liff）
echo ""
echo "步驟 2/2: 部署到 Firebase..."
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
