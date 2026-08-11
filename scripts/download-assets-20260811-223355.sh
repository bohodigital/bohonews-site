#!/usr/bin/env bash
set -euo pipefail
dest="$1"
mkdir -p "$dest"
curl -fL --retry 3 --connect-timeout 20 -A 'BohoNews/1.0 editorial-rights-audit' 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Public_Participation_and_Agency_Requirements_in_NRC%27s_Regulatory_Process_-_Jan._31%2C_2013_%288448029818%29.jpg' -o "$dest/nrc-public-meeting.jpg"
curl -fL --retry 3 --connect-timeout 20 -A 'BohoNews/1.0 editorial-rights-audit' 'https://commons.wikimedia.org/wiki/Special:Redirect/file/First_Citizens_Bank_Beaufort.jpg' -o "$dest/bank-branch.jpg"
curl -fL --retry 3 --connect-timeout 20 -A 'BohoNews/1.0 editorial-rights-audit' 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cybersecurity_Operations_at_Port_San_Antonio.jpg' -o "$dest/cyber-operations.jpg"
curl -fL --retry 3 --connect-timeout 20 -A 'BohoNews/1.0 editorial-rights-audit' 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Lime_scooter_on_National_Mall%2C_April_2019.jpg' -o "$dest/national-mall-scooter.jpg"
curl -fL --retry 3 --connect-timeout 20 -A 'BohoNews/1.0 editorial-rights-audit' 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Wikipedia_workshop_at_Palermo_University_3_-_Hackathon_Wikimedia_Palermo_2025.jpg' -o "$dest/open-source-workshop.jpg"
curl -fL --retry 3 --connect-timeout 20 -A 'BohoNews/1.0 editorial-rights-audit' 'https://commons.wikimedia.org/wiki/Special:Redirect/file/20130920-USDA-OC-PSD-0045_Agriculture_in_the_United_States.jpg' -o "$dest/zucchini-packing.jpg"
file "$dest"/*
sha256sum "$dest"/*
