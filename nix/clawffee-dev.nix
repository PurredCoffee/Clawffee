{
  mkShellNoCC,
  clawffee,
}:
mkShellNoCC (finalAttrs: {
  pname = "${clawffee.pname}-dev";
  inherit (clawffee)
    version
    env
    binPath
    libPath
    ;
  packages = [ clawffee.runtimePackage ];
  shellHook = ''
    if [[ ! -z "$binPath" ]]; then
      PATH="$binPath''${PATH:+:''${PATH}}"
    fi
    if [[ ! -z "$libPath" ]]; then
      LD_LIBRARY_PATH="$libPath''${LD_LIBRARY_PATH:+:''${LD_LIBRARY_PATH}}"
    fi
    alias "$pname=env -a $pname bun "$(printf %q "$(pwd)/launch")" --"
    env -a "$pname" bun "$(pwd)"/internals/shared -- --help
  '';
})
