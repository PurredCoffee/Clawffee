{
  description = "Clawffee - A simple Twitch bot tool for streamers!";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    treefmt-nix.inputs.nixpkgs.follows = "nixpkgs";
  };
  outputs =
    inputs:
    let
      buildPackages =
        pkgs:
        pkgs.lib.makeScope pkgs.newScope (self: {
          webview = self.callPackage ./nix/webview.nix { };
          clawffee = self.callPackage ./nix/clawffee.nix { };
        });
    in
    inputs.flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import inputs.nixpkgs { inherit system; };
        treefmt = (inputs.treefmt-nix.lib.evalModule pkgs ./nix/treefmt.nix).config.build;
      in
      {
        packages = rec {
          inherit (buildPackages pkgs) clawffee;
          default = clawffee;
        };
        devShells = rec {
          clawffee-dev = with buildPackages pkgs; callPackage ./nix/clawffee-dev.nix { };
          default = clawffee-dev;
        };
        formatter = treefmt.wrapper;
        checks = {
          formatting = treefmt.check inputs.self;
        };
      }
    )
    // {
      overlays = rec {
        clawffee = final: _prev: {
          inherit (buildPackages final) clawffee;
        };
        default = clawffee;
      };
      homeModules = rec {
        clawffee =
          {
            lib,
            pkgs,
            config,
            ...
          }:
          let
            cfg = config.programs.clawffee;
          in
          {
            options.programs.clawffee = {
              enable = lib.mkEnableOption "clawffee";
              package = lib.mkOption {
                type = lib.types.package;
                default = (buildPackages pkgs).clawffee;
                description = "The clawffee package to use.";
              };
            };

            config = lib.mkIf cfg.enable {
              home.packages = [
                cfg.package
              ];
            };
          };
        default = clawffee;
      };
      nixosModules = rec {
        clawffee =
          {
            lib,
            pkgs,
            config,
            ...
          }:
          let
            cfg = config.programs.clawffee;
          in
          {
            options.programs.clawffee = {
              enable = lib.mkEnableOption "clawffee";
              package = lib.mkOption {
                type = lib.types.package;
                default = (buildPackages pkgs).clawffee;
                description = "The clawffee package to use.";
              };
            };

            config = lib.mkIf cfg.enable {
              environment.systemPackages = [
                cfg.package
              ];
            };
          };
        default = clawffee;
      };
    };
}
