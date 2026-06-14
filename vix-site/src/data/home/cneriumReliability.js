export const cneriumReliability = {
  title: "Cnerium: retry-safe writes for Vix backends",
  badge: "Cnerium",
  subtitle:
    "Cnerium attaches to an existing vix::App and adds durable, idempotent, retry-safe route handling for critical backend operations such as orders, payments, invoices, registrations, and workflow commands.",
  cta: {
    label: "Explore Cnerium",
    to: "https://github.com/softadastra/cnerium",
    external: true,
  },
  cards: {
    attach: {
      fileName: "main.cpp",
      code: `<span class="cpp-directive">#include</span> <span class="cpp-include">&lt;vix.hpp&gt;</span>
<span class="cpp-directive">#include</span> <span class="cpp-include">&lt;cnerium/cnerium.hpp&gt;</span>

<span class="cpp-keyword">int</span> <span class="cpp-fn">main</span>()
{
  vix::App app;

  <span class="cpp-keyword">auto</span> cnerium = cnerium::attach(app);

  app.get(<span class="cpp-string">"/health"</span>, [](vix::Request &, vix::Response &res) {
    res.json({{<span class="cpp-string">"ok"</span>, <span class="cpp-keyword">true</span>}});
  });

  cnerium.durable_post(
    <span class="cpp-string">"/orders"</span>,
    <span class="cpp-string">"orders.create"</span>,
    [](cnerium::DurableRequest &) {
      <span class="cpp-keyword">return</span> cnerium::created({{<span class="cpp-string">"ok"</span>, <span class="cpp-keyword">true</span>}});
    });

  <span class="cpp-keyword">if</span> (!cnerium.start()) {
    <span class="cpp-keyword">return</span> <span class="cpp-number">1</span>;
  }

  app.run();
  <span class="cpp-keyword">return</span> <span class="cpp-number">0</span>;
}`,
    },

    retry: {
      fileName: "terminal",
      code: `<span class="shell-path">~$</span> <span class="shell-cmd">curl</span> -i -X POST http://127.0.0.1:8080/orders \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: order-123" \\
  -d '{"product_id":"p1","quantity":2}'

<span class="shell-success">HTTP/1.1 201 Created</span>

<span class="shell-path">~$</span> <span class="shell-cmd">curl</span> -i -X POST http://127.0.0.1:8080/orders \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: order-123" \\
  -d '{"product_id":"p1","quantity":2}'

<span class="shell-success">✔</span> Stored response replayed. Handler not executed twice.`,
    },
  },
};
