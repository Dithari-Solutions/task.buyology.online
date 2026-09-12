# Buyology Kanban — VPS deployment

Two independent repositories, two independent Docker Compose stacks:

| | Repository | Public name |
| --- | --- | --- |
| Frontend | `github.com/Dithari-Solutions/task.buyology.online` | https://task.buyology.online |
| Backend | `github.com/Dithari-Solutions/api-task.buyology.online` | https://api-task.buyology.online |


```
                     https://task.buyology.online          https://api-task.buyology.online
                                  │                                        │
                                nginx  ────────────────────────────────  nginx
                                  │                                        │
                        127.0.0.1:6061                            127.0.0.1:6060
                   buyology-kanban-frontend (web)  ──────────────►  buyology-kanban-backend (api)
                                          shared docker network       │
                                                                  PostgreSQL
```

Both containers publish on **127.0.0.1 only**, so nothing but nginx on the host can
reach them — the API and the database are never exposed to the internet directly.
The web container talks to the API by container name over a shared docker network,
so that traffic never leaves the machine.

They are deployed separately and only need to agree on:

* the frontend's `BACKEND_URL` → the API container,
* the API's `FRONTEND_URL` / `CORS_ALLOWED_ORIGINS` → the public site (used for the
  links inside e-mails).

---

## 0. Prerequisites on the VPS

```bash
# Docker + compose plugin (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER" && newgrp docker
docker compose version

# The two stacks talk over this network. Create it once, before either stack starts.
docker network create buyology-kanban-shared
```

DNS: point both names at the VPS before requesting certificates.

```
task.buyology.online       A   <vps-ip>
api-task.buyology.online   A   <vps-ip>
```

## 1. Backend

```bash
mkdir -p ~/buyology && cd ~/buyology
git clone https://github.com/Dithari-Solutions/api-task.buyology.online.git buyology-kanban-backend
cd buyology-kanban-backend
```

`.env` is git-ignored, so a fresh clone has none — start from the example and
generate your own secrets:

```bash
cp .env.example .env
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')|" .env
sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$(openssl rand -base64 24 | tr -d '\n/+=')|" .env
nano .env
```

While you are in there, set the public URLs too — they decide what every link
inside an e-mail points at, and which origin the API accepts (section 3):

```
FRONTEND_URL=https://task.buyology.online
CORS_ALLOWED_ORIGINS=https://task.buyology.online
```

Fill in the administrator slots **before the first start**: an account that already
exists is never overwritten later, so a typo here means editing the database.

```
ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_FULL_NAME
ADMIN2_EMAIL / ADMIN2_PASSWORD / ADMIN2_FULL_NAME     # leave blank to skip
```

Then build and start:

```bash
docker compose up -d --build
docker compose logs -f api        # wait for "Started KanbanApplication"
```

Check it (loopback only — this is expected to fail from outside the VPS):

```bash
curl -s http://127.0.0.1:6060/actuator/health
curl -s -X POST http://127.0.0.1:6060/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@buyology.online","password":"<ADMIN_PASSWORD>"}'
```

## 2. Frontend

```bash
cd ~/buyology
git clone https://github.com/Dithari-Solutions/task.buyology.online.git buyology-kanban-frontend
cd buyology-kanban-frontend

cp .env.example .env
nano .env      # normally nothing to change - BACKEND_URL already points at the API container

docker compose up -d --build
curl -s http://127.0.0.1:6061/api/health
```

`BACKEND_URL` options:

| Situation | Value |
| --- | --- |
| Both stacks on the same VPS (**default**) | `http://buyology-kanban-api:8080` — over the shared network |
| API on another host | `https://api-task.buyology.online` |

Leave `NEXT_PUBLIC_API_URL` **empty**. Empty means the browser calls this app's own
`/api/*` routes and Next.js proxies them server-side: one origin, so no CORS and no
mixed-content surprises. It is a build-time value — changing it needs `up -d --build`.

## 3. Point the API back at the site

These were set in section 1; this is what they do, and how to correct them later.

```
FRONTEND_URL=https://task.buyology.online          # every link inside an e-mail
CORS_ALLOWED_ORIGINS=https://task.buyology.online  # the one origin the API trusts
```

A wrong `FRONTEND_URL` produces mails that point nowhere. `CORS_ALLOWED_ORIGINS` is
an exact string match — `https://` and `http://` are different origins, and a
trailing slash breaks it.

```bash
cd ~/buyology/buyology-kanban-backend
nano .env
docker compose up -d      # NOT `restart` - see the note at the end
```

## 4. E-mail

```
MAIL_ENABLED=true
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=no-reply@buyology.online
MAIL_PASSWORD=<app password>
MAIL_FROM=no-reply@buyology.online
```

With `MAIL_ENABLED=false` nothing is sent — every message is written to the API log
instead, which is useful while testing. E-mail is always sent asynchronously: a broken
SMTP setup can never block a request.

## 5. Firewall

Only the web port has to be public:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Nothing else needs to be open. With `BIND_ADDRESS=127.0.0.1` (the default) the API,
the web container and PostgreSQL are only reachable from the host itself, so even if
ufw were off they would not be exposed.

## 6. nginx + HTTPS

`/etc/nginx/sites-available/buyology-kanban`:

```nginx
# ---- the web interface -------------------------------------------------
server {
    listen 80;
    server_name task.buyology.online;
    client_max_body_size 12m;

    location / {
        proxy_pass http://127.0.0.1:6061;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# ---- the API (Swagger, direct clients) ---------------------------------
server {
    listen 80;
    server_name api-task.buyology.online;
    client_max_body_size 12m;

    location / {
        proxy_pass http://127.0.0.1:6060;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/buyology-kanban /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d task.buyology.online -d api-task.buyology.online
```

Certbot rewrites both blocks for TLS and adds the port-80 redirect. The API keeps
`forward-headers-strategy: framework`, so it honours `X-Forwarded-Proto` and builds
`https://` URLs behind the proxy.

The browser never calls `api-task.buyology.online` in the default setup — every
request goes to the web domain and is proxied server-side. The API domain is there
for Swagger (`https://api-task.buyology.online/swagger-ui.html`) and any future
mobile or integration client.

## Day-two operations

```bash
docker compose logs -f                 # follow logs
docker compose ps                      # what is running, and is it healthy
docker compose down                    # stop (the data volume survives)

# deploy a new version - run this in whichever repo changed
git pull && docker compose up -d --build

# database backup
docker exec buyology-kanban-db pg_dump -U buyology buyology_kanban | gzip > backup-$(date +%F).sql.gz

# restore
gunzip -c backup-2026-09-02.sql.gz | docker exec -i buyology-kanban-db psql -U buyology -d buyology_kanban
```

## First login

Two administrators are created on the first boot, from `ADMIN_*` and `ADMIN2_*` in
`buyology-kanban-backend/.env`. A slot with a blank e-mail or password is skipped,
so you can start with one.

```
e-mail    ADMIN_EMAIL     (default admin@buyology.online)
password  ADMIN_PASSWORD  (set it in .env BEFORE the first start)
```

An account that already exists is **never overwritten** — a still-active one is promoted
to `ADMIN`, and a **deactivated** one is left deactivated, so a restart can never undo an
offboarding. When someone leaves: deactivate them in *Users* **and clear their slot in
`.env`**.

If you booted once with the wrong password, reset it from another administrator's *Users*
page, or drop the row and recreate the container:

```bash
docker exec -it buyology-kanban-db psql -U buyology -d buyology_kanban \
  -c "DELETE FROM app_user WHERE email = 'admin@buyology.online';"
docker compose up -d      # NOT `restart`: that reuses the old environment
```

> `docker compose restart` re-runs the container with the environment it was created
> with — a corrected `.env` value is only picked up by `up -d`, which recreates it.

`.env` holds real credentials and is git-ignored in both repositories — keep it that
way, and never paste a password into `.env.example`, `docker-compose.yml` or a README.
It is parsed by Docker Compose, not by a shell: `!`, `&` and spaces are safe inside it,
but a literal `$` must be doubled (`$$`) — quoting does not stop `$VAR` interpolation.
Never `source .env` in bash, which would truncate such a value at the `&`.

The seeded demo people (`SEED_DEMO_DATA=true`) are given random passwords and cannot be
signed in as. Set `SEED_DEMO_DATA=false` for a clean production install.

Then: **Users** → create accounts · **Platforms** → create a platform · **Boards** →
create a board. Everyone else signs in with the credentials the system e-mails them.

## Is it live?

```bash
curl -sI  https://task.buyology.online            | head -1   # 200
curl -s   https://task.buyology.online/api/health             # {"status":"UP","service":"buyology-kanban-frontend"}
curl -s   https://api-task.buyology.online/actuator/health    # {"status":"UP"}
curl -sI  http://task.buyology.online             | head -1   # 301 -> https
```

Then open https://task.buyology.online, sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`,
and change that password from *Profile*. Swagger lives at
https://api-task.buyology.online/swagger-ui.html.

If the site loads but every request fails, it is almost always one of three things:
the shared docker network was not created before the stacks started (`docker network
inspect buyology-kanban-shared` should list both containers), `FRONTEND_URL` /
`CORS_ALLOWED_ORIGINS` still hold the wrong origin, or `.env` was edited and the
container was `restart`ed instead of `up -d`.
