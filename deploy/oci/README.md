# FrameFuzz live backend on Oracle OCI

Vercel hosts the **UI**. OCI hosts the **LIVE_AUTHORIZED** Node backend (keys, EF RPCs, long-running admission). Vercel `/api` proxies to OCI when `FRAMEFUZZ_BACKEND_URL` is set.

## Why not LIVE keys on Vercel alone?

Serverless cold starts + tmpfs cannot replace the operator host. Secrets stay on OCI; Vercel only stores the backend URL.

## 1. Create Always Free VM

1. Oracle Cloud → Compute → Create instance (Ampere A1 / AMD Always Free).
2. Image: Ubuntu 22.04 or Oracle Linux 8+.
3. Open **ingress TCP 4190** (and 22 for SSH) in the VCN security list.
4. Optional: paste `deploy/oci/cloud-init.yaml` as cloud-init (then edit `/etc/framefuzz/framefuzz.env` keys before enabling the service).

## 2. Manual install (SSH)

```bash
sudo mkdir -p /opt/framefuzz /var/lib/framefuzz/runs /etc/framefuzz
sudo git clone https://github.com/n1shanthb/FrameFuzz.git /opt/framefuzz
cd /opt/framefuzz && sudo git checkout main
sudo npm ci && sudo npm run ui:install && sudo npm run ui:build
sudo cp deploy/oci/env.example /etc/framefuzz/framefuzz.env
sudo nano /etc/framefuzz/framefuzz.env   # paste FRAMEFUZZ_OWNER_KEY / SENDER_KEY / OpenRouter / Arkiv
sudo chmod 600 /etc/framefuzz/framefuzz.env
sudo cp deploy/oci/framefuzz.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now framefuzz
curl -sS http://127.0.0.1:4190/api/readiness
```

Or Docker:

```bash
docker build -t framefuzz-live .
docker run -d --name framefuzz -p 4190:4190 \
  --env-file /etc/framefuzz/framefuzz.env \
  -e FRAMEFUZZ_ALLOW_PUBLIC_HOST=1 \
  -v /var/lib/framefuzz/runs:/data/runs \
  framefuzz-live
```

## 3. Point Vercel at OCI

```bash
# public IP or DNS of the VM, no trailing slash
npx vercel env add FRAMEFUZZ_BACKEND_URL production
# value: http://<OCI_PUBLIC_IP>:4190

npx vercel --prod
```

After deploy, `https://frame-fuzz.vercel.app/api/readiness` should show `LIVE_AUTHORIZED` (proxied) and response header `x-framefuzz-proxy: oci-backend`.

## 4. Local helper

From the repo (Windows):

```powershell
pwsh deploy/oci/push-env-from-local.ps1 -RemoteUser ubuntu -RemoteHost <OCI_IP>
```

Copies selected keys from local `.env` over SSH into `/etc/framefuzz/framefuzz.env` without printing secret values.
