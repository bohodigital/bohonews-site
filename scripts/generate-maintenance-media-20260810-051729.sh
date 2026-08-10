#!/bin/sh
set -eu

ROOT="public/media/newsroom/2026/08/manual-20260810-051729"
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

make_lead "$ASSETS/research-lab.jpg" "$ROOT/federal-open-access/research-lab" center
make_lead "$ASSETS/patrol-car.jpg" "$ROOT/police-hiring/patrol-car" center
make_lead "$ASSETS/road-work.jpg" "$ROOT/community-projects/road-work" center
make_lead "$ASSETS/arthur-ashe.jpg" "$ROOT/us-open-schedule/arthur-ashe" center
make_lead "$ASSETS/hurricane-karl.jpg" "$ROOT/noaa-atlantic-outlook/hurricane-satellite" center
make_lead "$ASSETS/doctor-patient.jpg" "$ROOT/who-health-strategies/doctor-patient" center

chart "$ROOT/federal-open-access/agency-status/four-three.webp" "Public-access plans" "9 agencies reviewed" "7 issued updated plans" "11 GAO recommendations" "Source: GAO-26-107738"
chart "$ROOT/federal-open-access/cost-risk/four-three.webp" "Publishing-cost risk" "Costs may triple annually" "Only NIH had a cost plan" "Less funding may reach research" "Source: GAO, May 21, 2026"

chart "$ROOT/police-hiring/workforce-flow/four-three.webp" "Sworn workforce, 2020" "55,000 hires" "57,400 separations" "64,200 reported vacancies" "Source: Bureau of Justice Statistics"
chart "$ROOT/police-hiring/retention/four-three.webp" "Why officers left" "47% voluntary resignations" "81% of hires entry-level" "16% of hires lateral" "Source: BJS LEMAS statistical tables"

chart "$ROOT/community-projects/funding-status/four-three.webp" "Community-project funds" "About \$39 billion" "61% obligated" "16% outlayed" "Source: GAO-26-107944"
chart "$ROOT/community-projects/implementation/four-three.webp" "Implementation check" "20,000+ designated projects" "60% reported a challenge" "1% not moving forward" "Source: GAO, July 16, 2026"

chart "$ROOT/us-open-schedule/key-dates/four-three.webp" "2026 U.S. Open" "Fan Week starts Aug. 23" "Qualifying starts Aug. 24" "Main draw starts Aug. 30" "Source: official U.S. Open schedule"
chart "$ROOT/us-open-schedule/finals/four-three.webp" "Championship weekend" "Women's final Sept. 12" "Men's final Sept. 13" "Schedule subject to change" "Source: USTA / U.S. Open"

chart "$ROOT/noaa-atlantic-outlook/storm-ranges/four-three.webp" "Updated Atlantic outlook" "7-13 named storms" "2-6 hurricanes" "0-2 major hurricanes" "Source: NOAA CPC, Aug. 6, 2026"
chart "$ROOT/noaa-atlantic-outlook/probabilities/four-three.webp" "Season category odds" "75% below normal" "20% near normal" "5% above normal" "Source: NOAA 2026 update"

chart "$ROOT/who-health-strategies/hiv-progress/four-three.webp" "HIV progress since 2010" "New infections down 42%" "AIDS deaths down 57%" "32M people treated in 2025" "Source: WHO, July 27, 2026"
chart "$ROOT/who-health-strategies/remaining-gaps/four-three.webp" "Gaps remain" "9M lack HIV treatment" "Hepatitis B infections down 32%" "Hepatitis B deaths up 17%" "Source: WHO strategy assessment"
