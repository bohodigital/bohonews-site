#!/bin/sh
set -eu

ROOT="public/media/newsroom/2026/08/manual-20260810-065029"
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

make_lead "$ASSETS/treasury.jpg" "$ROOT/cbo-june-budget/treasury" center
make_lead "$ASSETS/field-of-dreams.jpg" "$ROOT/field-of-dreams/dyersville" center
make_lead "$ASSETS/ship-wake.jpg" "$ROOT/nws-sea-state/ship-wake" center
make_lead "$ASSETS/dhaka-street.jpg" "$ROOT/imf-bangladesh/dhaka-street" center
make_lead "$ASSETS/card-payment.jpg" "$ROOT/fed-consumer-credit/card-payment" center
make_lead "$ASSETS/arkansas-classroom.jpg" "$ROOT/arkansas-education/classroom" center

chart "$ROOT/cbo-june-budget/balance/four-three.webp" "Federal budget balance" "Deficit: \$1.4 trillion" "\$35B above prior year" "First 9 months of FY2026" "Source: CBO, July 9, 2026"
chart "$ROOT/cbo-june-budget/flows/four-three.webp" "Revenue and outlays" "Revenue: +\$142B" "Outlays: +\$178B" "4% versus 3% growth" "Source: Congressional Budget Office"

chart "$ROOT/field-of-dreams/two-games/four-three.webp" "Two games in Dyersville" "Aug. 11: Triple-A" "Aug. 13: Twins-Phillies" "Separate ticketed events" "Source: Major League Baseball"
chart "$ROOT/field-of-dreams/history/four-three.webp" "Field of Dreams history" "MLB games: 2021, 2022" "Third edition: 2026" "First global Netflix stream" "Source: MLB, June 4, 2026"

chart "$ROOT/nws-sea-state/frequency/four-three.webp" "Full-ocean schedule" "Atlantic: 00 and 12 UTC" "Pacific: 00 and 12 UTC" "Twice daily for each basin" "Source: National Weather Service"
chart "$ROOT/nws-sea-state/products/four-three.webp" "Proposed product change" "8 regional products end" "2 full-ocean headings added" "Comments due Aug. 31" "Source: NWS statement 26-56"

chart "$ROOT/imf-bangladesh/growth-outlook/four-three.webp" "Bangladesh outlook" "FY2027 growth: 3.5%" "Medium term: below 3%" "Without decisive reforms" "Source: IMF staff, July 16, 2026"
chart "$ROOT/imf-bangladesh/reform-areas/four-three.webp" "Reform areas" "Raise revenue" "Rebuild reserves" "Restructure banking sector" "Source: IMF end-of-mission statement"

chart "$ROOT/fed-consumer-credit/growth/four-three.webp" "June credit growth" "Total: 3.3% annual rate" "Revolving: 6.0%" "Nonrevolving: 2.3%" "Source: Federal Reserve G.19"
chart "$ROOT/fed-consumer-credit/balances/four-three.webp" "Credit outstanding" "Total: \$5.17 trillion" "Revolving: \$1.35T" "Nonrevolving: \$3.82T" "Source: Federal Reserve, June 2026"

chart "$ROOT/arkansas-education/funding/four-three.webp" "Arkansas waiver" "More than \$8.8 million" "4 federal funding streams" "Consolidated over 4 years" "Source: U.S. Department of Education"
chart "$ROOT/arkansas-education/flexibilities/four-three.webp" "New flexibilities" "Ed-Flex authority" "Advanced assessments" "Alternative-learning records" "Source: Education Department"
