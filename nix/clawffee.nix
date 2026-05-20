{
  lib,
  stdenvNoCC,
  makeDesktopItem,
  copyDesktopItems,
  makeBinaryWrapper,
  webview,
  yad,
  libnotify,
  bun,
  gst_all_1,
}:
let
  fullSrc = ./..;
  meta = builtins.fromJSON (builtins.readFile (fullSrc + /internals/meta.json));
  findLib =
    isFile: libPackages:
    builtins.head (
      builtins.concatMap (
        drv:
        let
          path = drv.out + /lib;
          fileNames = builtins.attrNames (builtins.readDir path);
        in
        lib.optionals (builtins.pathExists path) (
          builtins.concatMap (fileName: lib.optional (isFile fileName) "${path}/${fileName}") fileNames
        )
      ) libPackages
    );
  setDefault =
    name: value:
    assert lib.isValidPosixName name;
    "--set-default ${name} ${lib.escapeShellArg value}";
  setDefaults = env: lib.concatStringsSep " " (lib.mapAttrsToList setDefault env);
in
stdenvNoCC.mkDerivation (finalAttrs: {
  strictDeps = true;
  __structuredAttrs = true;

  pname = "clawffee";
  inherit (meta) version;
  src = lib.cleanSourceWith {
    src = fullSrc;
    filter =
      path: type:
      builtins.all (fn: fn path type) [
        # only include these paths (prefix)
        (
          path: type:
          (builtins.any (prefix: lib.path.hasPrefix (fullSrc + prefix) (/. + path)) [
            /assets
            /internals
            /bun.lock
            /index.js
            /internal.pub.txt
            /launch.js
            /LICENSE
            /package.json
            /README.md
          ])
        )
        # and exclude files known to be unwanted
        lib.cleanSourceFilter
      ];
  };

  desktopItems = lib.optionals stdenvNoCC.isLinux [
    (makeDesktopItem {
      name = "clawffee";
      exec = "clawffee --xdg";
      icon = "clawffee";
      desktopName = "Clawffee";
      genericName = "Twitch Bot";
      comment = finalAttrs.meta.description;
      terminal = true;
      categories = [
        "Development"
        "Utility"
      ];
    })
  ];

  nativeBuildInputs = [
    makeBinaryWrapper
  ]
  ++ lib.optionals stdenvNoCC.isLinux [
    copyDesktopItems
  ];

  binPackages = [
    libnotify
  ]
  ++ lib.optionals stdenvNoCC.isLinux [
    yad
  ];
  binPath = lib.makeBinPath finalAttrs.binPackages;

  libPackages = [
    webview
  ]
  ++ lib.optionals stdenvNoCC.isLinux [
    gst_all_1.gst-plugins-base
    gst_all_1.gst-plugins-good
    gst_all_1.gst-plugins-bad
    gst_all_1.gstreamer
  ];
  libPath = lib.makeLibraryPath finalAttrs.libPackages;

  runtimeEnv =
    lib.optionalAttrs stdenvNoCC.isLinux {
      WEBVIEW_PATH = findLib (fileName: fileName == "libwebview.so") finalAttrs.libPackages;
      GST_PLUGIN_PATH = findLib (fileName: fileName == "gstreamer-1.0") finalAttrs.libPackages;
    }
    // lib.optionalAttrs stdenvNoCC.isDarwin {
      WEBVIEW_PATH = findLib (fileName: fileName == "libwebview.dylib") finalAttrs.libPackages;
    };

  env = finalAttrs.runtimeEnv;

  runtimePackage = bun;
  runtimePath = lib.getExe finalAttrs.runtimePackage;

  passthru = {
    inherit webview;
  };

  installPhase = ''
    runHook preInstall

    mkdir -p "$out/share/clawffee"
    cp -r "$src/." "$out/share/clawffee/"

    mkdir -p "$out/share/pixmaps"
    ln -s "$out/share/clawffee/assets/clawffee.png" "$out/share/pixmaps/clawffee.png"

    makeBinaryWrapper "$runtimePath" "$out/bin/clawffee" \
          ${setDefaults finalAttrs.runtimeEnv} \
          --inherit-argv0 \
          --add-flag "$out/share/clawffee/index.js" \
          --add-flag -- \
          --prefix PATH ':' "$binPath" \
          --prefix LD_LIBRARY_PATH ':' "$libPath"

    runHook postInstall
  '';

  meta = {
    description = "A simple Twitch bot tool for streamers!";
    homepage = "https://clawffee.com/";
    license = lib.licenses.bsd3;
    platforms = [
      "aarch64-linux"
      "x86_64-linux"
      "aarch64-darwin"
      "x86_64-darwin"
    ];
    mainProgram = "clawffee";
  };
})
