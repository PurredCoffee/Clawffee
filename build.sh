
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
# rm build.sh

cd ..

bun build index.js --compile --minify --bytecode --outfile build/clawffee