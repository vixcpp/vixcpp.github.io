export const templateEngine = {
  title: "Built-in template engine",
  subtitle:
    "Render HTML from C++ with variables, conditions, loops, includes, layouts, caching, and streaming.",
  badge: "Template",
  cta: {
    label: "Read template docs",
    to: "https://docs.vixcpp.com/modules/template",
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

<span class="cpp-keyword">int</span> <span class="cpp-fn">main</span>(){
  App app;
  app.templates(<span class="cpp-string">"./views"</span>);

  app.get(<span class="cpp-string">"/"</span>, [](Request &, Response &res) {
    tmpl::Context ctx;
    ctx.set(<span class="cpp-string">"title"</span>, <span class="cpp-string">"Vix Templates"</span>);

    res.render(<span class="cpp-string">"index.html"</span>, ctx);
  });

  app.run(<span class="cpp-type">8080</span>);
}`,
    },
  },
};
