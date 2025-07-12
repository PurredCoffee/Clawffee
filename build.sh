
# init
cd "$(dirname "$0")"

# clone the git repository into build
if [ -d "build" ]; then
    rm -rf build
fi

git clone . build

# delete unnecessary files
cd build
rm -rf build/.git
rm -r .vscode/
rm .gitignore
rm -r assets/
rm -r internal/
rm index.js
rm README.md
echo "{
  \"dependencies\": {
  },
  \"imports\": {
    \"#helpers\": \"./plugins/builtin/helpers.js\",
    \"#helper\": \"./plugins/builtin/helpers.js\"
  }
}" > package.json
rm build.sh

cd ..

# linux export
bun build index.js --target=bun-linux-x64 --compile --minify --bytecode --outfile build/clawffee
zip -ll clawffee_linux.zip build/*

# windows export
bun build index.js --target=bun-windows-x64 --compile --minify --windows-icon=assets/clawffee.ico --bytecode --outfile build/clawffee
zip -l clawffee_windows.zip build/*

# macOS export
bun build --compile --target=bun-darwin-arm64 ./path/to/my/app.ts --outfile build/clawffee
zip -ll clawffee_darwin.zip build/*