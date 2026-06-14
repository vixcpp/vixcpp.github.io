export const productionWorkflow = {
  title: "Deploy and operate C++ backends with Vix.cpp",
  badge: "Production",
  subtitle:
    "Vix.cpp helps move backend applications from local development to production with service management, Nginx proxy checks, health checks, logs, diagnostics, and deploy workflows.",

  cta: {
    label: "Read production docs",
    to: "https://docs.vixcpp.com/guides/production-nginx-systemd",
  },

  cards: {
    deploy: {
      fileName: "terminal",
      code: `<span class="shell-path">~$</span> <span class="shell-cmd">vix build</span>
<span class="shell-success">✔</span> Build completed

<span class="shell-path">~$</span> <span class="shell-cmd">vix service install</span>
<span class="shell-success">✔</span> Service installed

<span class="shell-path">~$</span> <span class="shell-cmd">vix proxy nginx init</span>
<span class="shell-success">✔</span> Nginx proxy configured

<span class="shell-path">~$</span> <span class="shell-cmd">vix deploy</span>
<span class="shell-success">✔</span> Deployment completed`,
    },

    inspect: {
      fileName: "production",
      code: `<span class="shell-path">~$</span> <span class="shell-cmd">vix doctor production</span>

<span class="shell-success">OK</span>  service running
<span class="shell-success">OK</span>  HTTP port detected
<span class="shell-success">OK</span>  Nginx proxy configured
<span class="shell-success">OK</span>  TLS enabled
<span class="shell-success">OK</span>  local health check
<span class="shell-success">OK</span>  public health check

<span class="shell-path">~$</span> <span class="shell-cmd">vix logs --errors</span>
<span class="shell-success">✔</span> No production errors found`,
    },
  },
};
