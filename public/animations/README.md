# Exercise animations — Lottie JSON (`.json`)

Vector exercise animations served at `/animations/<exercise-id>.json`,
referenced from `src/assets/animations/animations.ts`. Lottie JSON scales
crisply, loops cleanly, and is runtime-cached by the service worker for offline
play — ideal for the PWA.

These are played by `src/visuals/diagrams/LottieFigure.tsx` (using `lottie-web`),
loaded lazily per exercise and rendered inside the Diagram visual mode. Files
are from **LottieFiles** under the **Lottie Simple License** (free for
commercial use; attribution appreciated, not required).

## Exact matches

| File | Move | Author | Source |
| ---- | ---- | ------ | ------ |
| `burpees.json` | Burpee and Jump | Dinh Bui Xuan | https://lottiefiles.com/free-animation/burpee-and-jump-exercise-gCOcxxnr1X |
| `out-up-jacks.json` | Jumping Jack | Dinh Bui Xuan | https://lottiefiles.com/free-animation/jumping-jack-Q3NN7cRkd4 |
| `jump-squats.json` | Jumping Squats | Dinh Bui Xuan | https://lottiefiles.com/free-animation/jumping-squats-9hzVV8Ohi6 |
| `squats.json` | Squat | Daniel Bogdanov | https://lottiefiles.com/free-animation/squat-vSgVOYiNCJ |
| `tricep-dips.json` | Triceps Dips | saagar shrestha | https://lottiefiles.com/free-animation/triceps-dips-2dOoFiAlnP |

## Close matches (no exact free Lottie existed)

| File | Used for | Actually depicts | Author | Source |
| ---- | -------- | ---------------- | ------ | ------ |
| `mountain-climbers.json` | Mountain Climbers | Press-up position toe tap (plank leg drive) | Dinh Bui Xuan | https://lottiefiles.com/free-animation/press-up-postion-toe-tap-KunqnEdK18 |
| `bicycle-crunches.json` | Bicycle Crunches | Elbow-to-knee crunch (same motion) | LottieFiles community | https://lottiefiles.com/free-animation/elbow-to-knee-crunch-right-FYWv5sww1I |
| `plank-jacks.json` | Plank Jacks | Standard plank hold | Blinix | https://lottiefiles.com/free-animation/plank-667YC6ODte |
| `station-sprints.json` | Station Sprints | Running in place | Vasundhara Ghose | https://lottiefiles.com/free-animation/running-Igsta2QgtP |
| `skater-taps.json` | Skater Taps | Split jump (plyometric) | Dinh Bui Xuan | https://lottiefiles.com/free-animation/split-jump-exercise-AHHpx1bumx |

To swap any close match later, drop a new `.json` here with the same filename
and update the entry in `src/assets/animations/animations.ts`.
