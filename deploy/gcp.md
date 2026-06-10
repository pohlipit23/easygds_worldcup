# Hosting on Google Cloud "Always Free" (e2-micro)

This app is a single Next.js (`next start`) server backed by a local SQLite file
(`better-sqlite3`). It needs **one always-on machine with a persistent disk**.
Google Cloud's Always Free tier gives you exactly that for $0/forever: one
`e2-micro` VM + 30 GB standard disk, in a US region.

These steps deploy it behind Caddy with automatic HTTPS on a domain you own.
The shared config files live alongside this guide:

- `worldcup.service` — systemd unit that runs the app
- `worldcup.env.example` — environment variables (copy to `/etc/worldcup.env`)
- `Caddyfile` — reverse proxy + automatic HTTPS

> **Free-tier rules — stick to these or you'll be billed:**
> region **`us-west1`, `us-central1`, or `us-east1`**; machine type **`e2-micro`**;
> boot disk **Standard persistent disk, 30 GB**; backups/snapshots **off**.

---

## 1. Create the e2-micro VM

1. Sign up at <https://console.cloud.google.com> and create a project. (A card is
   required; the Always Free resources below are not billed as long as you keep
   to the limits above.)
2. **Compute Engine → VM instances → Create instance.**
   - **Region:** `us-central1` (or `us-west1` / `us-east1`).
   - **Machine type:** `e2-micro` (2 vCPU shared, 1 GB RAM).
   - **Boot disk:** change to **Ubuntu 24.04 LTS**, disk type **Standard
     persistent disk**, size **30 GB**.
   - **Firewall:** tick **Allow HTTP traffic** and **Allow HTTPS traffic**.
     (This auto-creates the firewall rules + network tags — that's the whole
     firewall step on GCP; no host-level iptables to fight, unlike some providers.)
   - Under **Data protection**, turn **off** backups/snapshots (they cost extra).
3. Create it, then note the **External IP**.

## 2. Reserve a static IP (so your domain doesn't break)

The external IP above is *ephemeral* — it changes if the VM stops/starts, which
would silently break your DNS. Pin it:

**VPC network → IP addresses → External IP addresses** → find your instance's IP
→ in the **Type** column change **Ephemeral → Static**. (Free while attached to a
running VM.)

## 3. Point your domain at the server

In your DNS provider, create an **A record** for the hostname you'll use
(e.g. `tippspiel.yourdomain.com`) → the static IP from step 2.
Verify: `dig +short tippspiel.yourdomain.com` should print that IP.

## 4. Connect

Easiest: click **SSH** next to the instance in the console (browser terminal).
Or with the gcloud CLI: `gcloud compute ssh <instance-name> --zone <zone>`.

Check your username — GCP logs you in as your Google identity, **not** `ubuntu`:

```bash
whoami    # note this — you'll put it in the systemd unit (step 7)
echo $HOME
```

## 5. Add swap (required — 1 GB RAM will OOM during the build)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h    # should now show 2.0Gi swap
```

## 6. Install Node, build tools, and Caddy

```bash
# Node 22 LTS (system-wide, so systemd finds it)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Toolchain to compile better-sqlite3
sudo apt-get install -y build-essential python3 git

# Caddy (reverse proxy + auto HTTPS)
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y caddy
```

## 7. Get the code and build it

```bash
cd ~
git clone https://github.com/pohlipit23/easygds_worldcup.git
cd easygds_worldcup
git checkout main

npm ci                            # compiles better-sqlite3
npm run build                     # swap from step 5 keeps this from OOMing
```

> The local `data/` directory is **not** in the repo (gitignored), so the server
> starts with a fresh database — the schema is created automatically on first run.

## 8. Configure the environment + data directory

```bash
sudo mkdir -p /var/lib/worldcup
sudo chown "$(whoami):$(whoami)" /var/lib/worldcup

sudo cp deploy/worldcup.env.example /etc/worldcup.env
openssl rand -hex 32                       # copy this into SESSION_SECRET
sudo nano /etc/worldcup.env                # fill in FOOTBALL_DATA_API_KEY + SESSION_SECRET
sudo chmod 600 /etc/worldcup.env
```

`DATA_DIR=/var/lib/worldcup` is already set in the example — that's what makes the
database survive redeploys.

## 9. Install the service (edit it to match your GCP username!)

The bundled `worldcup.service` assumes user `ubuntu` and `/home/ubuntu/...`.
On GCP your username (from step 4) is different, so fix the `User=`, `Group=`,
`WorkingDirectory=`, and `ExecStart=` paths first:

```bash
sudo cp deploy/worldcup.service /etc/systemd/system/worldcup.service
sudo sed -i "s|ubuntu|$(whoami)|g" /etc/systemd/system/worldcup.service
# (this rewrites both the user/group and the /home/ubuntu/... paths)

sudo systemctl daemon-reload
sudo systemctl enable --now worldcup
sudo systemctl status worldcup            # should be "active (running)"
```

## 10. Reverse proxy + HTTPS

```bash
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile            # replace tippspiel.example.com with your domain
sudo systemctl reload caddy
```

Visit `https://tippspiel.yourdomain.com` — Caddy gets a Let's Encrypt cert
automatically on the first request.

## 11. First-run setup

- **The first account you register becomes the admin.** Register yourself first.
- Add your players, share the URL.
- Schedule + results sync automatically (~every 3 min around kickoffs); the admin
  page also has manual sync and result-override controls.

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

## Troubleshooting

- **Build killed / OOM:** you skipped the swap step (5). Add it and re-run `npm run build`.
- **Site won't load / cert fails:** DNS A record not pointing at the static IP yet,
  or you didn't tick Allow HTTP/HTTPS at VM creation. Add a VPC firewall rule for
  tcp:80,443. Check `sudo journalctl -u caddy -n 50`.
- **App won't start:** `sudo journalctl -u worldcup -n 50`. Usually a wrong path/user
  in the unit (step 9) or a missing env file.
- **URL broke after a reboot:** the IP wasn't reserved as static (step 2).
- **Logged out after every restart:** `SESSION_SECRET` not set in `/etc/worldcup.env`.
