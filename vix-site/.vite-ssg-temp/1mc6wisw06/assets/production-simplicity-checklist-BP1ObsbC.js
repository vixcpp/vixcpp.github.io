const html = `<h1>Vix Production Simplicity Checklist</h1>
<p>This checklist comes from analyzing PulseGrid running in production.
PulseGrid showed an important reality:</p>
<blockquote>
<p>Vix can build and run a real C++ backend, but production still requires too much manual work.
The goal of this checklist is to make Vix extremely simple for real production apps.
A developer should be able to build, run, deploy, inspect, debug, and operate a Vix app without manually wiring systemd, Nginx, logs, health checks, ports, services, and production diagnostics.</p>
</blockquote>
<hr>
<h2>1. Production diagnosis</h2>
<h3>Goal</h3>
<p>Vix should understand the production state of an app.
A command like this should exist:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> doctor</span><span style="color:#9ECBFF"> production</span></span></code></pre><p>It should inspect the current project and report:</p>
<pre class="blog-code blog-code--plain"><code>App: PulseGrid
Status: running
Binary: build-ninja/PulseGrid
Service: pulsegrid.service
HTTP port: 8080
WebSocket port: 9090
Public URL: https://pulsegrid.softadastra.com
Proxy: nginx
TLS: enabled
Healthcheck: ok
Logs: available</code></pre><h3>Checklist</h3>
<ul>
<li><input checked="" disabled="" type="checkbox"> Detect project name from <code>vix.json</code>, <code>vix.app</code>, <code>PulseGrid.vix</code>, or CMake target.</li>
<li><input checked="" disabled="" type="checkbox"> Detect build directory.</li>
<li><input checked="" disabled="" type="checkbox"> Detect executable path.</li>
<li><input checked="" disabled="" type="checkbox"> Detect whether the binary exists.</li>
<li><input checked="" disabled="" type="checkbox"> Detect whether the binary is currently running.</li>
<li><input checked="" disabled="" type="checkbox"> Detect systemd service linked to the app.</li>
<li><input checked="" disabled="" type="checkbox"> Detect service status.</li>
<li><input checked="" disabled="" type="checkbox"> Detect service restart policy.</li>
<li><input checked="" disabled="" type="checkbox"> Detect app working directory from systemd.</li>
<li><input checked="" disabled="" type="checkbox"> Detect environment variables from systemd.</li>
<li><input checked="" disabled="" type="checkbox"> Detect HTTP listening port.</li>
<li><input checked="" disabled="" type="checkbox"> Detect WebSocket listening port.</li>
<li><input checked="" disabled="" type="checkbox"> Detect Nginx config for the app domain.</li>
<li><input checked="" disabled="" type="checkbox"> Detect proxy target.</li>
<li><input checked="" disabled="" type="checkbox"> Detect TLS certificate presence.</li>
<li><input checked="" disabled="" type="checkbox"> Detect local health endpoint.</li>
<li><input checked="" disabled="" type="checkbox"> Detect public HTTPS health.</li>
<li><input checked="" disabled="" type="checkbox"> Show clear errors with fixes.</li>
</ul>
<hr>
<h2>2. Service management</h2>
<h3>Goal</h3>
<p>Vix should manage production services directly.
Current PulseGrid production setup uses a manual systemd service.
Vix should provide:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> service</span><span style="color:#9ECBFF"> install</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> service</span><span style="color:#9ECBFF"> start</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> service</span><span style="color:#9ECBFF"> stop</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> service</span><span style="color:#9ECBFF"> restart</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> service</span><span style="color:#9ECBFF"> status</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> service</span><span style="color:#9ECBFF"> logs</span></span></code></pre><h3>Checklist</h3>
<ul>
<li><input checked="" disabled="" type="checkbox"> Generate a systemd service from project config.</li>
<li><input checked="" disabled="" type="checkbox"> Support app name.</li>
<li><input checked="" disabled="" type="checkbox"> Support working directory.</li>
<li><input checked="" disabled="" type="checkbox"> Support executable path.</li>
<li><input checked="" disabled="" type="checkbox"> Support user.</li>
<li><input checked="" disabled="" type="checkbox"> Support environment variables.</li>
<li><input checked="" disabled="" type="checkbox"> Support restart policy.</li>
<li><input checked="" disabled="" type="checkbox"> Support restart delay.</li>
<li><input checked="" disabled="" type="checkbox"> Support file descriptor limit.</li>
<li><input checked="" disabled="" type="checkbox"> Support reload after service generation.</li>
<li><input checked="" disabled="" type="checkbox"> Support service enable on boot.</li>
<li><input checked="" disabled="" type="checkbox"> Support service restart.</li>
<li><input checked="" disabled="" type="checkbox"> Support service status.</li>
<li><input checked="" disabled="" type="checkbox"> Support service logs through <code>journalctl</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Warn when service points to an old build directory.</li>
<li><input checked="" disabled="" type="checkbox"> Warn when service uses a different Vix installation than the current CLI.</li>
</ul>
<p>Example generated service:</p>
<pre class="blog-code blog-code--plain"><code>[Unit]
Description=PulseGrid
After=network.target

[Service]
User=gaspard
WorkingDirectory=/home/gaspard/PulseGrid
Environment=Vix_DIR=/home/gaspard/vix-clean/build-ninja
Environment=CMAKE_PREFIX_PATH=/home/gaspard/vix-clean/build-ninja
ExecStart=/home/gaspard/PulseGrid/build-ninja/PulseGrid
Restart=always
RestartSec=3
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target</code></pre><hr>
<h2>3. Reverse proxy management</h2>
<h3>Goal</h3>
<p>Vix should make Nginx setup simple.
PulseGrid manually uses:</p>
<pre class="blog-code blog-code--plain"><code>HTTP app port: 8080
WebSocket port: 9090
Domain: pulsegrid.softadastra.com
TLS: Let's Encrypt</code></pre><p>Vix should provide:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> proxy</span><span style="color:#9ECBFF"> nginx</span><span style="color:#9ECBFF"> init</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> proxy</span><span style="color:#9ECBFF"> nginx</span><span style="color:#9ECBFF"> check</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> proxy</span><span style="color:#9ECBFF"> nginx</span><span style="color:#9ECBFF"> reload</span></span></code></pre><h3>Checklist</h3>
<ul>
<li><input checked="" disabled="" type="checkbox"> Generate an Nginx config for a Vix app.</li>
<li><input checked="" disabled="" type="checkbox"> Support HTTP proxy.</li>
<li><input checked="" disabled="" type="checkbox"> Support WebSocket proxy.</li>
<li><input checked="" disabled="" type="checkbox"> Support custom WebSocket path such as <code>/ws</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Support HTTPS redirect.</li>
<li><input checked="" disabled="" type="checkbox"> Support TLS certificate paths.</li>
<li><input checked="" disabled="" type="checkbox"> Validate TLS certificate file.</li>
<li><input checked="" disabled="" type="checkbox"> Detect invalid PEM X.509 certificate.</li>
<li><input checked="" disabled="" type="checkbox"> Detect expired TLS certificate.</li>
<li><input checked="" disabled="" type="checkbox"> Detect TLS certificate domain mismatch.</li>
<li><input checked="" disabled="" type="checkbox"> Support automatic Let&#39;s Encrypt / Certbot integration.</li>
<li><input checked="" disabled="" type="checkbox"> Validate Nginx config before reload.</li>
<li><input checked="" disabled="" type="checkbox"> Detect wrong upstream port.</li>
<li><input checked="" disabled="" type="checkbox"> Detect missing WebSocket upgrade headers.</li>
<li><input checked="" disabled="" type="checkbox"> Detect missing <code>X-Forwarded-*</code> headers.</li>
<li><input checked="" disabled="" type="checkbox"> Detect missing proxy timeouts.</li>
<li><input checked="" disabled="" type="checkbox"> Detect inactive site symlink.</li>
<li><input checked="" disabled="" type="checkbox"> Show exact command to fix the proxy.</li>
</ul>
<p>Example production config Vix should generate:</p>
<pre class="blog-code blog-code--plain"><code>server {
    listen 80;
    listen [::]:80;
    server_name pulsegrid.softadastra.com;

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name pulsegrid.softadastra.com;

    ssl_certificate /etc/letsencrypt/live/pulsegrid.softadastra.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pulsegrid.softadastra.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;

        proxy_set_header Connection &quot;&quot;;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location = /ws {
        proxy_pass http://127.0.0.1:9090/;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection &quot;upgrade&quot;;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_buffering off;
    }
}</code></pre><hr>
<h2>4. Health checks</h2>
<h3>Goal</h3>
<p>Vix should not only build the app. It should verify that the app is alive.
PulseGrid currently uses a manual deploy script with:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">curl</span><span style="color:#79B8FF"> -I</span><span style="color:#9ECBFF"> http://127.0.0.1</span></span></code></pre><p>That checks Nginx, not necessarily the internal app.</p>
<p>Vix should provide:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> health</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> health</span><span style="color:#9ECBFF"> local</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> health</span><span style="color:#9ECBFF"> public</span></span></code></pre><h3>Checklist</h3>
<ul>
<li><input checked="" disabled="" type="checkbox"> Check local app endpoint directly.</li>
<li><input checked="" disabled="" type="checkbox"> Check public HTTPS endpoint.</li>
<li><input checked="" disabled="" type="checkbox"> Check WebSocket endpoint.</li>
<li><input checked="" disabled="" type="checkbox"> Verify expected HTTP status.</li>
<li><input checked="" disabled="" type="checkbox"> Verify response time.</li>
<li><input checked="" disabled="" type="checkbox"> Verify TLS availability.</li>
<li><input checked="" disabled="" type="checkbox"> Verify service is running before health request.</li>
<li><input checked="" disabled="" type="checkbox"> Print clear result.</li>
<li><input checked="" disabled="" type="checkbox"> Fail with non-zero exit code when unhealthy.</li>
<li><input checked="" disabled="" type="checkbox"> Support health config in <code>vix.json</code>.</li>
</ul>
<p>Example:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#E1E4E8">{</span></span>
<span class="line"><span style="color:#79B8FF">  "production"</span><span style="color:#E1E4E8">: {</span></span>
<span class="line"><span style="color:#79B8FF">    "health"</span><span style="color:#E1E4E8">: {</span></span>
<span class="line"><span style="color:#79B8FF">      "local"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"http://127.0.0.1:8080/"</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">      "public"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"https://pulsegrid.softadastra.com/"</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">      "websocket"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"wss://pulsegrid.softadastra.com/ws"</span></span>
<span class="line"><span style="color:#E1E4E8">    }</span></span>
<span class="line"><span style="color:#E1E4E8">  }</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span></code></pre><hr>
<h2>5. Deployment workflow</h2>
<h3>Goal</h3>
<p>A Vix production app should not need a custom <code>deploy.sh</code> for basic deployment.
PulseGrid currently does:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">git</span><span style="color:#9ECBFF"> pull</span><span style="color:#9ECBFF"> origin</span><span style="color:#9ECBFF"> main</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> build</span><span style="color:#79B8FF"> --with-sqlite</span></span>
<span class="line"><span style="color:#B392F0">sudo</span><span style="color:#9ECBFF"> systemctl</span><span style="color:#9ECBFF"> restart</span><span style="color:#9ECBFF"> pulsegrid</span></span>
<span class="line"><span style="color:#B392F0">sudo</span><span style="color:#9ECBFF"> systemctl</span><span style="color:#9ECBFF"> is-active</span><span style="color:#9ECBFF"> pulsegrid</span></span>
<span class="line"><span style="color:#B392F0">curl</span><span style="color:#79B8FF"> -I</span><span style="color:#9ECBFF"> http://127.0.0.1</span></span></code></pre><p>Vix should provide:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> deploy</span></span></code></pre><h3>Checklist</h3>
<ul>
<li><input checked="" disabled="" type="checkbox"> Pull latest code optionally.</li>
<li><input checked="" disabled="" type="checkbox"> Build app with correct preset/options.</li>
<li><input checked="" disabled="" type="checkbox"> Run tests optionally.</li>
<li><input checked="" disabled="" type="checkbox"> Restart systemd service.</li>
<li><input checked="" disabled="" type="checkbox"> Verify service status.</li>
<li><input checked="" disabled="" type="checkbox"> Run local health check.</li>
<li><input checked="" disabled="" type="checkbox"> Run public health check.</li>
<li><input checked="" disabled="" type="checkbox"> Show last logs on failure.</li>
<li><input checked="" disabled="" type="checkbox"> Roll back later if needed.</li>
<li><input checked="" disabled="" type="checkbox"> Support dry run.</li>
<li><input checked="" disabled="" type="checkbox"> Support verbose mode.</li>
<li><input checked="" disabled="" type="checkbox"> Support production config from <code>vix.json</code>.</li>
</ul>
<p>Example production deployment config:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#E1E4E8">{</span></span>
<span class="line"><span style="color:#79B8FF">  "production"</span><span style="color:#E1E4E8">: {</span></span>
<span class="line"><span style="color:#79B8FF">    "deploy"</span><span style="color:#E1E4E8">: {</span></span>
<span class="line"><span style="color:#79B8FF">      "pull"</span><span style="color:#E1E4E8">: </span><span style="color:#79B8FF">true</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">      "branch"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"main"</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">      "build"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"vix build --with-sqlite"</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">      "service"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"pulsegrid"</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">      "health"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"http://127.0.0.1:8080/"</span></span>
<span class="line"><span style="color:#E1E4E8">    }</span></span>
<span class="line"><span style="color:#E1E4E8">  }</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span></code></pre><hr>
<h2>6. Production logs</h2>
<h3>Goal</h3>
<p>Vix should centralize app logs, systemd logs, and proxy logs.
PulseGrid logs are currently split between:</p>
<pre class="blog-code blog-code--plain"><code>journalctl -u pulsegrid
/var/log/nginx/pulsegrid.access.log
/var/log/nginx/pulsegrid.error.log</code></pre><p>Vix should provide:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> logs</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> logs</span><span style="color:#9ECBFF"> app</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> logs</span><span style="color:#9ECBFF"> proxy</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> logs</span><span style="color:#9ECBFF"> errors</span></span></code></pre><h3>Checklist</h3>
<ul>
<li><input checked="" disabled="" type="checkbox"> Show systemd app logs.</li>
<li><input checked="" disabled="" type="checkbox"> Show Nginx access logs.</li>
<li><input checked="" disabled="" type="checkbox"> Show Nginx error logs.</li>
<li><input checked="" disabled="" type="checkbox"> Filter by errors.</li>
<li><input checked="" disabled="" type="checkbox"> Filter by time.</li>
<li><input checked="" disabled="" type="checkbox"> Follow logs live.</li>
<li><input checked="" disabled="" type="checkbox"> Show last N lines.</li>
<li><input checked="" disabled="" type="checkbox"> Detect repeated errors.</li>
<li><input checked="" disabled="" type="checkbox"> Group common network disconnects.</li>
<li><input checked="" disabled="" type="checkbox"> Hide normal disconnect noise by default.</li>
<li><input checked="" disabled="" type="checkbox"> Support JSON logs later.</li>
</ul>
<p>Example:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> logs</span><span style="color:#79B8FF"> --since</span><span style="color:#9ECBFF"> "1 hour ago"</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> logs</span><span style="color:#79B8FF"> --follow</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> logs</span><span style="color:#79B8FF"> --errors</span></span></code></pre><hr>
<h2>7. Network error classification</h2>
<h3>Goal</h3>
<p>Vix should not treat normal client disconnects as production errors.
PulseGrid revealed repeated logs like:</p>
<pre class="blog-code blog-code--plain"><code>[session] write error: Broken pipe</code></pre><p>This usually means the client closed the connection before the server finished writing.
Vix already handles normal disconnects while reading. The same logic must be applied during response writing.</p>
<h3>Checklist</h3>
<ul>
<li><input checked="" disabled="" type="checkbox"> Detect normal disconnects in HTTP read path.</li>
<li><input checked="" disabled="" type="checkbox"> Detect normal disconnects in HTTP response write path.</li>
<li><input checked="" disabled="" type="checkbox"> Log client disconnects at Debug level.</li>
<li><input checked="" disabled="" type="checkbox"> Keep unexpected write failures at Error level.</li>
<li><input checked="" disabled="" type="checkbox"> Apply similar logic to WebSocket writes.</li>
<li><input checked="" disabled="" type="checkbox"> Classify common errors:<ul>
<li><input checked="" disabled="" type="checkbox"> Broken pipe</li>
<li><input checked="" disabled="" type="checkbox"> Connection reset by peer</li>
<li><input checked="" disabled="" type="checkbox"> Operation canceled</li>
<li><input checked="" disabled="" type="checkbox"> EOF</li>
</ul>
</li>
<li><input checked="" disabled="" type="checkbox"> Add tests for response write disconnects.</li>
<li><input checked="" disabled="" type="checkbox"> Add tests for WebSocket disconnects.</li>
<li><input checked="" disabled="" type="checkbox"> Avoid noisy logs in production.</li>
<li><input checked="" disabled="" type="checkbox"> Improve log messages with context.</li>
</ul>
<p>Expected behavior:</p>
<pre class="blog-code blog-code--plain"><code>[session] client disconnected during response write: Broken pipe</code></pre><p>instead of:</p>
<pre class="blog-code blog-code--plain"><code>[session] write error: Broken pipe</code></pre><hr>
<h2>8. WebSocket production support</h2>
<h3>Goal</h3>
<p>Vix should provide stronger production support for WebSocket apps.
PulseGrid uses a live WebSocket endpoint for realtime status updates.
Vix should make this easier to operate and debug.</p>
<h3>Checklist</h3>
<h2>8. WebSocket production support</h2>
<ul>
<li><input checked="" disabled="" type="checkbox"> Detect WebSocket port.</li>
<li><input checked="" disabled="" type="checkbox"> Detect WebSocket route/path.</li>
<li><input checked="" disabled="" type="checkbox"> Validate Nginx WebSocket proxy config. // via <code>vix proxy nginx check</code></li>
<li><input checked="" disabled="" type="checkbox"> Detect missing upgrade headers.</li>
<li><input checked="" disabled="" type="checkbox"> Provide WebSocket health check.</li>
<li><input checked="" disabled="" type="checkbox"> Provide active session count.</li>
<li><input checked="" disabled="" type="checkbox"> Provide disconnect reason classification.</li>
<li><input checked="" disabled="" type="checkbox"> Provide heartbeat diagnostics. // diagnostic temporaire, ping natif désactivé</li>
<li><input checked="" disabled="" type="checkbox"> Provide backpressure or slow-client protection.</li>
<li><input checked="" disabled="" type="checkbox"> Avoid logging normal disconnects as errors.</li>
<li><input checked="" disabled="" type="checkbox"> Add <code>vix ws check</code>.</li>
</ul>
<p>Example:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> ws</span><span style="color:#9ECBFF"> check</span><span style="color:#9ECBFF"> wss://pulsegrid.softadastra.com/ws</span></span></code></pre><hr>
<h2>9. Static files and public assets</h2>
<h3>Goal</h3>
<p>Vix should make backend apps with static files easy.</p>
<p>PulseGrid has:</p>
<pre class="blog-code blog-code--plain"><code>public/index.html
public/app.css
public/app.js
public/status.html
public/status.css
public/status.js</code></pre><p>Vix should support this as a first-class backend app pattern.</p>
<h3>Checklist</h3>
<ul>
<li><input disabled="" type="checkbox"> Detect <code>public/</code>.</li>
<li><input disabled="" type="checkbox"> Serve static files easily.</li>
<li><input disabled="" type="checkbox"> Support cache headers.</li>
<li><input disabled="" type="checkbox"> Support static file compression later.</li>
<li><input disabled="" type="checkbox"> Support SPA fallback.</li>
<li><input disabled="" type="checkbox"> Support public asset diagnostics.</li>
<li><input disabled="" type="checkbox"> Warn when public files are missing.</li>
<li><input disabled="" type="checkbox"> Add backend template with static UI.</li>
</ul>
<hr>
<h2>10. SQLite and storage</h2>
<h3>Goal</h3>
<p>Vix should simplify apps that use SQLite in production.</p>
<p>PulseGrid uses:</p>
<pre class="blog-code blog-code--plain"><code>storage/pulsegrid.db
storage/pulsegrid.db-shm
storage/pulsegrid.db-wal
migrations/</code></pre><p>Vix should understand this pattern.</p>
<h3>Checklist</h3>
<ul>
<li><input checked="" disabled="" type="checkbox"> Detect SQLite usage.</li>
<li><input checked="" disabled="" type="checkbox"> Detect database path.</li>
<li><input checked="" disabled="" type="checkbox"> Detect WAL mode files.</li>
<li><input checked="" disabled="" type="checkbox"> Detect storage directory.</li>
<li><input checked="" disabled="" type="checkbox"> Warn if storage directory is missing.</li>
<li><input checked="" disabled="" type="checkbox"> Warn if permissions are wrong.</li>
<li><input checked="" disabled="" type="checkbox"> Support migrations directory.</li>
<li><input checked="" disabled="" type="checkbox"> Add <code>vix db status</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Add <code>vix db migrate</code> later.</li>
<li><input checked="" disabled="" type="checkbox"> Add backup helper later.</li>
</ul>
<p>Example:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> db</span><span style="color:#9ECBFF"> status</span></span></code></pre><p>Expected output:</p>
<pre class="blog-code blog-code--plain"><code>Database: storage/pulsegrid.db
WAL: enabled
Migrations: migrations/
Status: ok</code></pre><hr>
<h2>11. Environment management</h2>
<h3>Goal</h3>
<p>Vix should make <code>.env</code> usage simple and visible.</p>
<p>PulseGrid has:</p>
<pre class="blog-code blog-code--plain"><code>.env
.env.example</code></pre><p>Vix should help verify production environment variables.</p>
<h3>Checklist</h3>
<ul>
<li><input checked="" disabled="" type="checkbox"> Detect <code>.env</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Detect <code>.env.example</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Compare missing variables.</li>
<li><input checked="" disabled="" type="checkbox"> Show which variables are loaded.</li>
<li><input checked="" disabled="" type="checkbox"> Never print secrets by default.</li>
<li><input checked="" disabled="" type="checkbox"> Support masked output.</li>
<li><input checked="" disabled="" type="checkbox"> Validate required production env vars.</li>
<li><input checked="" disabled="" type="checkbox"> Warn when systemd env differs from project env.</li>
<li><input checked="" disabled="" type="checkbox"> Add <code>vix env check</code>.</li>
</ul>
<p>Example:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> env</span><span style="color:#9ECBFF"> check</span><span style="color:#79B8FF"> --production</span></span></code></pre><hr>
<h2>12. Production config in <code>vix.json</code></h2>
<h3>Goal</h3>
<p>Vix needs one clear place to describe production.</p>
<p>A future <code>vix.json</code> should support:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#E1E4E8">{</span></span>
<span class="line"><span style="color:#79B8FF">  "name"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"PulseGrid"</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">  "production"</span><span style="color:#E1E4E8">: {</span></span>
<span class="line"><span style="color:#79B8FF">    "service"</span><span style="color:#E1E4E8">: {</span></span>
<span class="line"><span style="color:#79B8FF">      "name"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"pulsegrid"</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">      "user"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"gaspard"</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">      "working_dir"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"/home/gaspard/PulseGrid"</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">      "exec"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"build-ninja/PulseGrid"</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">      "restart"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"always"</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">      "restart_sec"</span><span style="color:#E1E4E8">: </span><span style="color:#79B8FF">3</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">      "limit_nofile"</span><span style="color:#E1E4E8">: </span><span style="color:#79B8FF">65535</span></span>
<span class="line"><span style="color:#E1E4E8">    },</span></span>
<span class="line"><span style="color:#79B8FF">    "ports"</span><span style="color:#E1E4E8">: {</span></span>
<span class="line"><span style="color:#79B8FF">      "http"</span><span style="color:#E1E4E8">: </span><span style="color:#79B8FF">8080</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">      "websocket"</span><span style="color:#E1E4E8">: </span><span style="color:#79B8FF">9090</span></span>
<span class="line"><span style="color:#E1E4E8">    },</span></span>
<span class="line"><span style="color:#79B8FF">    "proxy"</span><span style="color:#E1E4E8">: {</span></span>
<span class="line"><span style="color:#79B8FF">      "type"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"nginx"</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">      "domain"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"pulsegrid.softadastra.com"</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">      "tls"</span><span style="color:#E1E4E8">: </span><span style="color:#79B8FF">true</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">      "websocket_path"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"/ws"</span></span>
<span class="line"><span style="color:#E1E4E8">    },</span></span>
<span class="line"><span style="color:#79B8FF">    "health"</span><span style="color:#E1E4E8">: {</span></span>
<span class="line"><span style="color:#79B8FF">      "local"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"http://127.0.0.1:8080/"</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">      "public"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"https://pulsegrid.softadastra.com/"</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">      "websocket"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"wss://pulsegrid.softadastra.com/ws"</span></span>
<span class="line"><span style="color:#E1E4E8">    },</span></span>
<span class="line"><span style="color:#79B8FF">    "logs"</span><span style="color:#E1E4E8">: {</span></span>
<span class="line"><span style="color:#79B8FF">      "app"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"journalctl -u pulsegrid"</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">      "proxy_access"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"/var/log/nginx/pulsegrid.access.log"</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">      "proxy_error"</span><span style="color:#E1E4E8">: </span><span style="color:#9ECBFF">"/var/log/nginx/pulsegrid.error.log"</span></span>
<span class="line"><span style="color:#E1E4E8">    }</span></span>
<span class="line"><span style="color:#E1E4E8">  }</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span></code></pre><h3>Checklist</h3>
<ul>
<li><input checked="" disabled="" type="checkbox"> Define production schema.</li>
<li><input checked="" disabled="" type="checkbox"> Validate production schema.</li>
<li><input checked="" disabled="" type="checkbox"> Keep config simple.</li>
<li><input checked="" disabled="" type="checkbox"> Avoid too much magic.</li>
<li><input checked="" disabled="" type="checkbox"> Generate systemd from config.</li>
<li><input checked="" disabled="" type="checkbox"> Generate Nginx from config.</li>
<li><input checked="" disabled="" type="checkbox"> Run health checks from config.</li>
<li><input checked="" disabled="" type="checkbox"> Show production status from config.</li>
</ul>
<hr>
<h2>13. Backend production template</h2>
<h3>Goal</h3>
<p>PulseGrid shows the architecture Vix should encourage for serious backend apps.</p>
<p>Current structure:</p>
<pre class="blog-code blog-code--plain"><code>src/pulsegrid/
  app/
  application/
  domain/
  infrastructure/
  presentation/
  support/
public/
storage/
migrations/
tests/</code></pre><p>Vix should provide:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> new</span><span style="color:#9ECBFF"> myapp</span><span style="color:#79B8FF"> --template</span><span style="color:#9ECBFF"> backend</span></span></code></pre><h3>Checklist</h3>
<ul>
<li><input checked="" disabled="" type="checkbox"> Generate clean <code>main.cpp</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Generate <code>AppBootstrap</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Generate route registry.</li>
<li><input checked="" disabled="" type="checkbox"> Generate middleware registry.</li>
<li><input checked="" disabled="" type="checkbox"> Generate health controller.</li>
<li><input checked="" disabled="" type="checkbox"> Generate static public folder.</li>
<li><input checked="" disabled="" type="checkbox"> Generate storage folder.</li>
<li><input checked="" disabled="" type="checkbox"> Generate migrations folder.</li>
<li><input checked="" disabled="" type="checkbox"> Generate tests folder.</li>
<li><input checked="" disabled="" type="checkbox"> Generate <code>vix.json</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Generate <code>vix.app</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Generate production config scaffold.</li>
<li><input checked="" disabled="" type="checkbox"> Keep <code>main()</code> minimal.</li>
</ul>
<p>Example <code>main.cpp</code>:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#F97583">#include</span><span style="color:#9ECBFF"> &#x3C;myapp/app/AppBootstrap.hpp></span></span>
<span class="line"></span>
<span class="line"><span style="color:#F97583">int</span><span style="color:#B392F0"> main</span><span style="color:#E1E4E8">()</span></span>
<span class="line"><span style="color:#E1E4E8">{</span></span>
<span class="line"><span style="color:#B392F0">  myapp</span><span style="color:#E1E4E8">::</span><span style="color:#B392F0">app</span><span style="color:#E1E4E8">::AppBootstrap bootstrap;</span></span>
<span class="line"><span style="color:#F97583">  return</span><span style="color:#E1E4E8"> bootstrap.</span><span style="color:#B392F0">run</span><span style="color:#E1E4E8">();</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span></code></pre><hr>
<h2>14. Build/install confusion detection</h2>
<h3>Goal</h3>
<p>Vix should detect when the CLI and libraries come from different directories.
PulseGrid revealed this situation:</p>
<pre class="blog-code blog-code--plain"><code>CLI:
  /home/gaspard/vix/build/vix

App build libraries:
  /home/gaspard/vix-clean/build-ninja</code></pre><p>This can be confusing.</p>
<p>Vix should warn when:</p>
<pre class="blog-code blog-code--plain"><code>vix command != Vix_DIR used by project/service</code></pre><h3>Checklist</h3>
<ul>
<li><input checked="" disabled="" type="checkbox"> Detect current <code>vix</code> binary path.</li>
<li><input checked="" disabled="" type="checkbox"> Detect <code>Vix_DIR</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Detect <code>CMAKE_PREFIX_PATH</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Detect Vix version used by CLI.</li>
<li><input disabled="" type="checkbox"> Detect Vix version used by project build.</li>
<li><input checked="" disabled="" type="checkbox"> Warn when they differ.</li>
<li><input checked="" disabled="" type="checkbox"> Suggest exact fix.</li>
<li><input checked="" disabled="" type="checkbox"> Add <code>vix doctor toolchain</code>.</li>
</ul>
<p>Example warning:</p>
<pre class="blog-code blog-code--plain"><code>warning: Vix CLI and Vix libraries come from different installations

CLI:
  /home/gaspard/vix/build/vix

CMake package:
  /home/gaspard/vix-clean/build-ninja

This can cause confusing builds.</code></pre><hr>
<h2>15. Better deploy script generation</h2>
<h3>Status</h3>
<p>Replaced by <code>vix deploy</code>.</p>
<p>The original goal was to generate a safe deployment script while the deployment workflow was incomplete. Since <code>vix deploy</code> now supports pull, build, tests, service restart, service status, health checks, proxy checks, logs on failure, dry-run, verbose mode, and production config from <code>vix.json</code>, a generated deploy script is no longer required for the v2.6 production workflow.</p>
<h3>Checklist</h3>
<ul>
<li><input checked="" disabled="" type="checkbox"> Replaced by <code>vix deploy</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Use production config from <code>vix.json</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Pull latest code optionally.</li>
<li><input checked="" disabled="" type="checkbox"> Build app with correct command.</li>
<li><input checked="" disabled="" type="checkbox"> Restart service through <code>vix service</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Run health checks through <code>vix health</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Validate proxy through <code>vix proxy nginx check</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Show logs on failure.</li>
</ul>
<hr>
<h2>16. Production readiness score</h2>
<h3>Goal</h3>
<p>Vix should provide a simple production readiness score.</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> doctor</span><span style="color:#9ECBFF"> production</span></span></code></pre><p>Should produce:</p>
<pre class="blog-code blog-code--plain"><code>Production readiness: 82/100

OK  service installed
OK  service running
OK  nginx proxy configured
OK  TLS enabled
OK  local health check
OK  public health check
WARN websocket health not configured
WARN deploy rollback not configured</code></pre><h3>Checklist</h3>
<ul>
<li><input checked="" disabled="" type="checkbox"> Define scoring rules.</li>
<li><input checked="" disabled="" type="checkbox"> Show OK/WARN/FAIL.</li>
<li><input checked="" disabled="" type="checkbox"> Keep output simple.</li>
<li><input checked="" disabled="" type="checkbox"> Make fixes actionable.</li>
<li><input checked="" disabled="" type="checkbox"> Do not hide important details.</li>
<li><input checked="" disabled="" type="checkbox"> Support JSON output for CI.</li>
</ul>
<hr>
<h2>17. Immediate fixes from PulseGrid</h2>
<p>These are the first concrete improvements to implement in Vix.</p>
<h3>Priority 1</h3>
<ul>
<li><input checked="" disabled="" type="checkbox"> Fix HTTP response write disconnect logging.</li>
<li><input checked="" disabled="" type="checkbox"> Move normal write disconnects to Debug level.</li>
<li><input checked="" disabled="" type="checkbox"> Keep unexpected write failures at Error level.</li>
<li><input checked="" disabled="" type="checkbox"> Add test for <code>Broken pipe</code> during response write.</li>
</ul>
<h3>Priority 2</h3>
<ul>
<li><input checked="" disabled="" type="checkbox"> Add <code>vix doctor production</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Detect service, port, proxy, TLS, and health state.</li>
<li><input checked="" disabled="" type="checkbox"> Detect CLI/library mismatch.</li>
</ul>
<h3>Priority 3</h3>
<ul>
<li><input checked="" disabled="" type="checkbox"> Add <code>vix logs</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Read systemd logs.</li>
<li><input checked="" disabled="" type="checkbox"> Read Nginx logs.</li>
<li><input checked="" disabled="" type="checkbox"> Group common disconnect noise.</li>
</ul>
<h3>Priority 4</h3>
<ul>
<li><input checked="" disabled="" type="checkbox"> Add <code>vix service</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Generate and manage systemd service.</li>
</ul>
<h3>Priority 5</h3>
<ul>
<li><input checked="" disabled="" type="checkbox"> Add <code>vix proxy nginx</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Generate and validate Nginx config.</li>
</ul>
<h3>Priority 6</h3>
<ul>
<li><input checked="" disabled="" type="checkbox"> Add <code>vix deploy</code>.</li>
<li><input checked="" disabled="" type="checkbox"> Build, restart, health check, and show logs on failure.</li>
</ul>
<hr>
<h2>18. Final product direction</h2>
<p>PulseGrid proves that Vix should become:</p>
<blockquote>
<p>A C++ runtime that makes production backend apps simple to build, run, deploy, inspect, and operate.</p>
</blockquote>
<p>The developer experience should feel like:</p>
<pre class="blog-code shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code><span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> new</span><span style="color:#9ECBFF"> pulsegrid</span><span style="color:#79B8FF"> --template</span><span style="color:#9ECBFF"> backend</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> dev</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> test</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> build</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> service</span><span style="color:#9ECBFF"> install</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> proxy</span><span style="color:#9ECBFF"> nginx</span><span style="color:#9ECBFF"> init</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> deploy</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> doctor</span><span style="color:#9ECBFF"> production</span></span>
<span class="line"><span style="color:#B392F0">vix</span><span style="color:#9ECBFF"> logs</span></span></code></pre><p>The long-term goal:</p>
<pre class="blog-code blog-code--plain"><code>No manual systemd.
No manual Nginx guessing.
No unclear ports.
No noisy logs.
No hidden build mismatch.
No weak health checks.
No confusing production state.</code></pre><p>Vix should make a production C++ backend feel simple, visible, and reliable.</p>
`;
const productionSimplicityChecklist = {
  html
};
export {
  productionSimplicityChecklist as default,
  html
};
