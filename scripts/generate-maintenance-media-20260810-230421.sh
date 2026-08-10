#!/bin/sh
set -eu

ROOT="public/media/newsroom/2026/08/manual-20260810-230421"
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

make_lead "$ASSETS/mobile-cell-tower.jpg" "$ROOT/gao-covered-telecom/mobile-cell-tower" center
make_lead "$ASSETS/asheville-courtroom.jpg" "$ROOT/ussc-guideline-ranges/asheville-courtroom" center
make_lead "$ASSETS/nist-vials.jpg" "$ROOT/nist-chemical-fingerprints/lab-vials" center
make_lead "$ASSETS/census-headquarters.jpg" "$ROOT/census-household-trends/suitland-headquarters" center
make_lead "$ASSETS/los-angeles-haze.jpg" "$ROOT/noaa-urban-air-chemistry/los-angeles-haze" center
make_lead "$ASSETS/banjul-downtown.jpg" "$ROOT/imf-gambia/banjul-downtown" center

chart "$ROOT/gao-covered-telecom/agency-results/four-three.webp" "Six-agency review" "4 reported none" "2 reported little" "Defense found 3 instances" "Source: U.S. Government Accountability Office"
chart "$ROOT/gao-covered-telecom/search-methods/four-three.webp" "Equipment searches" "Hardware inventories" "Network + record scans" "Physical searches" "Source: U.S. Government Accountability Office"

chart "$ROOT/ussc-guideline-ranges/outcomes/four-three.webp" "Guideline-range outcomes" "59.1% within range" "29.4% below range" "4.4% above range" "Source: U.S. Sentencing Commission"
chart "$ROOT/ussc-guideline-ranges/case-counts/four-three.webp" "Preliminary FY2026 data" "32,586 cases reported" "196 excluded" "Through March 31" "Source: U.S. Sentencing Commission"

chart "$ROOT/nist-chemical-fingerprints/electron-ionization/four-three.webp" "Electron ionization library" "35,000 additions" "382,180+ compounds" "Vaporized samples" "Source: National Institute of Standards and Technology"
chart "$ROOT/nist-chemical-fingerprints/tandem-library/four-three.webp" "Tandem library" "17,000 additions" "68,635 substances" "Liquid samples" "Source: National Institute of Standards and Technology"

chart "$ROOT/census-household-trends/sample-topics/four-three.webp" "Household trends survey" "About 136,000 homes" "March 2026 responses" "Jobs, costs, well-being" "Source: U.S. Census Bureau"
chart "$ROOT/census-household-trends/release-cycle/four-three.webp" "Rapid household data" "Experimental product" "Every other month" "National + local tables" "Source: U.S. Census Bureau"

chart "$ROOT/noaa-urban-air-chemistry/radical-lifetimes/four-three.webp" "Urban reaction windows" "17 sec: NYC/CHI/TOR" "7 sec: Los Angeles" "Lower NOx changes chemistry" "Source: NOAA Chemical Sciences Laboratory"
chart "$ROOT/noaa-urban-air-chemistry/isomerization/four-three.webp" "Modeled pathway shares" "12-17% alpha-pinene" "44% 2-ethoxyethanol" "Nearly 50% hexanal" "Source: NOAA / Science Advances"

chart "$ROOT/imf-gambia/disbursements/four-three.webp" "Immediate IMF financing" "SDR 16.58 million" 'About $22.51 million' "Two program reviews" "Source: International Monetary Fund"
chart "$ROOT/imf-gambia/growth-path/four-three.webp" "Gambia growth outlook" "2025: 6.0%" "2026: 4.7%" "Medium term: about 5%" "Source: International Monetary Fund"
