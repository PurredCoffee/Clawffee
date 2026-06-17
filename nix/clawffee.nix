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
  bun2nix,
  gst_all_1,
}:
let
  fullSrc = ./..;
  meta = builtins.fromJSON (builtins.readFile (fullSrc + /internals/meta.json));
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

  nativeBuildInputs = [
    makeBinaryWrapper
    bun2nix.hook
  ]
  ++ lib.optionals stdenvNoCC.isLinux [
    copyDesktopItems
  ];

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

  bunDeps = bun2nix.fetchBunDeps {
    bunNix = ./bun.nix;
  };
  dontUseBunPatch = true;
  dontUseBunBuild = true;

  runtimePackage = bun;
  runtimeInputs = [
    libnotify
  ]
  ++ lib.optionals stdenvNoCC.isLinux [
    yad
  ];
  runtimeEnv =
    lib.optionalAttrs stdenvNoCC.isLinux {
      WEBVIEW_PATH = "${webview}/lib/libwebview.so";
      GST_PLUGIN_PATH = lib.makeLibraryPath [
        gst_all_1.gstreamer
        gst_all_1.gst-plugins-base
        gst_all_1.gst-plugins-good
        gst_all_1.gst-plugins-bad
        gst_all_1.gst-plugins-ugly
      ];
    }
    // lib.optionalAttrs stdenvNoCC.isDarwin {
      WEBVIEW_PATH = "${webview}/lib/libwebview.dylib";
    };

  passthru = {
    inherit webview;
  };

  installPhase = ''
    runHook preInstall

    mkdir -p "$out/share/clawffee"
    cp -r "./." "$out/share/clawffee/"

    mkdir -p "$out/share/pixmaps"
    ln -s "$out/share/clawffee/assets/clawffee.png" "$out/share/pixmaps/clawffee.png"

    ${lib.toShellVar "runtimePath" (lib.getExe finalAttrs.runtimePackage)}
    ${lib.toShellVar "binPath" (lib.makeBinPath finalAttrs.runtimeInputs)}
    ${lib.toShellVar "runtimeEnvArgs" (
      lib.concatMap (
        { name, value }:
        [
          "--set-default"
          (
            assert lib.isValidPosixName name;
            name
          )
          (lib.escapeShellArg value)
        ]
      ) (lib.attrsToList finalAttrs.runtimeEnv)
    )}

    makeBinaryWrapper "$runtimePath" "$out/bin/clawffee" \
          --inherit-argv0 \
          --add-flag "$out/share/clawffee/index.js" \
          --add-flag -- \
          --prefix PATH ':' "$binPath" \
          "''${runtimeEnvArgs[@]}"

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
