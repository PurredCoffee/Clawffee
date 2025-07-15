
# init
cd "$(dirname "$0")"

# clone the git repository into build
if [ -d "build" ]; then
    rm -rf build
fi

git clone . build

# delete unnecessary files
cd build
rm -rf .git
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
bun build --compile --target=bun-linux-x64 index.js plugins/internal/_internal/dashboard.js --minify --bytecode --outfile build/clawffee
mv build clawffee_linux
zip -r -ll clawffee_linux.zip clawffee_linux/*
mv clawffee_linux build

# windows export
bun build --compile --target=bun-windows-x64 index.js plugins/internal/_internal/dashboard.js --minify --bytecode --outfile build/clawffee
mv build clawffee_windows
zip -r -l clawffee_windows.zip clawffee_windows/*
mv clawffee_windows build

# macOS export
bun build --compile --target=bun-darwin-arm64 index.js plugins/internal/_internal/dashboard.js --minify --bytecode --outfile build/clawffee
mv build clawffee_darwin
zip -r -ll clawffee_darwin.zip clawffee_darwin/*
mv clawffee_darwin build
