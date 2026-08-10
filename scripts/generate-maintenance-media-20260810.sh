#!/bin/sh
set -eu

ROOT="public/media/newsroom/2026/08/manual-20260810"
ASSETS="$ROOT/assets"

make_lead() {
  src="$1"
  dest="$2"
  mkdir -p "$dest"
  magick "$src" -auto-orient -resize '1600x900^' -gravity center -extent 1600x900 -strip -quality 84 "$dest/lead.webp"
  magick "$src" -auto-orient -resize '900x600^' -gravity center -extent 900x600 -strip -quality 82 "$dest/card.webp"
  magick "$src" -auto-orient -resize '1200x1200^' -gravity center -extent 1200x1200 -strip -quality 82 "$dest/square-social.webp"
  magick "$src" -auto-orient -resize '1200x900^' -gravity center -extent 1200x900 -strip -quality 82 "$dest/four-three.webp"
  magick "$src" -auto-orient -resize '1280x720^' -gravity center -extent 1280x720 -strip -quality 82 "$dest/sixteen-nine.webp"
  magick "$src" -auto-orient -resize '1200x630^' -gravity center -extent 1200x630 -strip -quality 82 "$dest/open-graph.webp"
  magick "$src" -auto-orient -resize '720x480^' -gravity center -extent 720x480 -strip -quality 80 "$dest/compact-mobile.webp"
}

chart() {
  dest="$1"
  title="$2"
  line1="$3"
  line2="$4"
  line3="$5"
  foot="$6"
  mkdir -p "$(dirname "$dest")"
  magick -size 1200x900 canvas:'#f3eee5' \
    -fill '#171717' -font Arial-Bold -pointsize 58 -gravity northwest -annotate +72+82 "$title" \
    -fill '#a43b2d' -draw 'roundrectangle 72,180 1128,194 7,7' \
    -fill '#171717' -font Arial-Bold -pointsize 46 -annotate +88+285 "$line1" \
    -fill '#171717' -font Arial-Bold -pointsize 46 -annotate +88+430 "$line2" \
    -fill '#171717' -font Arial-Bold -pointsize 46 -annotate +88+575 "$line3" \
    -fill '#5b554c' -font Arial -pointsize 25 -annotate +88+790 "$foot" \
    -strip -quality 84 "$dest"
  dir="$(dirname "$dest")"
  magick "$dest" -resize '1600x900^' -gravity center -extent 1600x900 -strip -quality 84 "$dir/lead.webp"
  magick "$dest" -resize '900x600^' -gravity center -extent 900x600 -strip -quality 82 "$dir/card.webp"
  magick "$dest" -resize '1200x1200^' -gravity center -extent 1200x1200 -strip -quality 82 "$dir/square-social.webp"
  magick "$dest" -resize '1280x720^' -gravity center -extent 1280x720 -strip -quality 82 "$dir/sixteen-nine.webp"
  magick "$dest" -resize '1200x630^' -gravity center -extent 1200x630 -strip -quality 82 "$dir/open-graph.webp"
  magick "$dest" -resize '720x480^' -gravity center -extent 720x480 -strip -quality 80 "$dir/compact-mobile.webp"
}

make_lead "$ASSETS/nih-lab.jpg" "$ROOT/nih-cancer-models/nih-nci-lab"
make_lead "$ASSETS/nist-campus.jpg" "$ROOT/nist-august-tour/nist-gaithersburg-campus"
make_lead "$ASSETS/womens-golf.jpg" "$ROOT/farah-okeefe-lpga/female-golfer-green"
make_lead "$ASSETS/sargassum.jpg" "$ROOT/nasa-sargassum-2026/sargassum-pace-map"
make_lead "$ASSETS/salta-road.jpg" "$ROOT/world-bank-salta/salta-road-scene"
make_lead "$ASSETS/loc-great-hall.jpg" "$ROOT/loc-pascali-concert/loc-great-hall"

chart "$ROOT/nih-cancer-models/hcmi-compendium/four-three.webp" "HCMI compendium" "665 laboratory models" "25 cancer types" "2,780 patient donors" "Source: NIH, Aug. 5, 2026"
chart "$ROOT/nih-cancer-models/hcmi-agreement/four-three.webp" "Tumor-model agreement" "97.8% genetic alterations" "95% epigenetic features" "92% RNA expression" "Source: NIH analysis of 421 paired sets"

chart "$ROOT/nist-august-tour/nist-tour-timeline/four-three.webp" "NIST August tour" "Registration closes Aug. 12" "Tour: Aug. 19, 5:30–7 p.m." "Gaithersburg, Maryland" "Source: NIST event notice"
chart "$ROOT/nist-august-tour/nist-lab-options/four-three.webp" "Choose one lab visit" "Million Pounds-Force machine" "NanoFab semiconductor facility" "Capacity is first-come" "Source: NIST event notice"

chart "$ROOT/farah-okeefe-lpga/okeefe-ncaa-rounds/four-three.webp" "O’Keefe at NCAAs" "Rounds: 69 • 69 • 68 • 70" "Tournament total: 12 under" "Victory margin: 2 strokes" "Source: NCAA and Texas Athletics"
chart "$ROOT/farah-okeefe-lpga/okeefe-season/four-three.webp" "2025–26 season" "4 tournament victories" "Top 10 in all 12 events" "NCAA individual champion" "Source: Texas Athletics"

chart "$ROOT/nasa-sargassum-2026/sargassum-regions/four-three.webp" "June 2026 Sargassum" "Eastern Caribbean: 9.0M tons" "Gulf: 5.0M tons" "Western Caribbean: 3.6M tons" "Source: NASA Earth Observatory / USF"
chart "$ROOT/nasa-sargassum-2026/sargassum-record/four-three.webp" "A near-record belt" "2026: second-highest year" "Caribbean and Gulf set records" "Gulf nearly doubled 2025" "Source: NASA Earth Observatory / USF"

chart "$ROOT/world-bank-salta/salta-project-scale/four-three.webp" "Salta project scale" "World Bank financing: \$100M" "Route 51 work: 24 km" "Loan: 32 years; 7-year grace" "Source: World Bank, July 6, 2026"
chart "$ROOT/world-bank-salta/salta-project-parts/four-three.webp" "Four investment tracks" "Route 51 + logistics hub" "Water + wastewater systems" "Mining data + governance" "Source: World Bank project announcement"

chart "$ROOT/loc-pascali-concert/pascali-event/four-three.webp" "Amanda Pascali at LOC" "Thursday, Aug. 13" "7 p.m. • Coolidge Auditorium" "Free registration required" "Source: Library of Congress"
chart "$ROOT/loc-pascali-concert/loc-august-music/four-three.webp" "Live! at the Library" "Aug. 6 • K-pop + Apollo 13" "Aug. 13 • Amanda Pascali" "Aug. 27 • Tray Wellington" "Source: Library of Congress August program"
