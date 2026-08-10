#!/bin/sh
set -eu

ROOT="public/media/newsroom/2026/08/manual-20260810-055829"
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

make_lead "$ASSETS/head-start.png" "$ROOT/family-program-performance/head-start-staff" center
make_lead "$ASSETS/fbi-training.jpg" "$ROOT/federal-officers/fbi-training" center
make_lead "$ASSETS/orchestra.jpg" "$ROOT/koussevitzky-commissions/orchestra-concert" center
make_lead "$ASSETS/grocery-aisle.jpg" "$ROOT/fda-bht/grocery-aisle" center
make_lead "$ASSETS/hubble-servicing.jpg" "$ROOT/robotic-servicing/hubble-eva" center
make_lead "$ASSETS/public-works.jpg" "$ROOT/public-pensions/public-works" center

chart "$ROOT/family-program-performance/system-count/four-three.webp" "Performance systems" "15 programs reviewed" "12 had all three processes" "3 had a missing process" "Source: GAO-26-109130"
chart "$ROOT/family-program-performance/three-steps/four-three.webp" "Three-part cycle" "Set program goals" "Measure progress" "Use evidence to improve" "Source: GAO, July 21, 2026"

chart "$ROOT/federal-officers/agency-count/four-three.webp" "Federal officers, 2023" "133,798 full-time officers" "88 federal agencies" "65,106 worked in DHS" "Source: Bureau of Justice Statistics"
chart "$ROOT/federal-officers/workforce-profile/four-three.webp" "Workforce profile" "70% criminal investigation" "15% of officers were women" "14% of supervisors were women" "Source: BJS statistical tables"

chart "$ROOT/koussevitzky-commissions/six-composers/four-three.webp" "Six new commissions" "6 composers selected" "6 co-sponsoring partners" "New works for performance" "Source: Library of Congress"
chart "$ROOT/koussevitzky-commissions/commission-history/four-three.webp" "Commission history" "496 works commissioned" "2 Luening grants in 2026" "Next deadline Jan. 15, 2027" "Source: Koussevitzky Foundation"

chart "$ROOT/fda-bht/comment-window/four-three.webp" "BHT information request" "Comments due Aug. 31" "Docket FDA-2026-N-2526" "No new safety conclusion" "Source: FDA, July 29, 2026"
chart "$ROOT/fda-bht/food-uses/four-three.webp" "Where BHT may be used" "Cereals and frozen meals" "Baking mixes and cookies" "Gum and meat products" "Source: U.S. Food and Drug Administration"

chart "$ROOT/robotic-servicing/mission-parts/four-three.webp" "Robotic servicer" "1 mission vehicle" "2 robotic arms" "Bound for geosynchronous orbit" "Source: NASA, July 22, 2026"
chart "$ROOT/robotic-servicing/planned-tasks/four-three.webp" "Planned orbital work" "Inspect satellites" "Install extension pods" "Demonstrate remote servicing" "Source: NASA / DARPA"

chart "$ROOT/public-pensions/assets/four-three.webp" "Public pension assets" "2024: \$5.98 trillion" "2025: \$6.49 trillion" "Increase: 8.46%" "Source: U.S. Census Bureau"
chart "$ROOT/public-pensions/cash-flow/four-three.webp" "Pension cash flow" "\$315.02B contributions" "\$418.25B benefit payments" "37M+ participants" "Source: 2025 Annual Survey of Public Pensions"
