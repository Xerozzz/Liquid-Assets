# Deploying to Oracle Cloud (Always Free)

A guide for running this app on a real, publicly-reachable server for personal use, for $0/month,
with HTTP Basic Auth and real HTTPS. Uses [docker-compose.prod.yml](../docker-compose.prod.yml),
which adds a [Caddy](https://caddyserver.com/) reverse proxy for automatic Let's Encrypt
certificates and keeps the app itself off the host's public ports entirely — see the comments in
that file and in [AGENTS.md](../AGENTS.md) for why it's a separate file rather than an override of
[docker-compose.yml](../docker-compose.yml).

This assumes some comfort with SSH and a Linux shell. None of the cloud console steps below can be
automated for you — they need your own Oracle account and browser.

## 1. Create the VM

1. Sign up for [Oracle Cloud](https://www.oracle.com/cloud/free/) (free; identity verification may
   ask for a card, but Always Free resources are never charged).
2. Create a Compute instance using an **Always Free–eligible shape**. As of mid-2026 there are
   two, but expect to only see one of them:
   - `VM.Standard.A1.Flex` (Ampere ARM) — up to 2 OCPUs / 12 GB RAM total across all A1 instances.
     Comfortably runs Postgres + the backend + nginx + Caddy, if it's available — Oracle's free ARM
     capacity has been oversubscribed for a long time now, and plenty of accounts simply never see
     this shape offered at all (not a per-attempt capacity error, just absent from the list). If
     you do see it, use it; if not, don't spend time chasing it, see below.
   - `VM.Standard.E2.1.Micro` (AMD x86) — 1 OCPU / 1 GB RAM, two of these available instead. This is
     the realistic default for most accounts today. 1 GB is genuinely tight for this stack, but
     workable for a single personal user — **add swap** (step 6 below) before your first
     `docker compose ... up --build`, since the build step (`npm ci` + `vite build` +
     `prisma generate`) is the most memory-hungry part and the most likely thing to get OOM-killed
     without it.
     Oracle has a known habit of reclaiming _idle_ free instances after a period of low utilization
     — a self-hosted app with real traffic from you shouldn't trigger this, but it's worth knowing.
3. Pick an **Ubuntu LTS image** (24.04 or 22.04) via "Change Image" if something else (e.g. Oracle
   Linux) is selected by default — the commands below assume it; Oracle Linux is RHEL-based
   (`dnf`/`firewalld` instead of `apt`/`iptables`) and would need every command translated for no
   real benefit. Unlike shapes, image choice isn't capacity-constrained, so this should always be
   available regardless of which shape you got.
4. Generate/download an SSH key pair during creation (or supply your own public key) — you'll need
   it to log in.
5. Under the instance's attached VNIC, assign a **reserved public IP** (not ephemeral) so the
   address doesn't change on reboot — this is included in the free tier and makes step 4 below
   ("point DNS at it") a one-time task.
6. **If you're on the 1 GB `E2.1.Micro` shape**, add swap before doing anything else — SSH in and
   run:
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```
   This won't make the build fast, but it turns "OOM-killed mid-build" into "slow but completes."
   If a build still fails even with swap, build the images on your own machine instead (you
   already have a working Docker setup from local development) and push them to a free registry
   (e.g. [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)),
   then have `docker-compose.prod.yml` on the VM reference `image:` instead of `build:` and just
   `docker compose pull` — not set up in this repo by default since swap resolves it for most
   people, but worth knowing as a fallback.

## 2. Open the firewall — twice

Oracle Cloud filters traffic at **two** independent layers; both need opening for ports 80/443 or
nothing gets through, even though this trips up almost everyone the first time:

1. **Cloud level**: in the console, edit the VM's subnet's _Security List_ (or attach a _Network
   Security Group_) and add ingress rules allowing TCP 80 and 443 from `0.0.0.0/0`.
2. **OS level**: Oracle's Ubuntu images ship with `iptables` rules that block inbound traffic by
   default, on top of the cloud firewall. SSH in and run:
   ```bash
   sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   ```

## 3. Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# log out and back in for the group change to take effect
```

This installs the Docker Compose plugin too (`docker compose`, not the standalone `docker-compose`).

## 4. Get a free domain (needed for real HTTPS)

Let's Encrypt can't issue a certificate for a bare IP address. The free, zero-signup-fee option:
[DuckDNS](https://www.duckdns.org) — sign in, claim a subdomain like `yourname.duckdns.org`, and
point it at your VM's reserved public IP. Since the IP is reserved (not ephemeral), you don't need
DuckDNS's dynamic-update client — set it once.

## 5. Get the code onto the VM

```bash
git clone <your-repo-url> liquid-assets
cd liquid-assets
cp .env_example .env
```

Edit `.env` and set, at minimum:

- `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD` — required; this is the only thing standing between
  the public internet and your data. Pick a real password, not something guessable.
- `DOMAIN` — the DuckDNS (or other) domain from step 4, e.g. `yourname.duckdns.org`.
- `VITE_API_URL` — **leave this blank.** See the comment in `.env_example` — an absolute URL here
  would make the frontend call the backend directly, bypassing Caddy and Basic Auth entirely.
- `POSTGRES_PASSWORD` — change from the `postgres`/`postgres` default.
- `GEMINI_API_KEY` — optional, only if you want the chatbot working.

## 6. Bring it up

```bash
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml logs -f caddy   # watch it obtain the cert
```

Caddy requests the certificate on first start; this takes a few seconds once DNS + firewall are
correct. Once it's up, visit `https://yourname.duckdns.org` — the browser will prompt for the
Basic Auth username/password before showing anything.

## Operating it afterward

- **Updating**: `git pull`, then `docker compose -f docker-compose.prod.yml up --build -d`.
- **Logs**: `docker compose -f docker-compose.prod.yml logs -f <service>` (`backend`, `frontend`,
  `caddy`, `db`).
- **Backups**: the Postgres data lives in the `db_data` volume. Periodically:
  ```bash
  docker compose -f docker-compose.prod.yml exec db pg_dump -U postgres liquid_assets > backup.sql
  ```
  Uploaded images live in the `images_data` volume — back up the volume itself (e.g.
  `docker run --rm -v liquid-assets_images_data:/data -v $(pwd):/backup alpine tar czf /backup/images.tar.gz /data`
  — check the exact volume name with `docker volume ls` first; Compose prefixes it with the
  project/directory name) if you want those covered too.
- **Changing the Basic Auth password**: edit `.env`, then
  `docker compose -f docker-compose.prod.yml up -d --force-recreate frontend` (no rebuild needed —
  the hash is generated at container start, not baked into the image).
