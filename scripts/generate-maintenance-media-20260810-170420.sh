#!/bin/sh
set -eu

ROOT="public/media/newsroom/2026/08/manual-20260810-170420"
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

make_lead "$ASSETS/gsa.jpg" "$ROOT/gao-gsa-priority/gsa-headquarters" center
make_lead "$ASSETS/courthouse-new.tif" "$ROOT/ussc-robbery/minneapolis-courthouse" center
make_lead "$ASSETS/teachers.jpg" "$ROOT/loc-teachers/training-workshop" center
make_lead "$ASSETS/pentagon.jpg" "$ROOT/cbo-defense/pentagon-aerial" center
make_lead "$ASSETS/tennis.jpg" "$ROOT/usta-ceo/tennis-courts" center
make_lead "$ASSETS/dna.jpg" "$ROOT/nih-all-of-us/dna-sequencing" center

chart "$ROOT/gao-gsa-priority/recommendation-status/four-three.webp" "GSA recommendations" "38 remain open" "11 are priority actions" "97% five-year implementation" "Source: U.S. Government Accountability Office"
chart "$ROOT/gao-gsa-priority/priority-areas/four-three.webp" "Three priority areas" "Federal real property" "Shared services" "Federal award oversight" "Source: U.S. Government Accountability Office"

chart "$ROOT/ussc-robbery/case-profile/four-three.webp" "Federal robbery cases" "1,233 cases in FY2025" "66,662 total federal cases" "Down 4% from FY2024" "Source: U.S. Sentencing Commission"
chart "$ROOT/ussc-robbery/sentence-comparison/four-three.webp" "Average prison terms" "160 months with 924(c)" "72 months without 924(c)" "108 months overall" "Source: U.S. Sentencing Commission"

chart "$ROOT/loc-teachers/selection/four-three.webp" "Educator selection" "90 educators selected" "Nearly 200 applicants" "Teachers from K-16" "Source: Library of Congress"
chart "$ROOT/loc-teachers/reach/four-three.webp" "National reach" "21 states plus D.C." "Three institutes" "Three days each" "Source: Library of Congress"

chart "$ROOT/cbo-defense/request-composition/four-three.webp" "Defense request" '$961 billion total' '$113 billion reconciliation' "Mandatory funds: 12%" "Source: Congressional Budget Office"
chart "$ROOT/cbo-defense/acquisition/four-three.webp" "Acquisition funding" '$384 billion total' '$295 billion base request' '$89 billion mandatory' "Source: Congressional Budget Office"

chart "$ROOT/usta-ceo/career/four-three.webp" "Craig Tiley's transition" "21 years in Australia" "Led the Australian Open" "USTA tenure began July 20" "Source: USTA"
chart "$ROOT/usta-ceo/player-target/four-three.webp" "USTA participation goal" "35 million players" "Target year: 2035" "Six straight growth years" "Source: USTA"

chart "$ROOT/nih-all-of-us/scale/four-three.webp" "All of Us data scale" "747,028 participants" "More than 535,000 genomes" "Nearly 482,000 EHRs" "Source: National Institutes of Health"
chart "$ROOT/nih-all-of-us/multiomics/four-three.webp" "New multi-omics data" "9,969 proteomics samples" "8,980 RNA samples" "14,521 long-read genomes" "Source: NIH All of Us"
