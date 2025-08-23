
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
rm -r html
rm index.js
rm dashboard.js
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
bun build --compile index.js plugins/internal/_internal/dashboard.js --minify --outfile build/clawffee
mv build clawffee_linux
zip -r -ll clawffee_linux.zip clawffee_linux/*
mv clawffee_linux build
