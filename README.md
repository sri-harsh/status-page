# status-page

A tiny status page for people who don't live in the same city as their parents.

Instead of sharing your live location, it maps your day into plain language your family can actually understand, "at the gym", "sleeping", "at the movies" - and serves it as a clean webpage they can bookmark.

<img width="1599" height="901" alt="Photos Library" src="https://github.com/user-attachments/assets/28a1ce44-c871-4020-8e72-e145cfba26b9" />


---

## How it works

```
iPhone trigger (location / card tap / WiFi / time)
  → iOS Shortcut fires a POST request
  → Cloudflare Worker receives it and stores in KV
  → Family opens the status page and sees your status
```

Runs entirely free on Cloudflare. No app, no subscription, no server to maintain.
<img width="2125" height="1313" alt="sri_status_architecture_v3 (1)" src="https://github.com/user-attachments/assets/bba49e0a-ddd1-4403-a788-7954fe767098" />

---

## Statuses

| Key | Label |
|-----|-------|
| `work` | 💼 At Work |
| `commuting` | 🚇 Commuting |
| `home` | 🏠 Home |
| `sleeping` | 😴 Sleeping |
| `out` | 🌆 Out & About |
| `gym` | 🏋️ At the Gym |
| `swimming` | 🏊 Swimming |
| `badminton` | 🏸 Playing Badminton |
| `movies` | 🎬 At the Movies |

Add or remove statuses by editing the `STATUSES` object in `worker.js`.

---

## Setup

### 1. Cloudflare Worker

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Compute → Workers & Pages → Create**
2. Pick **Start with Hello World**, name it anything (e.g. `my-status`)
3. Paste the contents of `worker.js` into the editor and **Deploy**

### 2. KV Namespace

1. Go to **Storage & Databases → Workers KV → Create Instance**
2. Name it anything (e.g. `STATUS_KV`)
3. Go back to your worker → **Bindings → Add binding → KV Namespace**
   - Variable name: `STATUS_KV`
   - Select your namespace

### 3. Secret

1. Worker → **Settings → Variables and Secrets → Add**
   - Type: **Secret**
   - Name: `SECRET`
   - Value: any random string (e.g. `my-secret-abc123`) - save this, you'll need it

### 4. Customize

Edit `worker.js`:
- Change `DISPLAY_NAME` to your name
- Update the `desc` fields in `STATUSES` to match your locations

---

## iOS Shortcuts

Create one Shortcut per status:

1. Open **Shortcuts** app → **+** → **Add Action**
2. Search **URL** → paste your update URL:
   ```
   https://YOUR-WORKER-URL/update?secret=YOUR_SECRET&status=work
   ```
3. Add another action → **Get Contents of URL** → Method: **POST**
4. Name it (e.g. "Status: At Work")

### Automation triggers that work well

| Trigger | Status |
|---------|--------|
| Arrive at work address | `work` |
| Leave work address | `commuting` |
| Connect to home WiFi | `home` |
| MTA/transit card charge detected | `commuting` |
| Time (11:30pm) + at home | `sleeping` |
| Arrive at gym / pool / court | `gym` / `swimming` / `badminton` |

### Tip on battery
These Shortcuts only fire on a trigger, not constantly polling your location like Find My. Anecdotally easier on battery.

---

## Testing

```bash
# Set a status
curl -X POST "https://YOUR-WORKER-URL/update?secret=YOUR_SECRET&status=work"

# Check the page
open https://YOUR-WORKER-URL
```

---

## Built with

- [Cloudflare Workers](https://workers.cloudflare.com/) — serverless backend, free tier
- [Cloudflare KV](https://developers.cloudflare.com/kv/) — key-value storage
- [iOS Shortcuts](https://support.apple.com/guide/shortcuts/welcome/ios) — automation triggers
- ~150 lines of code, most of which is the HTML/CSS for the status page
