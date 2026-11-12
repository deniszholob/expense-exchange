# Self-host Expense Exchange with Docker

Expense Exchange is distributed as one Docker image. The image contains the
prebuilt Angular browser app and bundled NestJS API; it does not install
packages or compile the project when the container starts.

## Build the image

From the repository root, install the locked dependencies and build the Docker
image and versioned image archive:

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

The default host port is `3001`, so Expense Exchange can run alongside a
service using port `3000`. Runtime JSON data is stored in a named Docker volume
and survives container replacement.

```bash
HOST_PORT=3001 pnpm run serve:docker
```

Open `http://<server-ip>:3001/` from a browser on the same network. The API is
available at `http://<server-ip>:3001/api`, with interactive documentation at
`http://<server-ip>:3001/api/docs` and a health check at
`http://<server-ip>:3001/api/health`.

To run an explicit container command, use:

```bash
docker run --detach \
  --name expense-exchange \
  --publish 3001:3000 \
  --volume expense-exchange-data:/app/data \
  expense-exchange:<version>
```

Use a different host port if `3001` is already in use. Keep `/app/data`
mounted to persistent storage; it contains the JSON repository file. The
current repository adapter is intended for a single application instance.

## Transfer the image to another host

Copy the generated archive to the Docker host, then load it:

```bash
docker load --input expense-exchange-v<version>-docker-image.tar
```

Run the image using the persistent volume command above. No registry, remote
build service, or third-party API is required to deploy it.

## Stop and update

```bash
docker stop expense-exchange
docker rm expense-exchange
```

Build and load the new version, then start it with the same named volume. Do
not remove the `expense-exchange-data` volume when updating; deleting that
volume permanently removes the stored JSON data.
