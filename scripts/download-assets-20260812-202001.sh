#!/usr/bin/env bash
set -euo pipefail
dest="$1"
mkdir -p "$dest"
curl -fL --retry 3 --connect-timeout 20 -A 'BohoNews/1.0 editorial-rights-audit' 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Office_of_Personnel_Management_in_Washington%2C_D.C._2012.JPG' -o "$dest/opm-building.jpg"
curl -fL --retry 3 --connect-timeout 20 -A 'BohoNews/1.0 editorial-rights-audit' 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Swayambhunath_temple_-_an_ancient_religious_architecture_of_Nepal.jpg' -o "$dest/swayambhunath.jpg"
curl -fL --retry 3 --connect-timeout 20 -A 'BohoNews/1.0 editorial-rights-audit' 'https://commons.wikimedia.org/wiki/Special:Redirect/file/N1015X_Air_Tahiti_Nui_Boeing_787-9_Dreamliner_27.jpg' -o "$dest/boeing-787.jpg"
curl -fL --retry 3 --connect-timeout 20 -A 'BohoNews/1.0 editorial-rights-audit' 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Belt_Railway_of_Chicago_Clearing_Yard%2C_Chicago%2C_Illinois_%2811004306644%29.jpg' -o "$dest/clearing-yard.jpg"
curl -fL --retry 3 --connect-timeout 20 -A 'BohoNews/1.0 editorial-rights-audit' 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Pathologists_looking_into_microscopes_%281%29.jpg' -o "$dest/pathologists.jpg"
curl -fL --retry 3 --connect-timeout 20 -A 'BohoNews/1.0 editorial-rights-audit' 'https://commons.wikimedia.org/wiki/Special:Redirect/file/United_States_Mint_Philadelphia.jpg' -o "$dest/philadelphia-mint.jpg"
file "$dest"/*
shasum -a 256 "$dest"/*
