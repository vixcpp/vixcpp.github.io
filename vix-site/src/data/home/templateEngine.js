export const templateEngine = {
  title: "Server-side HTML templates for C++ apps",
  subtitle:
    "Build dynamic pages in native C++ with variables, conditions, loops, includes, layouts, caching, and streaming. Vix.cpp gives backend developers a simple way to render HTML without leaving the C++ runtime.",
  badge: "Templates",
  cta: {
    label: "Read template docs",
    to: "https://docs.vixcpp.com/modules/core/templates",
  },
  cards: {
    template: {
      fileName: "views/index.html",
      code: `<span class="tpl-tag">&lt;h1&gt;</span>{{ title }}<span class="tpl-tag">&lt;/h1&gt;</span>

{% if user %}
  <span class="tpl-tag">&lt;p&gt;</span>Hello {{ user.name }}<span class="tpl-tag">&lt;/p&gt;</span>
{% endif %}

{% for item in items %}
  <span class="tpl-tag">&lt;span&gt;</span>{{ item }}<span class="tpl-tag">&lt;/span&gt;</span>
{% endfor %}`,
    },
    cpp: {
      fileName: "main.cpp",
      code: `<span class="cpp-directive">#include</span> <span class="cpp-include">&lt;vix.hpp&gt;</span>
<span class="cpp-keyword">using namespace</span> vix;

<span class="cpp-keyword">int</span> <span class="cpp-fn">main</span>()
{
  App app;
  app.templates(<span class="cpp-string">"./views"</span>);

  app.get(<span class="cpp-string">"/"</span>, [](Request &, Response &res) {
    tmpl::Context ctx;
    ctx.set(<span class="cpp-string">"title"</span>, <span class="cpp-string">"Vix.cpp Templates"</span>);
    ctx.set(<span class="cpp-string">"user.name"</span>, <span class="cpp-string">"Ada"</span>);
    res.render(<span class="cpp-string">"index.html"</span>, ctx);
  });

  app.run(<span class="cpp-number">8080</span>);
}`,
    },
  },
};
