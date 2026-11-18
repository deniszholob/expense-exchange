# Self-host Expense Exchange with Docker

Expense Exchange is distributed as one Docker image. The image contains the
prebuilt Angular browser app and bundled NestJS API; it does not install
packages or compile the project when the container starts.

## Build the image

From the repository root, install the locked dependencies and build the Docker
image and versioned image archive. Use the Node.js and pnpm versions declared
in `package.json`, and make sure a Docker engine is available to the build:

```bash
pnpm install --frozen-lockfile
pnpm run build:docker
```

The image is tagged `expense-exchange:<version>` and `expense-exchange:local`.
The versioned archive is written under
`.builds/expense-exchange-v<version>/` as
`expense-exchange-v<version>-docker-image.tar`.

To build the image without packaging an archive, run:

```bash
pnpm run build:server
pnpm run build:client
pnpm run docker:build
```

## Run on the local network

The default host port is `3001`. Runtime JSON data is stored in a named Docker volume
and survives container replacement.

```bash
HOST_PORT=3001 pnpm run serve:docker
```

Open `http://<server-ip>:3001/` from a browser on the same network. The API is
available at `http://<server-ip>:3001/api`, with interactive documentation at
`http://<server-ip>:3001/api/docs` and a health check at
`http://<server-ip>:3001/api/health`.

On first use, the app opens its data-source setup page. Keep **Remote API**
selected and leave the server URL empty to use the bundled API on the same
origin. When the health check finishes, create the first administrator on that
page. Administrators can add regular user accounts. Passwords are stored as
hashes, and the session signing key, account records, and expense JSON are kept
in `/app/data`; keep the data volume mounted when updating the container. A
separately hosted browser demo uses cross-site session cookies, so its API must
use HTTPS and list the exact demo origin in `CORS_ORIGINS`.

The Angular dev server uses `http://localhost:3000` as its default Remote API
server URL. The bundled Docker UI uses its own origin by default. A separately
hosted browser demo can be pointed at a reachable API server in Settings; that
server must allow the demo origin through `CORS_ORIGINS`, a comma-separated list
of exact browser origins. By default, Nest allows the two local Angular dev
origins (`http://localhost:4242` and `http://127.0.0.1:4242`).

To run an explicit container command, use:

```bash
docker run --detach \
  --name expense-exchange \
  --restart unless-stopped \
  --publish 3001:3000 \
  --volume expense-exchange-data:/app/data \
  expense-exchange:0.1.0
```

Replace `0.1.0` with the version tag you built. Use a different host port if
`3001` is already in use. Keep `/app/data` mounted to persistent storage; it
contains the JSON repository and account files plus the session signing key.
The current repository adapter is intended for a single application instance.

## Transfer the image to another host

Copy the generated archive to the Docker host, then load it:

```bash
docker load --input /path/to/expense-exchange-v0.1.0-docker-image.tar
```

Replace the example path and version with the copied archive's location and
name. Run the image using the persistent volume command above. No registry or
remote build service is required to deploy it.

## Stop and update

For a detached container started with the `docker run` command above, stop and
remove the container before starting the replacement:

```bash
docker stop expense-exchange
docker rm expense-exchange
```

The `pnpm run serve:docker` helper uses `--rm`, so Docker removes its container
automatically after it stops. Build and load the new version, then start it with
the same named volume. Do not remove the `expense-exchange-data` volume when
updating; deleting that volume permanently removes the stored JSON data.

## Unraid example

Build the image archive with `pnpm run build:docker`, copy the versioned
`expense-exchange-v<version>-docker-image.tar` archive to a path on Unraid, then
load it from the Unraid terminal. This example uses version `0.1.0`; replace the
version and path with the archive you built and copied:

```bash
docker load --input /mnt/user/appdata/expense-exchange/expense-exchange-v0.1.0-docker-image.tar
```

In **Docker Tab → Add Container**, configure the container as follows:

- **Name:** `expense-exchange`
- **Repository:** `expense-exchange:0.1.0` (use the version tag loaded above)
- **Network Type:** `Bridge`
- **Restart Policy:** `unless-stopped`

Add the port mapping using **Add another Path, Port, Variable, Label or Device**
and choose **Port**:

- **Name:** `Server API/UI Port`
- **Container Port:** `3000`
- **Host Port:** `3001` (or another unused port on your Unraid server)
- **Default Value:** leave blank
- **Connection Type:** `TCP`

The container always listens on port `3000`; the host port is the port you use
in a browser. With the example above, open `http://<unraid-host>:3001/`.

Add persistent storage the same way, choosing **Path**:

- **Name:** `App data`
- **Container Path:** `/app/data`
- **Host Path:** `/mnt/user/appdata/expense-exchange/data`
- **Default Value:** leave blank
- **Access Mode:** `Read/Write`

The **Host Path** is the folder on Unraid where Expense Exchange keeps its
accounts, expenses, settings, and session key. **Container Path** must be
`/app/data`; this is where the app reads and writes those files inside the
container. Keep this mapping when recreating or updating the container so the
data remains available.

In **Advanced View**, check these fields and fill them in if Unraid left them
blank:

- **Icon URL:**
  `http://[IP]:[PORT:3000]/assets/expense-exchange-icon.png`
- **WebUI:** `http://[IP]:[PORT:3000]/`

The image includes Unraid labels for these values, but explicitly check them in
the template before applying it. `[PORT:3000]` refers to the container port;
Unraid uses the port mapping above to open the configured host port (default
`3001`). The icon file is included in the Docker image and served by the app,
so Unraid can load it from the running container without fetching it from
GitHub. If Unraid does not show the icon immediately after installation, check
it again after the container has started.

The image runs as a non-root user with UID/GID `99:100` by default, matching
Unraid's common `nobody:users` appdata ownership. Create the data directory
before starting the container:

```bash
mkdir -p /mnt/user/appdata/expense-exchange/data
```

If you need different IDs, build the image with `APP_UID` and `APP_GID` set;
for example, `APP_UID=1000 APP_GID=1000 pnpm run build:docker`. The data
directory must be writable by the selected IDs. For the default `99:100`, its
existing Unraid appdata ownership normally already matches. If you build with
different IDs, change the directory ownership to match; for the `1000:1000`
example above, run:

```bash
chown -R 1000:1000 /mnt/user/appdata/expense-exchange/data
```

No environment variables are needed for a standard Unraid install. The image
uses container port `3000` and stores its runtime data in `/app/data` by
default. Open `http://<unraid-host>:3001/`; on first use, leave **Remote API**
selected with the server URL empty and create the administrator after the
health check completes. The API health endpoint is
`http://<unraid-host>:3001/api/health`.

To update, stop the container, load the new archive, change the Repository tag
to the new version, and apply the container settings again. Keep the same
`/mnt/user/appdata/expense-exchange/data` mapping; it contains accounts, the
session signing key, expenses, group members, and recurring data. Do not expose
the HTTP port directly to the public internet; use an HTTPS reverse proxy for
remote access.
