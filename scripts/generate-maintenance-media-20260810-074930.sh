#!/bin/sh
set -eu

ROOT="public/media/newsroom/2026/08/manual-20260810-074930"
ASSETS="$ROOT/assets"

make_lead() {
  src="$1"; dest="$2"; gravity="${3:-center}"
  mkdir -p "$dest"
  magick "$src" -auto-orient -resize '1600x900^' -gravity "$gravity" -extent 1600x900 -strip -quality 84 "$dest/lead.webp"
  magick "$src" -auto-orient -resize '900x600^' -gravity "$gravity" -extent 900x600 -strip -quality 82 "$dest/card.webp"
  magick "$src" -auto-orient -resize '1200x1200^' -gravity "$gravity" -extent 1200x1200 -strip -quality 82 "$dest/square-social.webp"
  magick "$src" -auto-orient -resize '1200x900^' -gravity "$gravity" -extent 1200x900 -strip -quality 82 "$dest/four-three.webp"
  magick "$src" -auto-orient -resize '1280x720^' -gravity "$gravity" -extent 1280x720 -strip -quality 82 "$dest/sixteen-nine.webp"
  magick "$src" -auto-orient -resize '1200x630^' -gravity "$gravity" -extent 1200x630 -strip -quality 82 "$dest/open-graph.webp"
  magick "$src" -auto-orient -resize '720x480^' -gravity "$gravity" -extent 720x480 -strip -quality 80 "$dest/compact-mobile.webp"
}

chart() {
  dest="$1"; title="$2"; line1="$3"; line2="$4"; line3="$5"; foot="$6"
  mkdir -p "$(dirname "$dest")"
  magick -size 1200x900 canvas:'#f3eee5' \
    -fill '#171717' -font Arial-Bold -pointsize 54 -gravity northwest -annotate +72+82 "$title" \
    -fill '#a43b2d' -draw 'roundrectangle 72,180 1128,194 7,7' \
    -fill '#171717' -font Arial-Bold -pointsize 42 -annotate +88+285 "$line1" \
    -fill '#171717' -font Arial-Bold -pointsize 42 -annotate +88+430 "$line2" \
    -fill '#171717' -font Arial-Bold -pointsize 42 -annotate +88+575 "$line3" \
    -fill '#5b554c' -font Arial -pointsize 24 -annotate +88+790 "$foot" \
    -strip -quality 84 "$dest"
  dir="$(dirname "$dest")"
  magick "$dest" -resize '1600x900^' -gravity center -extent 1600x900 -strip -quality 84 "$dir/lead.webp"
  magick "$dest" -resize '900x600^' -gravity center -extent 900x600 -strip -quality 82 "$dir/card.webp"
  magick "$dest" -resize '1200x1200^' -gravity center -extent 1200x1200 -strip -quality 82 "$dir/square-social.webp"
  magick "$dest" -resize '1280x720^' -gravity center -extent 1280x720 -strip -quality 82 "$dir/sixteen-nine.webp"
  magick "$dest" -resize '1200x630^' -gravity center -extent 1200x630 -strip -quality 82 "$dir/open-graph.webp"
  magick "$dest" -resize '720x480^' -gravity center -extent 720x480 -strip -quality 80 "$dir/compact-mobile.webp"
}

make_lead "$ASSETS/doctor-computer.jpg" "$ROOT/gao-va-disability/doctor-computer" center
make_lead "$ASSETS/police-patrol.jpg" "$ROOT/bjs-crime/police-patrol" center
make_lead "$ASSETS/capitol.jpg" "$ROOT/gao-congress/capitol" center
make_lead "$ASSETS/usta-east-gate.jpg" "$ROOT/usopen-field/east-gate" center
make_lead "$ASSETS/loc-reading-room.jpg" "$ROOT/loc-accessible/reading-room" center
make_lead "$ASSETS/nih-blood-bank.jpg" "$ROOT/nih-alzheimers/blood-bank" center

chart "$ROOT/gao-va-disability/program-scale/four-three.webp" "VA disability program" "More than \$195 billion" "More than 6.9 million people" "Fiscal year 2025" "Source: GAO, July 13, 2026"
chart "$ROOT/gao-va-disability/recommendations/four-three.webp" "GAO recommendations" "43 made since 2021" "28 implemented" "15 remain open" "Source: Government Accountability Office"

chart "$ROOT/bjs-crime/violent-rate/four-three.webp" "Violent-offense rate" "2023: 393.9" "2024: 370.8" "Per 100,000 people" "Source: BJS and FBI NIBRS estimates"
chart "$ROOT/bjs-crime/property-rate/four-three.webp" "Property-offense rate" "2023: 2,019.7" "2024: 1,835.1" "Down 9%" "Source: Bureau of Justice Statistics"

chart "$ROOT/gao-congress/open-matters/four-three.webp" "Congressional matters" "More than 1,150 since 2000" "277 remained open" "As of April 9, 2026" "Source: U.S. GAO"
chart "$ROOT/gao-congress/financial-benefits/four-three.webp" "Potential benefits" "53 matters identified" "13 at least \$1 billion" "Benefits are estimates" "Source: GAO-26-108896"

chart "$ROOT/usopen-field/headliners/four-three.webp" "Announced entrants" "Aryna Sabalenka" "Carlos Alcaraz & Jannik Sinner" "Jessica Pegula" "Source: U.S. Open / USTA"
chart "$ROOT/usopen-field/calendar/four-three.webp" "Singles calendar" "Qualifying: Aug. 24-27" "Main draw: Aug. 30" "Finals: Sept. 12-13" "Source: 2026 U.S. Open schedule"

chart "$ROOT/loc-accessible/awardees/four-three.webp" "Accessible-library awards" "Regional: Georgia" "Subregional: Worcester" "2026 honorees" "Source: Library of Congress"
chart "$ROOT/loc-accessible/criteria/four-three.webp" "Award criteria" "Mission support" "Service innovation" "Reader satisfaction" "Source: National Library Service"

chart "$ROOT/nih-alzheimers/cohort/four-three.webp" "Circular-RNA study" "More than 1,200 people" "Multiple cohorts" "34 circular RNAs" "Source: NIH, July 1, 2026"
chart "$ROOT/nih-alzheimers/window/four-three.webp" "Progression signal" "Nearly 3x symptom risk" "2 to 4 years" "Before symptom onset" "Source: NIH-funded study"
