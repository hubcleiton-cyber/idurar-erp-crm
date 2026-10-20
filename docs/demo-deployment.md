# Demo deployment

The demo uses one Render web service for the React frontend and Node.js API, plus one MongoDB Atlas database. No fiscal provider credentials are used.

## Required accounts

1. MongoDB Atlas: create one free M0 cluster and a dedicated database user.
2. Render: connect GitHub and create a Blueprint from this repository and branch.

Render reads `render.yaml`, builds both applications and publishes one HTTPS URL. Every commit pushed to the connected branch triggers a new deployment.

## Private values entered in Render

- `DATABASE`: MongoDB Atlas application connection string.
- `BOOTSTRAP_ADMIN_EMAIL`: initial administrator login.
- `BOOTSTRAP_ADMIN_PASSWORD`: unique password with at least 12 characters.

Render generates `JWT_SECRET` and `FISCAL_DATA_HASH_KEY`. Never place these values in GitHub, issues, pull requests or chat.

## Demo limitations

- The free Render service sleeps after 15 minutes without traffic, so the first request can take about one minute.
- The free Atlas M0 cluster is appropriate only for development and demonstrations.
- Uploaded files are not durable on the free Render filesystem.
- The bootstrap is idempotent: subsequent deploys do not replace the administrator password.
- No production deploy or official fiscal integration is authorized by this configuration.
