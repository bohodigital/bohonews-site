#!/usr/bin/env bash
set -euo pipefail
dest="$1"
mkdir -p "$dest"
curl -fL --retry 3 --connect-timeout 20 -A 'BohoNews/1.0 editorial-rights-audit' 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/CFTC_headquarters%2C_Lafayette_Center.jpg/1920px-CFTC_headquarters%2C_Lafayette_Center.jpg' -o "$dest/cftc-headquarters.jpg"
curl -fL --retry 3 --connect-timeout 20 -A 'BohoNews/1.0 editorial-rights-audit' 'https://upload.wikimedia.org/wikipedia/commons/5/53/Citizen_scientist_sampling_in_Rocky_Mountain_National_Park._%2847428bc9-1dd8-b71b-0be5-bd49b6789d5b%29.jpg' -o "$dest/citizen-scientist.jpg"
curl -fL --retry 3 --connect-timeout 20 -A 'BohoNews/1.0 editorial-rights-audit' 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Exterior_view_looking_west_showing_%22new%22_pumping_station._-_Burnsville_Natural_Gas_Pumping_Station%2C_Saratoga_Avenue_between_Little_Kanawha_River_and_CandO_Railroad_line%2C_HAER_WVA%2C4-BURN%2C1-12.tif/lossy-page1-3840px-thumbnail.tif.jpg' -o "$dest/burnsville-station.jpg"
curl -fL --retry 3 --connect-timeout 20 -A 'BohoNews/1.0 editorial-rights-audit' 'https://upload.wikimedia.org/wikipedia/commons/6/6e/SBNMS_North_Atlantic_right_whale_%2850040735308%29.jpg' -o "$dest/right-whale.jpg"
curl -fL --retry 3 --connect-timeout 20 -A 'BohoNews/1.0 editorial-rights-audit' 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Hubert_H._Humphrey_Building%2C_located_at_the_foot_of_Capitol_Hill%2C_Washington%2C_D.C_LCCN2013634632.jpg/3840px-Hubert_H._Humphrey_Building%2C_located_at_the_foot_of_Capitol_Hill%2C_Washington%2C_D.C_LCCN2013634632.jpg' -o "$dest/hhs-humphrey-building.jpg"
curl -fL --retry 3 --connect-timeout 20 -A 'BohoNews/1.0 editorial-rights-audit' 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/New_Hayward_Field_on_the_University_of_Oregon_campus_%2850234524032%29.jpg/3840px-New_Hayward_Field_on_the_University_of_Oregon_campus_%2850234524032%29.jpg' -o "$dest/hayward-field.jpg"
file "$dest"/*
shasum -a 256 "$dest"/*
