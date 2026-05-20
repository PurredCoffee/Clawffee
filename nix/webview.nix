{
  lib,
  stdenv,
  cmake,
  ninja,
  pkg-config,
  webkitgtk_6_0,
  gtk4,
  doxygen,
  graphviz,
  fetchFromGitHub,
  apple-sdk,
  llvmPackages,
}:
llvmPackages.stdenv.mkDerivation (finalAttrs: {
  pname = "webview";
  version = "0.12.0";
  src = fetchFromGitHub {
    owner = "webview";
    repo = "webview";
    rev = finalAttrs.version;
    hash = "sha256-pmqodl2fIlCNJTZz1U5spW4MpcoMhQt5WFh3+TRny3U=";
  };
  nativeBuildInputs = [
    ninja
    cmake
    llvmPackages.clang-tools
    pkg-config
    doxygen
    graphviz
  ];
  buildInputs =
    lib.optionals stdenv.isLinux [
      webkitgtk_6_0
      gtk4
    ]
    ++ lib.optional stdenv.isDarwin [
      apple-sdk
      llvmPackages.libcxx
    ];
  meta = {
    description = " Tiny cross-platform webview library for C/C++. Uses WebKit (GTK/Cocoa) and Edge WebView2 (Windows).";
    homepage = "https://github.com/webview/webview";
    license = lib.licenses.mit;
    platforms = [
      "aarch64-linux"
      "x86_64-linux"
      "aarch64-darwin"
      "x86_64-darwin"
    ];
  };
})
