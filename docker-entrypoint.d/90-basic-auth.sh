#!/bin/sh
set -e

# Enables HTTP Basic Auth at the nginx layer when BASIC_AUTH_USER/BASIC_AUTH_PASSWORD are set
# (intended for public deployments — see docs/DEPLOYMENT.md). Left unset, this is a no-op so
# local development stays exactly as it was.
if [ -n "$BASIC_AUTH_USER" ] && [ -n "$BASIC_AUTH_PASSWORD" ]; then
  HASH=$(openssl passwd -apr1 "$BASIC_AUTH_PASSWORD")
  echo "$BASIC_AUTH_USER:$HASH" > /etc/nginx/.htpasswd
  cat > /etc/nginx/auth.conf <<EOF
auth_basic "Liquid Assets";
auth_basic_user_file /etc/nginx/.htpasswd;
EOF
  echo "[basic-auth] enabled for user '$BASIC_AUTH_USER'"
else
  : > /etc/nginx/auth.conf
  echo "[basic-auth] BASIC_AUTH_USER/BASIC_AUTH_PASSWORD not set — running without auth"
fi
