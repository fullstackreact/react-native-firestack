#!/bin/bash

echo "=> Transpiling..."
echo ""
export NODE_ENV=production
rm -rf ./dist
./node_modules/.bin/babel \
  --presets 'stage-0,react' \
  --ignore __tests__ \
  --out-dir ./dist \
  lib
echo ""
echo "=> Complete"
