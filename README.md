# food-chaining

A playful web app to help parents generate food chains for kids based on accepted foods.

## Features

- Onboarding for one parent and multiple kids
- Per child capture of:
  - name
  - age
  - gender
  - neurodivergence (yes/no)
  - ingredient allergies
  - accepted foods by breakfast/lunch/dinner/snacks
  - optional brand and preference score for accepted foods
- 5-step food chains per accepted food and per meal category
- Daily plans per child
- Outcome progression sequence:
  - touch → play with → smell → lick → nibble → bite → swallow → ate
- Parent-only gamification rewarding effort logging
  - points
  - streaks
  - badges
  - cool level titles
- Full report export via browser print-to-PDF

## Run locally

```bash
cd /home/runner/work/food-chaining/food-chaining
npm start
```

Open http://localhost:4173 in your browser.

## Deploy to Cloudflare Pages (GitHub Actions)

Add these repository secrets in GitHub:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Then run the **Deploy to Cloudflare Pages** workflow from the Actions tab (or push to `main`).
It deploys this repository root as a static site to the Cloudflare Pages project `food-chaining`.

## Notes

- Suggestions come from an internal curated dataset.
- Allergy filtering avoids foods that appear to match listed allergens.
- This app is educational support and not medical advice.
