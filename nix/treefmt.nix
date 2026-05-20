{
  projectRootFile = ".git/config";
  programs = {
    nixfmt.enable = true;
    nixf-diagnose.enable = true;
  };
  settings.on-unmatched = "warn";
  settings.walk = "git";
  settings.excludes = [
  ];
}
