# Hosting on Oracle Cloud "Always Free"

This app is a single Next.js (`next start`) server backed by a local SQLite file
(`better-sqlite3`). It needs **one always-on machine with a persistent disk** —
which Oracle Cloud's *Always Free* ARM VM gives you for $0, for the life of the
account.

These steps deploy it behind Caddy with automatic HTTPS on a domain you own.

Files in this folder you'll copy to the server:

- `worldcup.service` — systemd unit that runs the app
- `worldcup.env.example` — environment variables (copy to `/etc/worldcup.env`)
- `Caddyfile` — reverse proxy + automatic HTTPS

---

## 1. Create the Always Free VM

1. Sign up at <https://www.oracle.com/cloud/free/> (a card is needed for identity
   verification only — staying within Always Free limits is not billed).
2. **Compute → Instances → Create instance.**
   - **Image:** Canonical Ubuntu 24.04.
   - **Shape:** *Ampere* → `VM.Standard.A1.Flex`. Set **1 OCPU / 6 GB RAM**
     (well within the 4-OCPU / 24-GB free allowance; plenty for this app).
     If you hit "out of capacity", try a different Availability Domain or
     region — ARM demand is high.
   - **SSH keys:** upload your public key (or let Oracle generate one and save it).
3. Note the instance's **public IP** once it boots.

## 2. Open the firewall (the classic Oracle gotcha — two layers)

Oracle blocks inbound traffic in **two** places. You must open 80 + 443 in both.

**Layer 1 — VCN security list (cloud side):**
Networking → Virtual Cloud Networks → your VCN → Subnet → its Security List →
**Add Ingress Rules**, twice:
- Source `0.0.0.0/0`, IP Protocol TCP, Destination port **80**
- Source `0.0.0.0/0`, IP Protocol TCP, Destination port **443**

**Layer 2 — the instance's own firewall (Ubuntu uses iptables).** SSH in first:

```bash
ssh ubuntu@<PUBLIC_IP>
```

then:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## 3. Point your domain at the server

In your DNS provider, create an **A record** for the hostname you'll use
(e.g. `tippspiel.yourdomain.com`) → the instance's **public IP**.
Do this now so the cert request in step 7 succeeds. Verify with
`dig +short tippspiel.yourdomain.com` (should print the IP).

## 4. Install Node, build tools, and Caddy

```bash
# Node 22 LTS (system-wide, so systemd finds it)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Toolchain to compile better-sqlite3 on ARM
sudo apt-get install -y build-essential python3 git

# Caddy (reverse proxy + auto HTTPS)
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y caddy
```

## 5. Get the code and build it

```bash
cd ~
git clone <YOUR_REPO_URL> easygds_worldcup
cd easygds_worldcup
git checkout main                # or whichever branch you deploy

npm ci                            # compiles better-sqlite3 (may take a minute on ARM)
npm run build
```

> The local `data/` directory is **not** in the repo (it's gitignored), so the
> server starts with a fresh database — the schema is created automatically on
> first run. Don't copy your laptop's `data/` up unless you deliberately want
> that data.

## 6. Configure the environment + data directory

```bash
# Persistent data dir, owned by the service user
sudo mkdir -p /var/lib/worldcup
sudo chown ubuntu:ubuntu /var/lib/worldcup

# Env file
sudo cp deploy/worldcup.env.example /etc/worldcup.env
openssl rand -hex 32                       # copy this into SESSION_SECRET
sudo nano /etc/worldcup.env                # fill in FOOTBALL_DATA_API_KEY + SESSION_SECRET
sudo chmod 600 /etc/worldcup.env
```

`DATA_DIR=/var/lib/worldcup` is already set in the example — that's what makes
the database survive redeploys.

## 7. Start the app + reverse proxy

```bash
# App service
sudo cp deploy/worldcup.service /etc/systemd/system/worldcup.service
sudo systemctl daemon-reload
sudo systemctl enable --now worldcup
sudo systemctl status worldcup            # should be "active (running)"

# Caddy: edit the domain, then reload
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile            # replace tippspiel.example.com
sudo systemctl reload caddy
```

Visit `https://tippspiel.yourdomain.com` — Caddy fetches a Let's Encrypt cert
automatically on first request.

## 8. First-run setup

- **The first account you create becomes the admin.** Register yourself first.
- Add the rest of your players, then share the URL.
- Schedule + results sync automatically (~every 3 min around kickoffs); the admin
  page also has manual sync and result-override controls.
- No API key yet and want to demo it? `DATA_DIR=/var/lib/worldcup node scripts/seed-demo.mjs`
  (demo fixtures vanish on the first real sync).

---

## Redeploying after code changes

```bash
cd ~/easygds_worldcup
git pull
npm ci && npm run build
sudo systemctl restart worldcup
```

The database in `/var/lib/worldcup` is untouched by redeploys.

## Backups

```bash
cp /var/lib/worldcup/worldcup.db ~/worldcup-backup-$(date +%F).db
```

(SQLite is in WAL mode; copying the `.db` while running is fine for a casual
backup, or stop the service first for a guaranteed-consistent copy.)

## Troubleshooting

- **Site won't load / cert fails:** DNS A record not pointing at the IP yet, or
  ports 80/443 not open in *both* firewall layers (step 2). Check
  `sudo journalctl -u caddy -n 50`.
- **App won't start:** `sudo journalctl -u worldcup -n 50`. Common causes: missing
  env file, or `better-sqlite3` failed to build (re-run `npm ci` with
  `build-essential` + `python3` installed).
- **Logged out after every restart:** `SESSION_SECRET` not set in
  `/etc/worldcup.env`.
