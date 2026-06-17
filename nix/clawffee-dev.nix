{
  mkShellNoCC,
  clawffee,
  bun2nix,
}:
mkShellNoCC (finalAttrs: {
  pname = "${clawffee.pname}-dev";
  inherit (clawffee) version;
  env = clawffee.runtimeEnv;
  packages = clawffee.runtimeInputs ++ [
    clawffee.runtimePackage
    bun2nix
  ];
  shellHook = ''
    alias "$pname=env -a $pname bun $(printf %q "$(pwd)/launch") --"
    echo 'Run `clawffee-dev --help` on how to run the development build.'
    echo 'Run `bun2nix -o '"$(printf %q "$(pwd)/nix/bun.nix")"'` to update the bun dependencies for nix.'
  '';
})
