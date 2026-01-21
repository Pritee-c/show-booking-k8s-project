# Nginx Configuration Setup

## Copy the configuration to Nginx

```bash
sudo cp /home/ubuntu/bookmyshow/nginx/bookmyshow.conf /etc/nginx/sites-available/bookmyshow
```

## Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/bookmyshow /etc/nginx/sites-enabled/
```

## Remove default Nginx config (optional)

```bash
sudo rm /etc/nginx/sites-enabled/default
```

## Test Nginx configuration

```bash
sudo nginx -t
```

## Reload Nginx

```bash
sudo systemctl reload nginx
```

## Test the API Gateway

```bash
# Health check
curl http://localhost/health

# User Service via Nginx
curl http://localhost/api/users/alice

# Event Service via Nginx
curl http://localhost/api/events

# External access (from your browser)
http://<EC2-PUBLIC-IP>/api/users
http://<EC2-PUBLIC-IP>/api/events
```

## Troubleshooting

If you get permission errors:
```bash
sudo chown -R www-data:www-data /var/log/nginx
sudo systemctl restart nginx
```

Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```
