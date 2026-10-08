import { createHead } from "@unhead/vue/server";
import { defineComponent, ref, onMounted, createSSRApp, useSSRContext, resolveComponent, mergeProps, withCtx, unref, createVNode, createTextVNode, toDisplayString, computed, openBlock, createBlock, createCommentVNode, withAsyncContext } from "vue";
import { createRouter, createMemoryHistory, useRoute } from "vue-router";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrRenderList, ssrInterpolate, ssrRenderSuspense } from "vue/server-renderer";
import { useHead } from "@unhead/vue";
const ClientOnly = defineComponent({
  setup(props, { slots }) {
    const mounted = ref(false);
    onMounted(() => mounted.value = true);
    return () => {
      if (!mounted.value)
        return slots.placeholder && slots.placeholder({});
      return slots.default && slots.default({});
    };
  }
});
function ViteSSG(App2, routerOptions2, fn, options) {
  const {
    transformState,
    registerComponents = true,
    useHead: useHead2 = true,
    rootContainer = "#app"
  } = {};
  async function createApp$1(routePath) {
    const app = createSSRApp(App2);
    let head;
    if (useHead2) {
      app.use(head = createHead());
    }
    const router = createRouter({
      history: createMemoryHistory(routerOptions2.base),
      ...routerOptions2
    });
    const { routes: routes2 } = routerOptions2;
    if (registerComponents)
      app.component("ClientOnly", ClientOnly);
    const appRenderCallbacks = [];
    const onSSRAppRendered = (cb) => appRenderCallbacks.push(cb);
    const triggerOnSSRAppRendered = () => {
      return Promise.all(appRenderCallbacks.map((cb) => cb()));
    };
    const context = {
      app,
      head,
      isClient: false,
      router,
      routes: routes2,
      onSSRAppRendered,
      triggerOnSSRAppRendered,
      initialState: {},
      transformState,
      routePath
    };
    await fn?.(context);
    app.use(router);
    let entryRoutePath;
    let isFirstRoute = true;
    router.beforeEach((to, from, next) => {
      if (isFirstRoute || entryRoutePath && entryRoutePath === to.path) {
        isFirstRoute = false;
        entryRoutePath = to.path;
        to.meta.state = context.initialState;
      }
      next();
    });
    {
      const route = context.routePath ?? "/";
      router.push(route);
      await router.isReady();
      context.initialState = router.currentRoute.value.meta.state || {};
    }
    const initialState = context.initialState;
    return {
      ...context,
      initialState
    };
  }
  return createApp$1;
}
const site = {
  name: "Vix.cpp",
  shortName: "Vix",
  description: "A better development experience for C++.",
  logo: "/assets/logo/logo.svg",
  links: {
    docs: "https://docs.vixcpp.com",
    github: "https://github.com/vixcpp/vix"
  }
};
const navigation = [
  {
    label: "Learn",
    to: "/learn",
    external: false
  },
  {
    label: "Docs",
    href: "https://docs.vixcpp.com",
    external: true
  },
  {
    label: "Blog",
    to: "/blog",
    external: false
  },
  {
    label: "Community",
    to: "/community",
    external: false
  },
  {
    label: "GitHub",
    href: "https://github.com/vixcpp/vix",
    external: true
  }
];
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_main$j = {
  __name: "SiteHeader",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    function isActive(item) {
      if (item.external || !item.to) {
        return false;
      }
      return route.path === item.to || item.to !== "/" && route.path.startsWith(`${item.to}/`);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_RouterLink = resolveComponent("RouterLink");
      _push(`<header${ssrRenderAttrs(mergeProps({ class: "site-header" }, _attrs))} data-v-88949d64><div class="brand-band" data-v-88949d64><div class="brand-band__inner" data-v-88949d64>`);
      _push(ssrRenderComponent(_component_RouterLink, {
        class: "brand",
        to: "/",
        "aria-label": "Vix.cpp home",
        onClick: _ctx.closeMenu
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<img class="brand__logo"${ssrRenderAttr("src", unref(site).logo)} alt="" data-v-88949d64${_scopeId}><span class="brand__name" data-v-88949d64${_scopeId}><span data-v-88949d64${_scopeId}>Vix</span><span class="brand__name-suffix" data-v-88949d64${_scopeId}>.cpp</span></span>`);
          } else {
            return [
              createVNode("img", {
                class: "brand__logo",
                src: unref(site).logo,
                alt: ""
              }, null, 8, ["src"]),
              createVNode("span", { class: "brand__name" }, [
                createVNode("span", null, "Vix"),
                createVNode("span", { class: "brand__name-suffix" }, ".cpp")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div><div class="site-header__accent" data-v-88949d64></div><div class="navigation-band" data-v-88949d64><nav class="navigation-band__inner" aria-label="Main navigation" data-v-88949d64><!--[-->`);
      ssrRenderList(unref(navigation), (item) => {
        _push(`<!--[-->`);
        if (item.external) {
          _push(`<a class="navigation-link"${ssrRenderAttr("href", item.href)} target="_blank" rel="noreferrer" data-v-88949d64>${ssrInterpolate(item.label)} <span class="navigation-link__external" aria-hidden="true" data-v-88949d64> ↗ </span></a>`);
        } else {
          _push(ssrRenderComponent(_component_RouterLink, {
            class: ["navigation-link", {
              "navigation-link--active": isActive(item)
            }],
            to: item.to,
            onClick: _ctx.closeMenu
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(item.label)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(item.label), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        }
        _push(`<!--]-->`);
      });
      _push(`<!--]--></nav></div></header>`);
    };
  }
};
const _sfc_setup$j = _sfc_main$j.setup;
_sfc_main$j.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/layout/SiteHeader.vue");
  return _sfc_setup$j ? _sfc_setup$j(props, ctx) : void 0;
};
const SiteHeader = /* @__PURE__ */ _export_sfc(_sfc_main$j, [["__scopeId", "data-v-88949d64"]]);
const _sfc_main$i = {};
function _sfc_ssrRender$5(_ctx, _push, _parent, _attrs) {
  const _component_RouterLink = resolveComponent("RouterLink");
  _push(`<footer${ssrRenderAttrs(mergeProps({ class: "site-footer" }, _attrs))} data-v-ceb82f01><div class="site-footer__inner" data-v-ceb82f01><p class="site-footer__text" data-v-ceb82f01> Vix.cpp is open source and maintained by <a href="https://softadastra.com" target="_blank" rel="noreferrer" data-v-ceb82f01> Softadastra </a>. </p><nav class="site-footer__links" aria-label="Footer navigation" data-v-ceb82f01><a href="https://github.com/vixcpp/vix/blob/dev/LICENSE" target="_blank" rel="noreferrer" data-v-ceb82f01> MIT License </a><a href="https://github.com/vixcpp/vix" target="_blank" rel="noreferrer" data-v-ceb82f01> GitHub </a>`);
  _push(ssrRenderComponent(_component_RouterLink, { to: "/community" }, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(` Community `);
      } else {
        return [
          createTextVNode(" Community ")
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(`</nav></div></footer>`);
}
const _sfc_setup$i = _sfc_main$i.setup;
_sfc_main$i.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/layout/SiteFooter.vue");
  return _sfc_setup$i ? _sfc_setup$i(props, ctx) : void 0;
};
const SiteFooter = /* @__PURE__ */ _export_sfc(_sfc_main$i, [["ssrRender", _sfc_ssrRender$5], ["__scopeId", "data-v-ceb82f01"]]);
const blogIndex = /* @__PURE__ */ JSON.parse('[{"path":"changelog/v2.9.0","title":"Vix.cpp v2.9.0","description":"Vix.cpp v2.9.0 clarifies ownership across the build system, dependency management, networking, SDK packaging, and mobile platform support.","date":"2026-09-17","author":""},{"path":"changelog/v2.8.5","title":"Vix.cpp v2.8.5","description":"Vix.cpp v2.8.5 stabilizes Vix Realtime and strengthens modular application architecture with module-scoped Git dependencies, deterministic module graphs, transactional project mutations, and stricter installation contracts.","date":"2026-08-20","author":""},{"path":"changelog/v2.8.4","title":"Vix.cpp v2.8.4","description":"Vix.cpp v2.8.4 improves the everyday C++ development loop with lighter public headers, faster compilation and rebuilds, dependency-aware caching, clearer diagnostics, safer build parallelism, and more consistent build, run, and dev behavior.","date":"2026-08-14","author":""},{"path":"changelog/v2.8.3","title":"vix.cpp v2.8.3","description":"vix.cpp v2.8.3 is the first stable release of the v2.8 line, introducing the new vix::realtime runtime for authoritative stateful applications with rooms, deterministic events, snapshots, replay, reconnection, presence, and optional websocket and postgresql integration.","date":"2026-08-07","author":""},{"path":"changelog/v2.7.8","title":"Vix.cpp v2.7.8","description":"Vix.cpp v2.7.8 introduces package moves and namespace migrations across the Vix Registry, automatic registry pull request creation, workspace packages, and broader compatibility with system, local, and legacy Vix SDK installations.","date":"2026-07-26","author":""},{"path":"changelog","title":"Vix.cpp Changelog","description":"Version-by-version release notes for Vix.cpp, covering the runtime, CLI, SDK profiles, application modules, package workflows, diagnostics, development tools, and ecosystem changes.","date":"2026-07-19","author":""},{"path":"changelog/v2.7.7","title":"Vix.cpp v2.7.7","description":"Vix.cpp v2.7.7 introduces package-based extensions for Vix Note, extension management through the registry and Note interface, a modernized Vix Reply editor, and more reliable global installation of CLI packages.","date":"2026-07-19","author":""},{"path":"changelog/v2.7.6","title":"Vix.cpp v2.7.6","description":"Vix.cpp v2.7.6 introduces secure browser-based authentication for Softadastra Cloud, fixes Cloud API connectivity and HTTPS transport lifetime issues, and preserves terminal login for scripts and fallback use.","date":"2026-07-15","author":""},{"path":"changelog/v2.7.5","title":"Vix.cpp v2.7.5","description":"Vix.cpp v2.7.5 fixes composed SDK generation for multi-profile installations and allows vix install to migrate obsolete package integrity metadata safely and automatically.","date":"2026-07-14","author":""},{"path":"changelog/v2.7.4","title":"Vix.cpp v2.7.4","description":"Vix.cpp v2.7.4 makes installed SDK profiles composable, allows projects to combine web and data modules without the full SDK, and adds automatic profile selection with clearer missing-module diagnostics.","date":"2026-07-13","author":""},{"path":"changelog/v2.7.3","title":"Vix.cpp v2.7.3","description":"Vix.cpp v2.7.3 adds generated WebSocket application modules, API-only backend projects, the first Softadastra Cloud CLI workflow, global package installation, Git dependencies, faster single-file execution, and safer public registry publishing.","date":"2026-07-10","author":""},{"path":"changelog/v2.7.2","title":"Vix.cpp v2.7.2","description":"Vix.cpp v2.7.2 adds module-level registry dependencies, keeps dependency resolution in one root lockfile, links packages to the modules that use them, and adds execution guards for C++ cells in Vix Note.","date":"2026-07-05","author":""},{"path":"changelog/v2.7.1","title":"Vix.cpp v2.7.1","description":"Vix.cpp v2.7.1 introduces Vix App Modules for structuring C++ applications and backends, adds generated module registration and tests, improves manifest-aware dev mode, and expands SDK and package uninstall workflows.","date":"2026-07-04","author":""},{"path":"changelog/v2.7.0","title":"Vix.cpp v2.7.0","description":"Vix.cpp v2.7.0 introduces Vix Note, Vix UI, and Vix Requests, together with specialized SDK profiles, a CLI-first SDK installation workflow, and the first desktop and mobile application shell commands.","date":"2026-06-29","author":""},{"path":"changelog/v2.6.3","title":"Vix.cpp v2.6.3","description":"A stability-focused Vix.cpp release with stronger Core lifecycle guarantees, official Core benchmark baselines, improved vix run and vix tests behavior, broader sanitizer coverage, stricter CI, JSON fixes, and more reliable module tests.","date":"2026-06-18","author":""},{"path":"changelog/v2.6.2","title":"Vix.cpp v2.6.2","description":"A Vix.cpp release focused on dependency workflow reliability, registry fixes, cleaner vix run behavior, better diagnostics, Windows SDK packaging, crypto helpers, and stronger install/update/list/outdated behavior.","date":"2026-06-17","author":""},{"path":"changelog/v2.6.1","title":"Vix.cpp v2.6.1","description":"A Vix.cpp patch release focused on clearer runtime diagnostics, better build and test error reporting, stronger SDK release validation, and fixes discovered after v2.6.0.","date":"2026-06-16","author":""},{"path":"vix-core/vix-core-benchmark-baseline-v263","title":"Vix Core v2.6.3 benchmark baseline","description":"How Vix.cpp Core started using an official Release benchmark baseline to track runtime, executor, router, HTTP, session, and app performance.","date":"2026-06-16","author":""},{"path":"vix-app/vix-app-internal-modules","title":"vix.app Internal Modules","description":"How vix.app works with internal application modules created by vix modules, why modules are declared in the manifest, and how Vix keeps application architecture modular without manual CMake wiring.","date":"2026-05-25","author":""},{"path":"vix-app/vix-app-registry-dependencies","title":"vix.app Registry Dependencies","description":"How vix.app declares Vix Registry dependencies, how vix install generates CMake integration, and how Vix keeps dependency wiring out of user projects.","date":"2026-05-25","author":""},{"path":"changelog/v2.1.6","title":"Vix.cpp v2.1.6","description":"Linux release stability, aarch64 cross-compilation fixes, and CI dependency alignment.","date":"2026-05-23","author":""},{"path":"changelog/v2.4.0","title":"Vix.cpp v2.4.0","description":"A major Vix.cpp release introducing native static file serving, new standalone modules, umbrella headers, a native testing module, expanded environment handling, and real-world examples.","date":"2026-05-23","author":""},{"path":"changelog/v2.5.0","title":"Vix.cpp v2.5.0","description":"A Vix.cpp reliability release focused on runtime shutdown stability, HTTP and WebSocket lifecycle fixes, async cleanup, benchmark paths, and module build consistency.","date":"2026-05-23","author":""},{"path":"changelog/v2.5.1","title":"Vix.cpp v2.5.1","description":"A Vix.cpp stability release fixing HTTP session lifecycle behavior, cleaning runtime examples, standardizing .env configuration, and adding production-oriented WebSocket examples.","date":"2026-05-23","author":""},{"path":"changelog/v2.5.2","title":"Vix.cpp v2.5.2","description":"A Vix.cpp release improving print and input APIs, runtime and template diagnostics, single-file binary export, runtime target execution, and optional HTTPS support in the core HTTP server.","date":"2026-05-23","author":""},{"path":"changelog/v2.5.3","title":"Vix.cpp v2.5.3","description":"A major Vix.cpp release introducing execution replay, stronger runtime diagnostics, incremental build graph foundations, improved test and check workflows, and a cleaner dev session engine.","date":"2026-05-23","author":""},{"path":"changelog/v2.5.5","title":"Vix.cpp v2.5.5","description":"A Vix.cpp reliability release improving vix run dependency linking, installed registry modules, package exports, and introducing the first experimental vix.app workflow.","date":"2026-05-23","author":""},{"path":"changelog/v2.5.6","title":"Vix.cpp v2.5.6","description":"A Vix.cpp maintenance release improving generated library workflows, header-only build guidance, Ninja target diagnostics, and CLI output consistency.","date":"2026-05-23","author":""},{"path":"changelog/v2.6.0","title":"Vix.cpp v2.6.0","description":"A major Vix.cpp release introducing the AI agent module, official vix.app support, Vue + Vix workflows, target-aware builds, async-powered development sessions, and the new game runtime foundation.","date":"2026-05-23","author":""},{"path":"roadmap","title":"Roadmap","description":"Technical roadmap for Vix.cpp, covering production backend tooling, deployment workflows, diagnostics, service management, health checks, logs, and operational reliability.","date":"2026-05-23","author":""},{"path":"vix-error-diagnostics","title":"How Vix Turns C++ Errors Into Actionable Diagnostics","description":"A deep dive into Vix.cpp error diagnostics: compiler errors, template failures, runtime crashes, sanitizers, ownership bugs, concurrency failures, and modern C++ mistakes.","date":"2026-05-23","author":""},{"path":"vix-build/vix-game-runtime-export-workflow","title":"From Runtime to Export: vix/game V4 and V5","description":"How vix/game evolved from a runtime foundation into SDL rendering, game templates, and an export workflow.","date":"2026-05-22","author":""},{"path":"vix-dev","title":"vix dev","description":"Technical articles about the Vix development workflow, watch mode, reloads, and full-stack development.","date":"2026-05-21","author":""},{"path":"vix-dev/vue-fullstack-dev-workflow","title":"Vue frontend with a Vix C++ backend","description":"How Vix.cpp v2.6.0 introduces a full-stack development workflow with Vue, Vite, and a Vix-powered C++ backend.","date":"2026-05-21","author":""},{"path":"vix-app","title":"vix.app","description":"Technical articles about vix.app, the simple application manifest for Vix.cpp.","date":"2026-05-17","author":""},{"path":"vix-app/vix-app-build-planning","title":"vix.app Build Planning","description":"How vix.app changes the way Vix plans builds by separating the user project directory, generated CMake source directory, target name, and future native build path.","date":"2026-05-17","author":""},{"path":"vix-app/vix-app-generated-cmake","title":"vix.app Generated CMake","description":"How vix.app is translated into an internal CMake project, why generated CMake exists, and how Vix keeps the user-facing manifest simple.","date":"2026-05-17","author":""},{"path":"vix-app/vix-app-manifest-design","title":"vix.app Manifest Design","description":"A technical look at the vix.app manifest format, why it stays small, and how it maps common C++ project needs to a predictable build description.","date":"2026-05-17","author":""},{"path":"vix-app/vix-app-project-resolution","title":"vix.app Project Resolution","description":"How Vix resolves CMakeLists.txt and vix.app projects, why CMake keeps priority, and how project metadata flows into vix build and vix run.","date":"2026-05-17","author":""},{"path":"vix-app/vix-app-tests-and-examples","title":"vix.app Tests and Examples","description":"How to structure tests and examples with vix.app using one manifest per target while keeping projects simple and predictable.","date":"2026-05-17","author":""},{"path":"vix-build","title":"vix build","description":"Technical articles about how vix build works internally.","date":"2026-05-17","author":""},{"path":"vix-build/graph-target-executor-default","title":"Vix Build Graph Target Executor by Default","description":"How Vix Build now uses a target-aware graph executor by default, skips unnecessary Ninja work, and adds a fast build-state path for no-op builds.","date":"2026-05-17","author":""},{"path":"vix-build/how-vix-build-works","title":"How vix build Works","description":"A technical walkthrough of the vix build pipeline, from project resolution and planning to CMake compatibility, build graphs, caching, and execution.","date":"2026-05-17","author":""},{"path":"vix-build/toward-native-vix-app-builds","title":"Toward Native vix.app Builds","description":"Why vix.app can become the native fast path for Vix builds, how it can bypass CMake for simple projects, and what a BuildGraph-first execution model would look like.","date":"2026-05-17","author":""},{"path":"vix-build/vix-artifact-cache-design","title":"vix Artifact Cache Design","description":"How Vix can reuse larger build outputs such as libraries, executables, and package artifacts by fingerprinting build inputs and avoiding repeated work.","date":"2026-05-17","author":""},{"path":"vix-build/vix-build-cmake-compatibility","title":"vix build CMake Compatibility Path","description":"Why vix build keeps CMake as the compatibility path, how Vix uses CMake without exposing all of its complexity, and where vix.app fits into that model.","date":"2026-05-17","author":""},{"path":"vix-build/vix-build-graph-design","title":"vix build Graph Design","description":"How Vix models build work as nodes, tasks, dependencies, and target-aware execution for faster and more predictable C++ builds.","date":"2026-05-17","author":""},{"path":"vix-build/vix-object-cache-incremental-builds","title":"vix Object Cache and Incremental Builds","description":"How Vix can avoid unnecessary recompilation by caching object files, tracking compile inputs, and rebuilding only what changed.","date":"2026-05-17","author":""},{"path":"vix-replay","title":"vix replay","description":"","date":"2026-05-17","author":""},{"path":"vix-run","title":"vix run","description":"Technical articles about how vix run resolves scripts, projects, targets, and runtime arguments.","date":"2026-05-17","author":""},{"path":"vix-run/how-vix-run-resolves-targets","title":"How vix run Resolves Targets","description":"How vix run decides what to execute across script mode, CMake project mode, and vix.app project mode.","date":"2026-05-17","author":""},{"path":"vix-run/vix-direct-script-runner","title":"vix Direct Script Runner","description":"How Vix can run a single C++ file without requiring a full project, when direct execution is enough, and when script mode should fall back to generated build infrastructure.","date":"2026-05-17","author":""},{"path":"vix-run/vix-run-cmake-fallback","title":"vix run CMake Fallback","description":"How vix run can fall back to generated CMake when direct script execution is not enough, while keeping the user command simple.","date":"2026-05-17","author":""},{"path":"vix-run/vix-run-runtime-arguments","title":"vix run Runtime Arguments","description":"How vix run separates Vix CLI options from user program arguments across script mode and project mode.","date":"2026-05-17","author":""},{"path":"vix-run/vix-run-script-vs-project-mode","title":"vix run Script Mode vs Project Mode","description":"How vix run separates single-file execution from project execution, why both modes exist, and how Vix decides which build path to use.","date":"2026-05-17","author":""},{"path":"changelog/v2.1.0","title":"Vix.cpp v2.1.0","description":"A major Vix.cpp release focused on runtime performance, developer experience, structured documentation, real-world template examples, and ecosystem maturity.","date":"2026-04-13","author":""},{"path":"changelog/v2.1.1","title":"Vix.cpp v2.1.1","description":"A Vix.cpp stability release improving registry dependency resolution, package manifest compatibility, generated CMake safety, and dependency loading order.","date":"2026-04-13","author":""},{"path":"changelog/v2.1.10","title":"Vix.cpp v2.1.10","description":"A Vix.cpp release completing cross-platform build stability by fixing Windows dependency resolution, improving fmt and spdlog setup, and simplifying Boost-related dependencies.","date":"2026-04-13","author":""},{"path":"changelog/v2.1.11","title":"Vix.cpp v2.1.11","description":"A Vix.cpp release introducing full SDK packaging for Linux, macOS, and Windows, with installable artifacts containing bin, include, and lib layouts.","date":"2026-04-13","author":""},{"path":"changelog/v2.1.12","title":"Vix.cpp v2.1.12","description":"A Vix.cpp SDK stabilization release making JSON and SQLite dependencies export-safe, fixing CMake package exports, and improving cross-platform installability.","date":"2026-04-13","author":""},{"path":"changelog/v2.1.13","title":"Vix.cpp v2.1.13","description":"A Vix.cpp SDK packaging release making nlohmann_json integration export-safe, fixing cache module FetchContent behavior, and improving CMake export consistency.","date":"2026-04-13","author":""},{"path":"changelog/v2.1.14","title":"Vix.cpp v2.1.14","description":"A Vix.cpp release cleaning the cache module dependency model, removing direct nlohmann_json linkage, fixing VixTargets export errors, and enforcing vix::json as the unified JSON abstraction.","date":"2026-04-13","author":""},{"path":"changelog/v2.1.15","title":"Vix.cpp v2.1.15","description":"A Vix.cpp release improving SDK binary portability, relative RPATH handling, installer UX, Windows installation logs, and self-contained runtime behavior.","date":"2026-04-13","author":""},{"path":"changelog/v2.1.16","title":"Vix.cpp v2.1.16","description":"A Vix.cpp release improving Linux release portability, SDK runtime compatibility, header-only fmt and spdlog usage, and packaged artifact validation.","date":"2026-04-13","author":""},{"path":"changelog/v2.1.17","title":"Vix.cpp v2.1.17","description":"A Vix.cpp patch release fixing SQLite target resolution in exported WebSocket packages and improving CMake dependency handling for consumer projects.","date":"2026-04-13","author":""},{"path":"changelog/v2.1.18","title":"Vix.cpp v2.1.18","description":"A Vix.cpp patch release improving SQLite target compatibility across CMake versions and fixing remaining vix run failures caused by exported WebSocket SQLite dependencies.","date":"2026-04-13","author":""},{"path":"changelog/v2.1.19","title":"Vix.cpp v2.1.19","description":"A Vix.cpp release improving structured CMake build diagnostics, cleaner error readability, reliable clean builds, and safer publish edge-case handling.","date":"2026-04-13","author":""},{"path":"changelog/v2.1.2","title":"Vix.cpp v2.1.2","description":"A Vix.cpp release improving CLI usability with shell completion, paginated search results, live runtime output through PTY, and more accurate command suggestions.","date":"2026-04-13","author":""},{"path":"changelog/v2.1.3","title":"Vix.cpp v2.1.3","description":"A Vix.cpp release improving runtime output, introducing task execution, project utilities, formatting, environment inspection, global updates, and stronger REPL support.","date":"2026-04-13","author":""},{"path":"changelog/v2.1.4","title":"Vix.cpp v2.1.4","description":"A Vix.cpp code quality release focused on warning-free builds, safer runtime patterns, cleaner CMake configuration, improved CLI consistency, and stronger module maintainability.","date":"2026-04-13","author":""},{"path":"changelog/v2.1.5","title":"Vix.cpp v2.1.5","description":"A Vix.cpp release fixing the Linux aarch64 release pipeline, improving cross-compilation dependency discovery, and stabilizing CI across supported targets.","date":"2026-04-13","author":""},{"path":"changelog/v2.1.7","title":"Vix.cpp v2.1.7","description":"A Vix.cpp release fixing macOS build failures, completing cross-platform dependency setup, and stabilizing CI builds across Linux, macOS, and Windows.","date":"2026-04-13","author":""},{"path":"changelog/v2.1.8","title":"Vix.cpp v2.1.8","description":"A Vix.cpp build stability release fixing macOS spdlog compatibility, replacing internal spdlog headers with the official fmt API, and improving cross-platform portability.","date":"2026-04-13","author":""},{"path":"changelog/v2.1.9","title":"Vix.cpp v2.1.9","description":"A Vix.cpp build reliability release completing the fmt migration, fixing macOS header resolution, improving spdlog and fmt dependency propagation, and simplifying CMake configuration.","date":"2026-04-13","author":""},{"path":"changelog/v2.2.0","title":"Vix.cpp v2.2.0","description":"A Vix.cpp release introducing the manifest, resolver, lockfile, semver dependency system, transitive package resolution, and interactive configuration generation.","date":"2026-04-13","author":""},{"path":"changelog/v2.3.0","title":"Vix.cpp v2.3.0","description":"A Vix.cpp release introducing ultra-fast direct C++ execution, smart CMake fallback, script caching, database flags, and a cleaner run pipeline.","date":"2026-04-13","author":""},{"path":"changelog/v2.3.1","title":"Vix.cpp v2.3.1","description":"A Vix.cpp patch release improving OpenSSL resolution in VixConfig.cmake for consumer projects, especially on macOS and Homebrew-based environments.","date":"2026-04-13","author":""},{"path":"changelog/v2.0.0","title":"Vix.cpp v2.0.0","description":"The first official V2 release of Vix.cpp, replacing the Boost.Beast-based V1 runtime with a Boost-free native HTTP stack, async-first architecture, and cleaner module boundaries.","date":"2026-03-31","author":""},{"path":"roadmap/production-simplicity-checklist","title":"Vix Production Simplicity Checklist","description":"","date":"","author":""},{"path":"vix-app/why-vix-app-exists","title":"Why vix.app Exists","description":"","date":"","author":""},{"path":"vix-build/no-op-target-builds-fast-by-default","title":"No-op target builds are now fast by default","description":"","date":"","author":""},{"path":"vix-build/vix-build-roadmap-execution","title":"Vix Build Roadmap Execution","description":"","date":"","author":""},{"path":"vix-build/vix-game-module-foundation","title":"Building the Vix Game Foundation","description":"","date":"","author":""},{"path":"vix-core","title":"Vix Core","description":"","date":"","author":""}]');
const contentModules = /* @__PURE__ */ Object.assign({
  "../generated/blog-content/changelog.json": () => import("./assets/changelog-YD3fSK2P.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.0.0.json": () => import("./assets/v2.0.0-jikc9_3s.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.1.0.json": () => import("./assets/v2.1.0-CpcIKkYM.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.1.1.json": () => import("./assets/v2.1.1-C84FUUEK.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.1.10.json": () => import("./assets/v2.1.10-DpANfYUq.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.1.11.json": () => import("./assets/v2.1.11-CyLIjFT-.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.1.12.json": () => import("./assets/v2.1.12-BCQMx7cH.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.1.13.json": () => import("./assets/v2.1.13-DGbDu20Y.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.1.14.json": () => import("./assets/v2.1.14-BbTcR3sE.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.1.15.json": () => import("./assets/v2.1.15-DvHfhAD8.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.1.16.json": () => import("./assets/v2.1.16-Dfg4IRBW.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.1.17.json": () => import("./assets/v2.1.17-2qTef-h4.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.1.18.json": () => import("./assets/v2.1.18-CBM0T0is.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.1.19.json": () => import("./assets/v2.1.19-D0LSLzui.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.1.2.json": () => import("./assets/v2.1.2-BYpp0vxi.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.1.3.json": () => import("./assets/v2.1.3-8rUhMahW.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.1.4.json": () => import("./assets/v2.1.4-DQJS7GWq.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.1.5.json": () => import("./assets/v2.1.5-Do3ix5RR.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.1.6.json": () => import("./assets/v2.1.6-CMR-9ige.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.1.7.json": () => import("./assets/v2.1.7-DMvjQfJo.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.1.8.json": () => import("./assets/v2.1.8-BqcCKMyP.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.1.9.json": () => import("./assets/v2.1.9-CvgpXLk5.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.2.0.json": () => import("./assets/v2.2.0-C0-0jJsb.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.3.0.json": () => import("./assets/v2.3.0-Bucpbk1f.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.3.1.json": () => import("./assets/v2.3.1-VxYxMG2R.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.4.0.json": () => import("./assets/v2.4.0-TOAufyhj.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.5.0.json": () => import("./assets/v2.5.0-B0TXSM65.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.5.1.json": () => import("./assets/v2.5.1-DNxxjnfV.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.5.2.json": () => import("./assets/v2.5.2-dwlpnqkL.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.5.3.json": () => import("./assets/v2.5.3-CSmrnrfk.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.5.5.json": () => import("./assets/v2.5.5-5LAIuhxk.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.5.6.json": () => import("./assets/v2.5.6-DhmW7WaF.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.6.0.json": () => import("./assets/v2.6.0-C4YAKsO2.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.6.1.json": () => import("./assets/v2.6.1-BaBB8IBO.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.6.2.json": () => import("./assets/v2.6.2-DoUiBLNA.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.6.3.json": () => import("./assets/v2.6.3-CsmlOt-t.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.7.0.json": () => import("./assets/v2.7.0-C4VDlEl1.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.7.1.json": () => import("./assets/v2.7.1-DxRDQGw1.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.7.2.json": () => import("./assets/v2.7.2-D2bAsvFv.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.7.3.json": () => import("./assets/v2.7.3-DG_QSQnn.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.7.4.json": () => import("./assets/v2.7.4-C0ziq3Yh.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.7.5.json": () => import("./assets/v2.7.5-Cz6YsC1I.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.7.6.json": () => import("./assets/v2.7.6-BpNHKudG.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.7.7.json": () => import("./assets/v2.7.7-DoWGBtPN.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.7.8.json": () => import("./assets/v2.7.8-C8-MN9er.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.8.3.json": () => import("./assets/v2.8.3-fnMXoBpX.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.8.4.json": () => import("./assets/v2.8.4-D4HeF3Zi.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.8.5.json": () => import("./assets/v2.8.5-CIYTmGNE.js").then((m) => m["default"]),
  "../generated/blog-content/changelog/v2.9.0.json": () => import("./assets/v2.9.0-D5WiKWjO.js").then((m) => m["default"]),
  "../generated/blog-content/roadmap.json": () => import("./assets/roadmap-BeH2oDRh.js").then((m) => m["default"]),
  "../generated/blog-content/roadmap/production-simplicity-checklist.json": () => import("./assets/production-simplicity-checklist-BP1ObsbC.js").then((m) => m["default"]),
  "../generated/blog-content/vix-app.json": () => import("./assets/vix-app-CoPoSnqe.js").then((m) => m["default"]),
  "../generated/blog-content/vix-app/vix-app-build-planning.json": () => import("./assets/vix-app-build-planning-Cfa0xfD2.js").then((m) => m["default"]),
  "../generated/blog-content/vix-app/vix-app-generated-cmake.json": () => import("./assets/vix-app-generated-cmake-CDiZf8Js.js").then((m) => m["default"]),
  "../generated/blog-content/vix-app/vix-app-internal-modules.json": () => import("./assets/vix-app-internal-modules-DFT4W2eL.js").then((m) => m["default"]),
  "../generated/blog-content/vix-app/vix-app-manifest-design.json": () => import("./assets/vix-app-manifest-design-BHjfrKWi.js").then((m) => m["default"]),
  "../generated/blog-content/vix-app/vix-app-project-resolution.json": () => import("./assets/vix-app-project-resolution-BAZJoutx.js").then((m) => m["default"]),
  "../generated/blog-content/vix-app/vix-app-registry-dependencies.json": () => import("./assets/vix-app-registry-dependencies-B4gNIExS.js").then((m) => m["default"]),
  "../generated/blog-content/vix-app/vix-app-tests-and-examples.json": () => import("./assets/vix-app-tests-and-examples-9qHCWkhj.js").then((m) => m["default"]),
  "../generated/blog-content/vix-app/why-vix-app-exists.json": () => import("./assets/why-vix-app-exists-uAZWuAmv.js").then((m) => m["default"]),
  "../generated/blog-content/vix-build.json": () => import("./assets/vix-build-Ck9JqEiH.js").then((m) => m["default"]),
  "../generated/blog-content/vix-build/graph-target-executor-default.json": () => import("./assets/graph-target-executor-default-BAkH8zmA.js").then((m) => m["default"]),
  "../generated/blog-content/vix-build/how-vix-build-works.json": () => import("./assets/how-vix-build-works-DJr1dwsZ.js").then((m) => m["default"]),
  "../generated/blog-content/vix-build/no-op-target-builds-fast-by-default.json": () => import("./assets/no-op-target-builds-fast-by-default-NR-_84Go.js").then((m) => m["default"]),
  "../generated/blog-content/vix-build/toward-native-vix-app-builds.json": () => import("./assets/toward-native-vix-app-builds-BEQLVEez.js").then((m) => m["default"]),
  "../generated/blog-content/vix-build/vix-artifact-cache-design.json": () => import("./assets/vix-artifact-cache-design-Di4r3UOh.js").then((m) => m["default"]),
  "../generated/blog-content/vix-build/vix-build-cmake-compatibility.json": () => import("./assets/vix-build-cmake-compatibility-DgnIboBj.js").then((m) => m["default"]),
  "../generated/blog-content/vix-build/vix-build-graph-design.json": () => import("./assets/vix-build-graph-design-uvRXb3GF.js").then((m) => m["default"]),
  "../generated/blog-content/vix-build/vix-build-roadmap-execution.json": () => import("./assets/vix-build-roadmap-execution-CrHVFbcJ.js").then((m) => m["default"]),
  "../generated/blog-content/vix-build/vix-game-module-foundation.json": () => import("./assets/vix-game-module-foundation-BiGuToG6.js").then((m) => m["default"]),
  "../generated/blog-content/vix-build/vix-game-runtime-export-workflow.json": () => import("./assets/vix-game-runtime-export-workflow-wLIk7cIo.js").then((m) => m["default"]),
  "../generated/blog-content/vix-build/vix-object-cache-incremental-builds.json": () => import("./assets/vix-object-cache-incremental-builds-Cs72iJr-.js").then((m) => m["default"]),
  "../generated/blog-content/vix-core.json": () => import("./assets/vix-core-DZprlsQI.js").then((m) => m["default"]),
  "../generated/blog-content/vix-core/vix-core-benchmark-baseline-v263.json": () => import("./assets/vix-core-benchmark-baseline-v263-Bwg2ZbE0.js").then((m) => m["default"]),
  "../generated/blog-content/vix-dev.json": () => import("./assets/vix-dev-l-5yYGYx.js").then((m) => m["default"]),
  "../generated/blog-content/vix-dev/vue-fullstack-dev-workflow.json": () => import("./assets/vue-fullstack-dev-workflow-BGprCW-h.js").then((m) => m["default"]),
  "../generated/blog-content/vix-error-diagnostics.json": () => import("./assets/vix-error-diagnostics-De4-bhrl.js").then((m) => m["default"]),
  "../generated/blog-content/vix-replay.json": () => import("./assets/vix-replay-D153V5vm.js").then((m) => m["default"]),
  "../generated/blog-content/vix-run.json": () => import("./assets/vix-run-DS13lFnX.js").then((m) => m["default"]),
  "../generated/blog-content/vix-run/how-vix-run-resolves-targets.json": () => import("./assets/how-vix-run-resolves-targets-DYcl8hC6.js").then((m) => m["default"]),
  "../generated/blog-content/vix-run/vix-direct-script-runner.json": () => import("./assets/vix-direct-script-runner-sK6r3sYF.js").then((m) => m["default"]),
  "../generated/blog-content/vix-run/vix-run-cmake-fallback.json": () => import("./assets/vix-run-cmake-fallback-DY0KXObD.js").then((m) => m["default"]),
  "../generated/blog-content/vix-run/vix-run-runtime-arguments.json": () => import("./assets/vix-run-runtime-arguments-BMxNsraJ.js").then((m) => m["default"]),
  "../generated/blog-content/vix-run/vix-run-script-vs-project-mode.json": () => import("./assets/vix-run-script-vs-project-mode-BLNI-8Cg.js").then((m) => m["default"])
});
const blogPosts = blogIndex;
function normalizePostPath(path) {
  return (Array.isArray(path) ? path.join("/") : path || "").replace(/^\/+|\/+$/g, "").replace(/\.md$/, "").replace(/\/index$/, "");
}
function findBlogPost(path) {
  const normalized = normalizePostPath(path);
  return blogPosts.find((post) => post.path === normalized);
}
async function loadBlogPostHtml(path) {
  const normalized = normalizePostPath(path);
  if (!normalized) {
    return "";
  }
  const key = `../generated/blog-content/${normalized}.json`;
  const loader = contentModules[key];
  if (!loader) {
    return "";
  }
  const content = await loader();
  return content?.html || "";
}
const docsIndex = /* @__PURE__ */ JSON.parse('[{"path":"","title":"Vix.cpp Documentation"},{"path":"api","title":"API Reference"},{"path":"api/async","title":"API Reference"},{"path":"api/config","title":"Config API"},{"path":"api/core","title":"Core"},{"path":"api/core/console","title":"Console"},{"path":"api/core/core","title":"API Reference"},{"path":"api/core/format","title":"Format"},{"path":"api/core/input","title":"Input"},{"path":"api/core/inspect","title":"Inspect"},{"path":"api/core/print","title":"Print"},{"path":"api/http","title":"HTTP API"},{"path":"api/json","title":"JSON API"},{"path":"api/kv","title":"Vix KV API"},{"path":"api/log","title":"Log"},{"path":"api/log/server-pretty-logs","title":"Server Pretty Logs"},{"path":"api/middleware","title":"Middleware API"},{"path":"api/p2p","title":"P2P API"},{"path":"api/threadpool","title":"ThreadPool API"},{"path":"api/websocket","title":"WebSocket API"},{"path":"app-modules","title":"Application Modules"},{"path":"app-modules/backend-modules","title":"Backend Modules"},{"path":"app-modules/best-practices","title":"Best Practices"},{"path":"app-modules/cli-workflow","title":"CLI Workflow"},{"path":"app-modules/dependencies-and-checks","title":"Dependencies and Checks"},{"path":"app-modules/generated-registration","title":"Generated Registration"},{"path":"app-modules/getting-started","title":"Getting Started"},{"path":"app-modules/module-layout","title":"Module Layout"},{"path":"app-modules/module-manifest","title":"Module Manifest"},{"path":"app-modules/tests","title":"Tests"},{"path":"app-modules/troubleshooting","title":"Troubleshooting"},{"path":"app-modules/why-modules","title":"Why Modules Exist"},{"path":"app-modules/with-cmake","title":"Using with CMake"},{"path":"app-modules/with-vix-app","title":"Using with vix.app"},{"path":"book","title":"Book"},{"path":"book/01-introduction","title":"Introduction"},{"path":"book/02-why-vix","title":"Why Vix Exists"},{"path":"book/03-mental-model","title":"Mental Model"},{"path":"book/04-application-model","title":"Application Model"},{"path":"book/04-routes","title":"Routes"},{"path":"book/05-request-response","title":"Request and Response"},{"path":"book/05-runtime-workflow","title":"Runtime Workflow"},{"path":"book/06-build-workflow","title":"Build Workflow"},{"path":"book/06-json-api","title":"JSON API"},{"path":"book/07-middleware","title":"Middleware"},{"path":"book/07-modules-and-composition","title":"Modules and Composition"},{"path":"book/08-local-to-production","title":"From Local to Production"},{"path":"book/08-validation","title":"Validation"},{"path":"book/09-errors-and-logging","title":"Errors and logging"},{"path":"book/09-next-steps","title":"Next Steps"},{"path":"book/10-database","title":"Database"},{"path":"book/11-realtime-websocket","title":"Real-time WebSocket"},{"path":"book/12-async-runtime","title":"Async runtime"},{"path":"book/13-cache","title":"Cache"},{"path":"book/14-offline-first-sync","title":"Offline-first sync"},{"path":"book/15-p2p","title":"P2P"},{"path":"book/16-production-deployment","title":"Production deployment"},{"path":"book/17-next-steps","title":"Next steps"},{"path":"cli","title":"Vix CLI"},{"path":"cli/add","title":"vix add"},{"path":"cli/agent","title":"vix agent"},{"path":"cli/build","title":"vix build"},{"path":"cli/cache","title":"vix cache"},{"path":"cli/check","title":"vix check"},{"path":"cli/clean","title":"vix clean"},{"path":"cli/commands","title":"CLI Commands"},{"path":"cli/completion","title":"vix completion"},{"path":"cli/db","title":"vix db"},{"path":"cli/deploy","title":"vix deploy"},{"path":"cli/desktop","title":"vix desktop"},{"path":"cli/dev","title":"vix dev"},{"path":"cli/doctor","title":"vix doctor"},{"path":"cli/env","title":"vix env"},{"path":"cli/fmt","title":"vix fmt"},{"path":"cli/game","title":"vix game"},{"path":"cli/health","title":"vix health"},{"path":"cli/info","title":"vix info"},{"path":"cli/install","title":"vix install"},{"path":"cli/list","title":"vix list"},{"path":"cli/logs","title":"vix logs"},{"path":"cli/make","title":"vix make"},{"path":"cli/mobile","title":"vix mobile"},{"path":"cli/modules","title":"vix modules"},{"path":"cli/new","title":"vix new"},{"path":"cli/note","title":"vix note"},{"path":"cli/orm","title":"vix orm"},{"path":"cli/outdated","title":"vix outdated"},{"path":"cli/p2p","title":"vix p2p"},{"path":"cli/pack","title":"vix pack"},{"path":"cli/proxy","title":"vix proxy"},{"path":"cli/publish","title":"vix publish"},{"path":"cli/registry","title":"vix registry"},{"path":"cli/remove","title":"vix remove"},{"path":"cli/repl","title":"Vix Reply"},{"path":"cli/replay","title":"vix replay"},{"path":"cli/reset","title":"vix reset"},{"path":"cli/run","title":"vix run"},{"path":"cli/search","title":"vix search"},{"path":"cli/service","title":"vix service"},{"path":"cli/store","title":"vix store"},{"path":"cli/task","title":"vix task"},{"path":"cli/tests","title":"vix tests"},{"path":"cli/uninstall","title":"vix uninstall"},{"path":"cli/unpublish","title":"registry: unpublish namespace/name"},{"path":"cli/update","title":"vix update"},{"path":"cli/upgrade","title":"vix upgrade"},{"path":"cli/verify","title":"vix verify"},{"path":"cli/ws","title":"vix ws"},{"path":"cmd","title":"cmd"},{"path":"code-of-conduct","title":"Code of Conduct"},{"path":"contributing","title":"Contribution"},{"path":"docs-guides","title":"Vix.cpp Documentation Standard"},{"path":"examples","title":"Examples"},{"path":"examples/async-app","title":"Async App"},{"path":"examples/auth-api-key","title":"API Key Auth"},{"path":"examples/auth-jwt","title":"JWT Auth"},{"path":"examples/auth-rbac","title":"RBAC"},{"path":"examples/background-task","title":"Background Task"},{"path":"examples/cookies","title":"Cookies"},{"path":"examples/form-parser","title":"Form Parser"},{"path":"examples/hello-app","title":"Hello App"},{"path":"examples/http-cache","title":"HTTP Cache"},{"path":"examples/json-api","title":"JSON API"},{"path":"examples/middleware-api","title":"Middleware API"},{"path":"examples/multipart-upload","title":"Multipart Upload"},{"path":"examples/production-bootstrap","title":"Production Bootstrap"},{"path":"examples/session-counter","title":"Session Counter"},{"path":"examples/sqlite-api","title":"SQLite API"},{"path":"examples/static-site","title":"Static Site"},{"path":"examples/websocket-chat","title":"WebSocket Chat"},{"path":"experimental","title":"Experimental"},{"path":"experimental/vix-app","title":"vix.app"},{"path":"getting-started","title":"Welcome to Vix.cpp"},{"path":"getting-started/create-your-first-project","title":"Create Your First Project"},{"path":"getting-started/first-http-server","title":"Your First HTTP Server"},{"path":"getting-started/installation","title":"Installation"},{"path":"getting-started/run-your-first-file","title":"Run Your First C++ File"},{"path":"getting-started/setup-environment","title":"Set Up Your Environment"},{"path":"getting-started/what-is-vixcpp","title":"What is Vix.cpp?"},{"path":"guides","title":"Guides"},{"path":"guides/artifact-cache","title":"Artifact Cache"},{"path":"guides/authentication","title":"Authentication"},{"path":"guides/build-rest-api","title":"Build a REST API"},{"path":"guides/cors","title":"CORS"},{"path":"guides/cpp-developer-toolkit","title":"C++ Developer Toolkit"},{"path":"guides/cpp-runtime","title":"C++ Runtime"},{"path":"guides/database","title":"Database"},{"path":"guides/database/cli","title":"Database CLI"},{"path":"guides/database/configuration","title":"Database configuration"},{"path":"guides/database/connection-pool","title":"Connection pool"},{"path":"guides/database/migrations","title":"Migrations"},{"path":"guides/database/mysql","title":"MySQL"},{"path":"guides/database/queries","title":"Queries"},{"path":"guides/database/quick-start","title":"Database quick start"},{"path":"guides/database/schema-snapshots","title":"Schema snapshots"},{"path":"guides/database/sqlite","title":"SQLite"},{"path":"guides/database/transactions","title":"Transactions"},{"path":"guides/diagnostics","title":"Diagnostics"},{"path":"guides/fast-target-builds","title":"Fast Target Builds"},{"path":"guides/game","title":"Game Guide"},{"path":"guides/json","title":"JSON"},{"path":"guides/json/build-json","title":"Build JSON"},{"path":"guides/json/http","title":"JSON with HTTP"},{"path":"guides/json/jpath","title":"JPath"},{"path":"guides/json/parse-json","title":"Parse JSON"},{"path":"guides/json/quick-start","title":"JSON Quick Start"},{"path":"guides/json/safe-access","title":"Safe Access"},{"path":"guides/json/simple-token","title":"Simple Token"},{"path":"guides/json/write-json","title":"Write JSON"},{"path":"guides/object-cache","title":"Object Cache"},{"path":"guides/orm","title":"ORM"},{"path":"guides/orm/entities","title":"Entities"},{"path":"guides/orm/mappers","title":"Mappers"},{"path":"guides/orm/query-builder","title":"Query Builder"},{"path":"guides/orm/quick-start","title":"ORM quick start"},{"path":"guides/orm/repositories","title":"Repositories"},{"path":"guides/orm/unit-of-work","title":"Unit of Work"},{"path":"guides/orm/with-vix-db","title":"With vix::db"},{"path":"guides/production-files","title":"Production Files"},{"path":"guides/production-files/database","title":"Production Database"},{"path":"guides/production-files/deploy","title":"Production Deploy"},{"path":"guides/production-files/environment","title":"Production Environment"},{"path":"guides/production-files/existing-cpp-projects","title":"Existing C++ Projects"},{"path":"guides/production-files/health","title":"Production Health"},{"path":"guides/production-files/logs","title":"Production Logs"},{"path":"guides/production-files/proxy","title":"Production Proxy"},{"path":"guides/production-files/service","title":"Production Service"},{"path":"guides/production-files/websocket","title":"Production WebSocket"},{"path":"guides/production-nginx-systemd","title":"Production: Nginx + systemd"},{"path":"guides/rate-limiting","title":"Rate limiting"},{"path":"guides/replay","title":"Replay a Run"},{"path":"guides/runtime-arguments","title":"Runtime Arguments"},{"path":"guides/sessions","title":"Sessions"},{"path":"guides/static-files","title":"Static files"},{"path":"guides/templates","title":"Templates"},{"path":"guides/validation","title":"Validation"},{"path":"guides/vix-app","title":"vix.app"},{"path":"guides/vix-app/app-modules","title":"App Modules"},{"path":"guides/vix-app/best-practices","title":"Best Practices"},{"path":"guides/vix-app/cmake-fallback","title":"CMake Fallback"},{"path":"guides/vix-app/compile-options","title":"Compile Options"},{"path":"guides/vix-app/examples","title":"Examples"},{"path":"guides/vix-app/getting-started","title":"Getting Started"},{"path":"guides/vix-app/libraries","title":"Libraries"},{"path":"guides/vix-app/manifest-reference","title":"Manifest Reference"},{"path":"guides/vix-app/migration-from-cmake","title":"Migrating from CMake"},{"path":"guides/vix-app/output-directory","title":"Output Directory"},{"path":"guides/vix-app/packages-and-links","title":"Packages and Links"},{"path":"guides/vix-app/project-types","title":"Project Types"},{"path":"guides/vix-app/resources","title":"Resources"},{"path":"guides/vix-app/sources-and-includes","title":"Sources and Includes"},{"path":"guides/vix-app/tests","title":"Tests"},{"path":"guides/vix-app/troubleshooting","title":"Troubleshooting"},{"path":"guides/vix-vs-cmake","title":"Vix.cpp vs CMake"},{"path":"guides/websocket-chat","title":"WebSocket chat"},{"path":"internals","title":"Internals"},{"path":"internals/architecture","title":"Architecture"},{"path":"internals/cache-system","title":"Cache System"},{"path":"internals/design-decisions","title":"Design Decisions"},{"path":"internals/direct-compile","title":"Direct Compile"},{"path":"internals/error-diagnostics","title":"Error Diagnostics"},{"path":"internals/performance","title":"Performance"},{"path":"internals/runtime-model","title":"Runtime Model"},{"path":"modules","title":"Modules"},{"path":"modules/agent","title":"Agent"},{"path":"modules/agent/api-reference","title":"API Reference"},{"path":"modules/agent/cache-and-run-history","title":"Cache and Run History"},{"path":"modules/agent/cmake","title":"CMake"},{"path":"modules/agent/command-tool","title":"Command Tool"},{"path":"modules/agent/configuration","title":"Configuration"},{"path":"modules/agent/custom-providers","title":"Custom Providers"},{"path":"modules/agent/errors","title":"Errors"},{"path":"modules/agent/file-read-tool","title":"File Read Tool"},{"path":"modules/agent/model-providers","title":"Model Providers"},{"path":"modules/agent/ollama","title":"Ollama"},{"path":"modules/agent/project-scanning","title":"Project Scanning"},{"path":"modules/agent/public-api","title":"Public API"},{"path":"modules/agent/quick-start","title":"Quick Start"},{"path":"modules/agent/requests-and-responses","title":"Requests and Responses"},{"path":"modules/agent/tools","title":"Tools"},{"path":"modules/agent/workspace","title":"Workspace"},{"path":"modules/async","title":"Async"},{"path":"modules/async/api-reference","title":"API Reference"},{"path":"modules/async/architecture","title":"Architecture"},{"path":"modules/async/cancellation","title":"Cancellation"},{"path":"modules/async/cmake","title":"CMake"},{"path":"modules/async/core-concepts","title":"Core Concepts"},{"path":"modules/async/cpu-offloading","title":"CPU Offloading"},{"path":"modules/async/dns","title":"DNS"},{"path":"modules/async/errors","title":"Errors"},{"path":"modules/async/execution-model","title":"Execution Model"},{"path":"modules/async/io-context","title":"iocontext"},{"path":"modules/async/lifecycle-and-shutdown","title":"Lifecycle and Shutdown"},{"path":"modules/async/networking","title":"Networking"},{"path":"modules/async/quick-start","title":"Quick Start"},{"path":"modules/async/scheduler","title":"Scheduler"},{"path":"modules/async/signals","title":"Signals"},{"path":"modules/async/spawn","title":"Spawn and Detached Tasks"},{"path":"modules/async/task-composition","title":"Task Composition"},{"path":"modules/async/tasks","title":"Tasks"},{"path":"modules/async/tcp","title":"TCP"},{"path":"modules/async/thread-pool","title":"Thread Pool"},{"path":"modules/async/timers","title":"Timers"},{"path":"modules/async/udp","title":"UDP"},{"path":"modules/async/when-all-and-when-any","title":"whenall and whenany"},{"path":"modules/cache","title":"Cache"},{"path":"modules/cache/api-reference","title":"API Reference"},{"path":"modules/cache/cache-context","title":"Cache Context"},{"path":"modules/cache/cache-entry","title":"Cache Entry"},{"path":"modules/cache/cache-keys","title":"Cache Keys"},{"path":"modules/cache/cache-policy","title":"Cache Policy"},{"path":"modules/cache/cmake","title":"CMake"},{"path":"modules/cache/context-mapper","title":"Context Mapper"},{"path":"modules/cache/file-store","title":"File Store"},{"path":"modules/cache/lru-memory-store","title":"LRU Memory Store"},{"path":"modules/cache/memory-store","title":"Memory Store"},{"path":"modules/cache/offline-and-network-errors","title":"Offline and Network Errors"},{"path":"modules/cache/pruning","title":"Pruning"},{"path":"modules/cache/quick-start","title":"Quick Start"},{"path":"modules/cache/stores","title":"Stores"},{"path":"modules/conversion","title":"Conversion"},{"path":"modules/conversion/api-reference","title":"API Reference"},{"path":"modules/conversion/booleans","title":"Booleans"},{"path":"modules/conversion/enums","title":"Enums"},{"path":"modules/conversion/errors","title":"Errors"},{"path":"modules/conversion/expected-results","title":"Expected Results"},{"path":"modules/conversion/floats","title":"Floats"},{"path":"modules/conversion/generic-parse","title":"Generic Parse"},{"path":"modules/conversion/integers","title":"Integers"},{"path":"modules/conversion/quick-start","title":"Quick Start"},{"path":"modules/conversion/to-string","title":"To String"},{"path":"modules/core","title":"Core"},{"path":"modules/core/api-reference","title":"API Reference"},{"path":"modules/core/app","title":"vix::App"},{"path":"modules/core/architecture","title":"Architecture"},{"path":"modules/core/async-and-runtime","title":"Async and runtime"},{"path":"modules/core/attached-runtime","title":"Attached runtime"},{"path":"modules/core/configuration","title":"Configuration"},{"path":"modules/core/console","title":"Console"},{"path":"modules/core/format","title":"Format"},{"path":"modules/core/handlers","title":"Handlers"},{"path":"modules/core/http-server","title":"HTTP server"},{"path":"modules/core/input","title":"Input"},{"path":"modules/core/inspect","title":"Inspect"},{"path":"modules/core/middleware","title":"Middleware"},{"path":"modules/core/openapi","title":"OpenAPI"},{"path":"modules/core/print","title":"Print"},{"path":"modules/core/request","title":"Request"},{"path":"modules/core/response","title":"Response"},{"path":"modules/core/routing","title":"Routing"},{"path":"modules/core/runtime-executor","title":"Runtime executor"},{"path":"modules/core/sessions","title":"Sessions"},{"path":"modules/core/static-files","title":"Static files"},{"path":"modules/core/templates","title":"Templates"},{"path":"modules/core/tls","title":"TLS"},{"path":"modules/core/transports","title":"Transports"},{"path":"modules/crypto","title":"Crypto"},{"path":"modules/crypto/aead","title":"AEAD"},{"path":"modules/crypto/api-reference","title":"API Reference"},{"path":"modules/crypto/bytes-and-hex","title":"Bytes and Hex"},{"path":"modules/crypto/certificates","title":"Certificates"},{"path":"modules/crypto/cmake","title":"CMake"},{"path":"modules/crypto/constant-time-compare","title":"Constant-Time Compare"},{"path":"modules/crypto/hashing","title":"Hashing"},{"path":"modules/crypto/hmac","title":"HMAC"},{"path":"modules/crypto/kdf","title":"KDF"},{"path":"modules/crypto/keys","title":"Keys"},{"path":"modules/crypto/passwords","title":"Passwords"},{"path":"modules/crypto/quick-start","title":"Quick Start"},{"path":"modules/crypto/random","title":"Random"},{"path":"modules/crypto/results-and-errors","title":"Results and Errors"},{"path":"modules/crypto/signatures","title":"Signatures"},{"path":"modules/env","title":"Env"},{"path":"modules/env/api-reference","title":"API Reference"},{"path":"modules/env/env-files","title":".env Files"},{"path":"modules/env/errors","title":"Errors"},{"path":"modules/env/layered-loading","title":"Layered Loading"},{"path":"modules/env/load-into-process","title":"Load Into Process"},{"path":"modules/env/options","title":"Options"},{"path":"modules/env/parsing","title":"Parsing"},{"path":"modules/env/process-environment","title":"Process Environment"},{"path":"modules/env/quick-start","title":"Quick Start"},{"path":"modules/env/typed-values","title":"Typed Values"},{"path":"modules/error","title":"Error"},{"path":"modules/error/api-reference","title":"API Reference"},{"path":"modules/error/error-categories","title":"Error Categories"},{"path":"modules/error/error-codes","title":"Error Codes"},{"path":"modules/error/error-object","title":"Error Object"},{"path":"modules/error/exception","title":"Exception Bridge"},{"path":"modules/error/result","title":"Result"},{"path":"modules/fs","title":"FS"},{"path":"modules/fs/api-reference","title":"API Reference"},{"path":"modules/fs/copy-move-remove","title":"Copy, Move, and Remove"},{"path":"modules/fs/directories","title":"Directories"},{"path":"modules/fs/errors","title":"Errors"},{"path":"modules/fs/listing","title":"Listing"},{"path":"modules/fs/metadata","title":"Metadata"},{"path":"modules/fs/options","title":"Options"},{"path":"modules/fs/paths-and-results","title":"Paths and Results"},{"path":"modules/fs/quick-start","title":"Quick Start"},{"path":"modules/fs/read-and-write","title":"Read and Write"},{"path":"modules/io","title":"IO"},{"path":"modules/io/api-reference","title":"API Reference"},{"path":"modules/io/buffers","title":"Buffers"},{"path":"modules/io/copy","title":"Copy"},{"path":"modules/io/errors","title":"Errors"},{"path":"modules/io/input-and-output","title":"Input and Output"},{"path":"modules/io/lines","title":"Lines"},{"path":"modules/io/options","title":"Options"},{"path":"modules/io/quick-start","title":"Quick Start"},{"path":"modules/io/read-and-write","title":"Read and Write"},{"path":"modules/io/standard-streams","title":"Standard Streams"},{"path":"modules/kv","title":"KV"},{"path":"modules/kv/api-reference","title":"API Reference"},{"path":"modules/kv/keys","title":"Keys"},{"path":"modules/kv/opening","title":"Opening a database"},{"path":"modules/kv/persistence","title":"Persistence"},{"path":"modules/kv/recovery","title":"Recovery"},{"path":"modules/kv/stats","title":"Stats"},{"path":"modules/kv/values","title":"Values"},{"path":"modules/middleware","title":"Middleware"},{"path":"modules/middleware/api-reference","title":"API Reference"},{"path":"modules/middleware/app-integration","title":"App Integration"},{"path":"modules/middleware/authentication","title":"Authentication"},{"path":"modules/middleware/basics","title":"Basics"},{"path":"modules/middleware/concepts","title":"Core Concepts"},{"path":"modules/middleware/http-cache","title":"HTTP Cache"},{"path":"modules/middleware/observability","title":"Observability"},{"path":"modules/middleware/parsers","title":"Parsers"},{"path":"modules/middleware/performance","title":"Performance"},{"path":"modules/middleware/quick-start","title":"Quick Start"},{"path":"modules/middleware/security","title":"Security"},{"path":"modules/note","title":"Vix Note"},{"path":"modules/note/api-reference","title":"API Reference"},{"path":"modules/note/cells","title":"Cells"},{"path":"modules/note/cpp-cells","title":"C++ Cells"},{"path":"modules/note/document-format","title":"Document Format"},{"path":"modules/note/export","title":"Export"},{"path":"modules/note/extension-manifest","title":"Extension Manifest"},{"path":"modules/note/extension-protocol","title":"Extension Protocol"},{"path":"modules/note/extension-requirements","title":"Extension Requirements"},{"path":"modules/note/extension-tutorial-pyrelune","title":"Pyrelune Extension Tutorial"},{"path":"modules/note/extensions","title":"Creating Note Extensions"},{"path":"modules/note/html-cells","title":"HTML Cells"},{"path":"modules/note/local-ui","title":"Local UI"},{"path":"modules/note/project-context","title":"Project Context"},{"path":"modules/note/quick-start","title":"Quick Start"},{"path":"modules/note/reply-cells","title":"Reply Cells"},{"path":"modules/note/runtime","title":"Runtime"},{"path":"modules/os","title":"OS"},{"path":"modules/os/api-reference","title":"API Reference"},{"path":"modules/os/directories","title":"Directories"},{"path":"modules/os/errors","title":"Errors"},{"path":"modules/os/platform-and-architecture","title":"Platform and Architecture"},{"path":"modules/os/quick-start","title":"Quick Start"},{"path":"modules/os/sleep","title":"Sleep"},{"path":"modules/os/system-resources","title":"System Resources"},{"path":"modules/os/user-and-process","title":"User and Process"},{"path":"modules/p2p","title":"p2p"},{"path":"modules/p2p/api-reference","title":"api reference"},{"path":"modules/p2p/bootstrap","title":"bootstrap"},{"path":"modules/p2p/discovery","title":"discovery"},{"path":"modules/p2p/http-control","title":"http control"},{"path":"modules/p2p/node","title":"node"},{"path":"modules/p2p/protocol","title":"protocol"},{"path":"modules/p2p/router","title":"router"},{"path":"modules/p2p/wal-replication","title":"wal replication"},{"path":"modules/path","title":"Path"},{"path":"modules/path/absolute-and-relative","title":"Absolute and Relative"},{"path":"modules/path/api-reference","title":"API Reference"},{"path":"modules/path/components","title":"Path Components"},{"path":"modules/path/errors","title":"Errors"},{"path":"modules/path/join-and-normalize","title":"Join and Normalize"},{"path":"modules/path/lexical-paths","title":"Lexical Paths"},{"path":"modules/path/options","title":"Options"},{"path":"modules/path/quick-start","title":"Quick Start"},{"path":"modules/path/separators-and-styles","title":"Separators and Styles"},{"path":"modules/process","title":"Process"},{"path":"modules/process/api-reference","title":"API Reference"},{"path":"modules/process/async","title":"Async"},{"path":"modules/process/cmake","title":"CMake"},{"path":"modules/process/commands","title":"Commands"},{"path":"modules/process/errors","title":"Errors"},{"path":"modules/process/options-and-pipes","title":"Options and Pipes"},{"path":"modules/process/output","title":"Output"},{"path":"modules/process/pipelines","title":"Pipelines"},{"path":"modules/process/quick-start","title":"Quick Start"},{"path":"modules/process/spawn-and-child","title":"Spawn and Child"},{"path":"modules/process/status-and-wait","title":"Status and Wait"},{"path":"modules/process/terminate-and-kill","title":"Terminate and Kill"},{"path":"modules/realtime","title":"Realtime"},{"path":"modules/realtime/api-reference","title":"API Reference"},{"path":"modules/realtime/architecture","title":"Architecture"},{"path":"modules/realtime/cmake","title":"CMake"},{"path":"modules/realtime/commands-and-results","title":"Commands and Results"},{"path":"modules/realtime/configuration","title":"Configuration"},{"path":"modules/realtime/connections","title":"Connections"},{"path":"modules/realtime/core-concepts","title":"Core Concepts"},{"path":"modules/realtime/distributed-presence","title":"Distributed Presence"},{"path":"modules/realtime/errors","title":"Errors"},{"path":"modules/realtime/event-store","title":"Event Store"},{"path":"modules/realtime/events","title":"Events"},{"path":"modules/realtime/health","title":"Health"},{"path":"modules/realtime/metrics","title":"Metrics"},{"path":"modules/realtime/postgresql","title":"PostgreSQL"},{"path":"modules/realtime/presence","title":"Presence"},{"path":"modules/realtime/protocol","title":"Protocol"},{"path":"modules/realtime/quick-start","title":"Quick Start"},{"path":"modules/realtime/replay-and-recovery","title":"Replay and Recovery"},{"path":"modules/realtime/room-handlers","title":"Room Handlers"},{"path":"modules/realtime/room-manager","title":"Room Manager"},{"path":"modules/realtime/room-ownership","title":"Room Ownership"},{"path":"modules/realtime/room-state","title":"Room State"},{"path":"modules/realtime/rooms","title":"Rooms"},{"path":"modules/realtime/server","title":"Server"},{"path":"modules/realtime/session-resume","title":"Session Resume"},{"path":"modules/realtime/sessions","title":"Sessions"},{"path":"modules/realtime/snapshots","title":"Snapshots"},{"path":"modules/realtime/transport","title":"Transport"},{"path":"modules/realtime/websocket-integration","title":"WebSocket Integration"},{"path":"modules/requests","title":"Requests"},{"path":"modules/requests/api-reference","title":"API Reference"},{"path":"modules/requests/bodies","title":"Bodies"},{"path":"modules/requests/client","title":"Client"},{"path":"modules/requests/errors","title":"Errors"},{"path":"modules/requests/headers-and-params","title":"Headers and Params"},{"path":"modules/requests/https-and-tls","title":"HTTPS and TLS"},{"path":"modules/requests/quick-start","title":"Quick Start"},{"path":"modules/requests/redirects-and-cookies","title":"Redirects and Cookies"},{"path":"modules/requests/request-options","title":"Request Options"},{"path":"modules/requests/responses","title":"Responses"},{"path":"modules/requests/session","title":"Session"},{"path":"modules/requests/timeouts","title":"Timeouts"},{"path":"modules/sync","title":"Sync"},{"path":"modules/sync/api-reference","title":"API Reference"},{"path":"modules/sync/cmake","title":"CMake"},{"path":"modules/sync/file-outbox-store","title":"File Outbox Store"},{"path":"modules/sync/inflight-recovery","title":"In-flight Recovery"},{"path":"modules/sync/offline-first-model","title":"Offline-first Model"},{"path":"modules/sync/operations","title":"Operations"},{"path":"modules/sync/outbox","title":"Outbox"},{"path":"modules/sync/quick-start","title":"Quick Start"},{"path":"modules/sync/retry-policy","title":"Retry Policy"},{"path":"modules/sync/sync-engine","title":"Sync Engine"},{"path":"modules/sync/transports","title":"Transports"},{"path":"modules/sync/wal","title":"WAL"},{"path":"modules/tests","title":"Tests"},{"path":"modules/tests/api-reference","title":"API Reference"},{"path":"modules/tests/assertions","title":"Assertions"},{"path":"modules/tests/cli","title":"CLI"},{"path":"modules/tests/cmake","title":"CMake"},{"path":"modules/tests/colors-and-output","title":"Colors and Output"},{"path":"modules/tests/quick-start","title":"Quick Start"},{"path":"modules/tests/registry","title":"Registry"},{"path":"modules/tests/runner","title":"Runner"},{"path":"modules/tests/summaries","title":"Summaries"},{"path":"modules/tests/test-cases","title":"Test Cases"},{"path":"modules/tests/test-suites","title":"Test Suites"},{"path":"modules/tests/timers","title":"Timers"},{"path":"modules/threadpool","title":"ThreadPool"},{"path":"modules/threadpool/api-reference","title":"API Reference"},{"path":"modules/threadpool/architecture","title":"Architecture"},{"path":"modules/threadpool/cancellation","title":"Cancellation"},{"path":"modules/threadpool/cmake","title":"CMake"},{"path":"modules/threadpool/configuration","title":"Configuration"},{"path":"modules/threadpool/core-concepts","title":"Core Concepts"},{"path":"modules/threadpool/deadlines","title":"Deadlines"},{"path":"modules/threadpool/errors","title":"Errors"},{"path":"modules/threadpool/execution-model","title":"Execution Model"},{"path":"modules/threadpool/executors","title":"Executors"},{"path":"modules/threadpool/futures-and-promises","title":"Futures and Promises"},{"path":"modules/threadpool/lifecycle-and-shutdown","title":"Lifecycle and Shutdown"},{"path":"modules/threadpool/metrics-and-statistics","title":"Metrics and Statistics"},{"path":"modules/threadpool/parallel-algorithms","title":"Parallel Algorithms"},{"path":"modules/threadpool/parallel-for","title":"Parallel For"},{"path":"modules/threadpool/parallel-for-each","title":"Parallel For Each"},{"path":"modules/threadpool/parallel-map","title":"Parallel Map"},{"path":"modules/threadpool/parallel-pipeline","title":"Parallel Pipeline"},{"path":"modules/threadpool/parallel-reduce","title":"Parallel Reduce"},{"path":"modules/threadpool/periodic-tasks","title":"Periodic Tasks"},{"path":"modules/threadpool/priorities","title":"Priorities"},{"path":"modules/threadpool/queue-and-rejection","title":"Queue and Rejection Policies"},{"path":"modules/threadpool/quick-start","title":"Quick Start"},{"path":"modules/threadpool/scheduling","title":"Scheduling Model"},{"path":"modules/threadpool/scopes","title":"Scopes"},{"path":"modules/threadpool/synchronization","title":"Synchronization"},{"path":"modules/threadpool/task-groups","title":"Task Groups"},{"path":"modules/threadpool/task-handles","title":"Task Handles"},{"path":"modules/threadpool/task-results-and-status","title":"Task Results and Status"},{"path":"modules/threadpool/tasks","title":"Tasks and Options"},{"path":"modules/threadpool/thread-pool","title":"Thread Pool"},{"path":"modules/threadpool/timeouts","title":"Timeouts"},{"path":"modules/threadpool/worker-affinity","title":"Worker Affinity"},{"path":"modules/time","title":"Time"},{"path":"modules/time/api-reference","title":"API Reference"},{"path":"modules/time/chrono-interop","title":"Chrono Interop"},{"path":"modules/time/clocks","title":"Clocks"},{"path":"modules/time/dates","title":"Dates"},{"path":"modules/time/datetimes","title":"DateTime"},{"path":"modules/time/durations","title":"Durations"},{"path":"modules/time/parsing","title":"Parsing"},{"path":"modules/time/quick-start","title":"Quick Start"},{"path":"modules/time/timestamps","title":"Timestamps"},{"path":"modules/ui","title":"Vix UI"},{"path":"modules/ui/app-shell","title":"App shell"},{"path":"modules/ui/assets","title":"Assets"},{"path":"modules/ui/examples","title":"Examples"},{"path":"modules/ui/forms","title":"Forms"},{"path":"modules/ui/html","title":"HTML helpers"},{"path":"modules/ui/html-response","title":"HTML response"},{"path":"modules/ui/live","title":"Live UI"},{"path":"modules/ui/pwa","title":"PWA helpers"},{"path":"modules/ui/tests","title":"Tests"},{"path":"modules/ui/views","title":"Views"},{"path":"modules/validation","title":"Validation"},{"path":"modules/validation/api-reference","title":"API Reference"},{"path":"modules/validation/base-models","title":"Base Models"},{"path":"modules/validation/errors","title":"Errors"},{"path":"modules/validation/forms","title":"Forms"},{"path":"modules/validation/parsed-validation","title":"Parsed Validation"},{"path":"modules/validation/quick-start","title":"Quick Start"},{"path":"modules/validation/results","title":"Results"},{"path":"modules/validation/rules","title":"Rules"},{"path":"modules/validation/schemas","title":"Schemas"},{"path":"modules/validation/single-field-validation","title":"Single Field Validation"},{"path":"modules/webrpc","title":"WebRPC"},{"path":"modules/webrpc/api-reference","title":"API Reference"},{"path":"modules/webrpc/batches-and-notifications","title":"Batches and Notifications"},{"path":"modules/webrpc/context","title":"Context"},{"path":"modules/webrpc/dispatcher","title":"Dispatcher"},{"path":"modules/webrpc/errors","title":"Errors"},{"path":"modules/webrpc/metadata","title":"Metadata"},{"path":"modules/webrpc/quick-start","title":"Quick Start"},{"path":"modules/webrpc/requests","title":"Requests"},{"path":"modules/webrpc/responses","title":"Responses"},{"path":"modules/webrpc/router","title":"Router"},{"path":"modules/websocket","title":"WebSocket"},{"path":"modules/websocket/api-reference","title":"API Reference"},{"path":"modules/websocket/attached-runtime","title":"Attached runtime"},{"path":"modules/websocket/client","title":"Client"},{"path":"modules/websocket/concepts","title":"Concepts"},{"path":"modules/websocket/configuration","title":"Configuration"},{"path":"modules/websocket/http-api","title":"HTTP API"},{"path":"modules/websocket/long-polling","title":"Long polling"},{"path":"modules/websocket/message-store","title":"Message store"},{"path":"modules/websocket/messages","title":"Messages"},{"path":"modules/websocket/metrics","title":"Metrics"},{"path":"modules/websocket/openapi","title":"OpenAPI"},{"path":"modules/websocket/quick-start","title":"Quick Start"},{"path":"modules/websocket/rooms-and-broadcasting","title":"Rooms and Broadcasting"},{"path":"modules/websocket/router","title":"Router"},{"path":"modules/websocket/server","title":"Server"},{"path":"modules/websocket/session","title":"Session"},{"path":"modules/websocket/shutdown","title":"Shutdown"},{"path":"modules/websocket/sqlite-message-store","title":"SQLite message store"},{"path":"project-setup","title":"Project setup"},{"path":"pull-request","title":"Pull Requests"},{"path":"quick-start","title":"Quick start"},{"path":"README","title":"README"},{"path":"registry","title":"Package Registry"},{"path":"registry/extensions","title":"Registry Extensions"},{"path":"registry/package-metadata","title":"Package Metadata"},{"path":"registry/publishing","title":"Publishing Packages"},{"path":"registry/vix-json","title":"vix.json Reference"},{"path":"releases","title":"Releases"},{"path":"releases/builds","title":"Builds"},{"path":"releases/changelog","title":"Changelog"},{"path":"sdks","title":"SDK Profiles"},{"path":"sdks/agent","title":"Agent SDK"},{"path":"sdks/all","title":"Full SDK"},{"path":"sdks/data","title":"Data SDK"},{"path":"sdks/default","title":"Default SDK"},{"path":"sdks/desktop","title":"Desktop SDK"},{"path":"sdks/game","title":"Game SDK"},{"path":"sdks/p2p","title":"P2P SDK"},{"path":"sdks/web","title":"Web SDK"},{"path":"security","title":"Security"},{"path":"templates","title":"Project Templates"},{"path":"templates/application","title":"Application Template"},{"path":"templates/application/layout","title":"Generated Layout"},{"path":"templates/application/manifest","title":"Manifest"},{"path":"templates/application/module-registry","title":"Module Registry"},{"path":"templates/backend","title":"Backend Template"},{"path":"templates/backend/app-bootstrap","title":"App Bootstrap"},{"path":"templates/backend/layout","title":"Generated Layout"},{"path":"templates/backend/modules-integration","title":"Modules Integration"},{"path":"templates/backend/production-files","title":"Production Files"},{"path":"templates/backend/routes-and-middleware","title":"Routes and Middleware"},{"path":"templates/game","title":"Game Template"},{"path":"templates/game/assets-and-package","title":"Assets and Package"},{"path":"templates/game/layout","title":"Generated Layout"},{"path":"templates/game/manifest","title":"Game Manifest"},{"path":"templates/library","title":"Library Template"},{"path":"templates/library/cmake-package","title":"CMake Package"},{"path":"templates/library/examples-and-tests","title":"Examples and Tests"},{"path":"templates/library/layout","title":"Generated Layout"},{"path":"templates/library/registry-metadata","title":"Registry Metadata"},{"path":"templates/vue","title":"Vue.js Template"},{"path":"templates/vue/backend-integration","title":"Backend Integration"},{"path":"templates/vue/frontend-workflow","title":"Frontend Workflow"},{"path":"templates/vue/layout","title":"Generated Layout"},{"path":"templates/web","title":"Web Template"},{"path":"templates/web/layout","title":"Generated Layout"},{"path":"templates/web/production-files","title":"Production Files"},{"path":"templates/web/rendering-flow","title":"Rendering Flow"},{"path":"templates/web/routes-and-views","title":"Routes and Views"}]');
const docsPages = docsIndex;
function normalizeDocsPath(path) {
  return (Array.isArray(path) ? path.join("/") : path || "").replace(/^\/+|\/+$/g, "").replace(/\.md$/, "").replace(/\/index$/, "");
}
function findDocsPage(path) {
  return docsPages.find((page) => page.path === normalizeDocsPath(path));
}
const _sfc_main$h = {
  __name: "App",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const meta = computed(() => {
      const post = route.path.startsWith("/blog/") && findBlogPost(route.params.pathMatch);
      const doc = route.path.startsWith("/docs") && findDocsPage(route.params.pathMatch);
      const pages = {
        "/": [
          "Vix.cpp | A runtime for C++ applications",
          "Vix.cpp is a runtime for C++ applications. It provides a coherent way to build, run, and operate C++ software throughout its lifecycle."
        ],
        "/learn": [
          "Learn Vix.cpp",
          "Learn how Vix.cpp supports C++ application development."
        ],
        "/community": [
          "Community | Vix.cpp",
          "Connect with the Vix.cpp community."
        ],
        "/blog": [
          "Blog | Vix.cpp",
          "News, release notes, technical deep dives, and development updates from Vix.cpp."
        ],
        "/docs": [
          "Documentation | Vix.cpp",
          "Vix.cpp documentation for building native C++ applications."
        ]
      };
      const [title, description2] = post ? [`${post.title} | Vix.cpp`, post.description] : doc ? [`${doc.title} | Vix.cpp`, `Vix.cpp documentation: ${doc.title}.`] : pages[route.path] || ["Vix.cpp", ""];
      const path = post ? `/blog/${post.path}` : route.path;
      const url = `https://vixcpp.com${path === "/" ? "/" : path}`;
      return {
        title,
        meta: [
          { name: "description", content: description2 },
          { property: "og:type", content: post ? "article" : "website" },
          { property: "og:site_name", content: "Vix.cpp" },
          { property: "og:title", content: title },
          { property: "og:description", content: description2 },
          { property: "og:url", content: url },
          { name: "twitter:card", content: "summary" },
          { name: "twitter:title", content: title },
          { name: "twitter:description", content: description2 }
        ],
        link: [{ rel: "canonical", href: url }]
      };
    });
    useHead(meta);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_RouterView = resolveComponent("RouterView");
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "app-shell" }, _attrs))} data-v-46228770>`);
      _push(ssrRenderComponent(SiteHeader, null, null, _parent));
      _push(`<main class="app-main" data-v-46228770>`);
      _push(ssrRenderComponent(_component_RouterView, null, null, _parent));
      _push(`</main>`);
      _push(ssrRenderComponent(SiteFooter, null, null, _parent));
      _push(`</div>`);
    };
  }
};
const _sfc_setup$h = _sfc_main$h.setup;
_sfc_main$h.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/App.vue");
  return _sfc_setup$h ? _sfc_setup$h(props, ctx) : void 0;
};
const App = /* @__PURE__ */ _export_sfc(_sfc_main$h, [["__scopeId", "data-v-46228770"]]);
const hero = {
  title: "A runtime for C++ applications.",
  description: "Vix.cpp provides a coherent way to build, run, and operate C++ applications throughout their lifecycle, while working with the C++ ecosystem you already use.",
  actions: [
    {
      label: "Get Started",
      href: "https://docs.vixcpp.com",
      primary: true,
      external: true
    },
    {
      label: "GitHub",
      href: "https://github.com/vixcpp/vix",
      primary: false,
      external: true
    }
  ],
  meta: ["Open source", "Works with existing CMake projects"],
  showcase: [
    {
      title: "From one file to a project.",
      description: "Run a C++ source file directly, or use Vix.cpp with a complete project.",
      points: [
        "Run a single .cpp file with vix run.",
        "Build and test project targets.",
        "Existing CMake projects can remain CMake-first."
      ]
    },
    {
      title: "Manage project dependencies.",
      description: "Install and lock C++ dependencies without replacing the build system your project already uses.",
      points: [
        "Install Registry or Git dependencies.",
        "Use installed dependencies from existing CMake projects.",
        "Keep resolved dependency state in vix.lock."
      ]
    },
    {
      title: "From build to production.",
      description: "Build, deploy, and operate C++ backend applications through the Vix.cpp workflow.",
      points: [
        "Deploy with vix deploy.",
        "Manage services, reverse proxies and health checks.",
        "Inspect production state and logs with vix."
      ]
    }
  ]
};
const _sfc_main$g = {
  __name: "HeroSection",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({ class: "hero" }, _attrs))} data-v-99e160d0><div class="container" data-v-99e160d0><div class="hero-intro" data-v-99e160d0><div class="hero-intro__copy" data-v-99e160d0><h1 class="hero-title" data-v-99e160d0>${ssrInterpolate(unref(hero).title)}</h1><p class="hero-description" data-v-99e160d0>${ssrInterpolate(unref(hero).description)}</p></div><aside class="hero-start" aria-label="Get started with Vix.cpp" data-v-99e160d0><span class="hero-start__label" data-v-99e160d0>Get started</span><a class="hero-start__primary" href="https://docs.vixcpp.com" target="_blank" rel="noreferrer" data-v-99e160d0> Get Started </a><div class="hero-start__secondary-actions" data-v-99e160d0><a href="https://docs.vixcpp.com" target="_blank" rel="noreferrer" data-v-99e160d0> Documentation </a><a href="https://github.com/vixcpp/vix" target="_blank" rel="noreferrer" data-v-99e160d0> GitHub </a></div></aside></div><div class="hero-showcase" data-v-99e160d0><div class="showcase-copy" data-v-99e160d0><!--[-->`);
      ssrRenderList(unref(hero).showcase, (section, index) => {
        _push(`<article class="showcase-item" data-v-99e160d0><div class="showcase-item__number" data-v-99e160d0>${ssrInterpolate(String(index + 1).padStart(2, "0"))}</div><div class="showcase-item__body" data-v-99e160d0><h2 data-v-99e160d0>${ssrInterpolate(section.title)}</h2><p data-v-99e160d0>${ssrInterpolate(section.description)}</p><ul data-v-99e160d0><!--[-->`);
        ssrRenderList(section.points, (point) => {
          _push(`<li data-v-99e160d0>${ssrInterpolate(point)}</li>`);
        });
        _push(`<!--]--></ul></div></article>`);
      });
      _push(`<!--]--></div><div class="showcase-demo" data-v-99e160d0><div class="dev-window" data-v-99e160d0><div class="dev-window__bar" data-v-99e160d0><div class="dev-window__bar-left" data-v-99e160d0><span class="window-dot" data-v-99e160d0></span><span class="window-dot" data-v-99e160d0></span><span class="window-dot window-dot--active" data-v-99e160d0></span><span class="dev-window__file" data-v-99e160d0> main.cpp </span></div><span class="dev-window__language" data-v-99e160d0> C++ </span></div><div class="editor" data-v-99e160d0><div class="editor__line" data-v-99e160d0><span class="editor__number" data-v-99e160d0>1</span><code data-v-99e160d0><span class="cpp-directive" data-v-99e160d0>#include</span><span class="cpp-include" data-v-99e160d0>&lt;future&gt;</span></code></div><div class="editor__line" data-v-99e160d0><span class="editor__number" data-v-99e160d0>2</span><code data-v-99e160d0><span class="cpp-directive" data-v-99e160d0>#include</span><span class="cpp-include" data-v-99e160d0>&lt;iostream&gt;</span></code></div><div class="editor__line" data-v-99e160d0><span class="editor__number" data-v-99e160d0>3</span><code data-v-99e160d0><span class="cpp-directive" data-v-99e160d0>#include</span><span class="cpp-include" data-v-99e160d0>&lt;thread&gt;</span></code></div><div class="editor__line" data-v-99e160d0><span class="editor__number" data-v-99e160d0>4</span><code data-v-99e160d0></code></div><div class="editor__line" data-v-99e160d0><span class="editor__number" data-v-99e160d0>5</span><code data-v-99e160d0><span class="cpp-keyword" data-v-99e160d0>int</span><span class="cpp-function" data-v-99e160d0>main</span><span class="cpp-op" data-v-99e160d0>()</span></code></div><div class="editor__line" data-v-99e160d0><span class="editor__number" data-v-99e160d0>6</span><code data-v-99e160d0><span class="cpp-op" data-v-99e160d0>{</span></code></div><div class="editor__line editor__line--problem" data-v-99e160d0><span class="editor__number" data-v-99e160d0>7</span><code data-v-99e160d0>    <span class="cpp-namespace" data-v-99e160d0>std</span><span class="cpp-op" data-v-99e160d0>::</span>promise<span class="cpp-op" data-v-99e160d0>&lt;</span><span class="cpp-keyword" data-v-99e160d0>int</span><span class="cpp-op" data-v-99e160d0>&gt;</span> promise<span class="cpp-op" data-v-99e160d0>;</span></code></div><div class="editor__line" data-v-99e160d0><span class="editor__number" data-v-99e160d0>8</span><code data-v-99e160d0>    <span class="cpp-keyword" data-v-99e160d0>auto</span> future <span class="cpp-op" data-v-99e160d0>=</span> promise<span class="cpp-op" data-v-99e160d0>.</span><span class="cpp-function" data-v-99e160d0>get_future</span><span class="cpp-op" data-v-99e160d0>();</span></code></div><div class="editor__line" data-v-99e160d0><span class="editor__number" data-v-99e160d0>9</span><code data-v-99e160d0></code></div><div class="editor__line" data-v-99e160d0><span class="editor__number" data-v-99e160d0>10</span><code data-v-99e160d0>    <span class="cpp-namespace" data-v-99e160d0>std</span><span class="cpp-op" data-v-99e160d0>::</span>thread worker<span class="cpp-op" data-v-99e160d0>([</span>p <span class="cpp-op" data-v-99e160d0>=</span><span class="cpp-namespace" data-v-99e160d0>std</span><span class="cpp-op" data-v-99e160d0>::</span><span class="cpp-function" data-v-99e160d0>move</span><span class="cpp-op" data-v-99e160d0>(</span>promise<span class="cpp-op" data-v-99e160d0>)]() </span>mutable <span class="cpp-op" data-v-99e160d0>{});</span></code></div><div class="editor__line" data-v-99e160d0><span class="editor__number" data-v-99e160d0>11</span><code data-v-99e160d0>    worker<span class="cpp-op" data-v-99e160d0>.</span><span class="cpp-function" data-v-99e160d0>join</span><span class="cpp-op" data-v-99e160d0>();</span></code></div><div class="editor__line" data-v-99e160d0><span class="editor__number" data-v-99e160d0>12</span><code data-v-99e160d0></code></div><div class="editor__line" data-v-99e160d0><span class="editor__number" data-v-99e160d0>13</span><code data-v-99e160d0>    <span class="cpp-namespace" data-v-99e160d0>std</span><span class="cpp-op" data-v-99e160d0>::</span>cout <span class="cpp-op" data-v-99e160d0>&lt;&lt;</span> future<span class="cpp-op" data-v-99e160d0>.</span><span class="cpp-function" data-v-99e160d0>get</span><span class="cpp-op" data-v-99e160d0>() &lt;&lt;</span><span class="cpp-include" data-v-99e160d0>&#39;\\n&#39;</span><span class="cpp-op" data-v-99e160d0>;</span></code></div><div class="editor__line" data-v-99e160d0><span class="editor__number" data-v-99e160d0>14</span><code data-v-99e160d0><span class="cpp-op" data-v-99e160d0>}</span></code></div></div><div class="terminal" data-v-99e160d0><div class="terminal__bar" data-v-99e160d0><span data-v-99e160d0>Terminal</span><span class="terminal__state" data-v-99e160d0> Vix </span></div><div class="terminal__body" data-v-99e160d0><div class="terminal__command" data-v-99e160d0><span class="terminal__prompt" data-v-99e160d0>$</span><span class="terminal__command-text" data-v-99e160d0>vix run main.cpp</span></div><div data-v-99e160d0><span class="terminal__error" data-v-99e160d0>runtime error:</span> broken promise </div><div class="terminal__location" data-v-99e160d0> --&gt; /home/softadastra/tmp/vix/main.cpp:7:5 </div><div class="terminal__frame" data-v-99e160d0><div data-v-99e160d0><span class="terminal__line-number" data-v-99e160d0> 5 | </span> int main() </div><div data-v-99e160d0><span class="terminal__line-number" data-v-99e160d0> 6 | </span> { </div><div class="terminal__problem" data-v-99e160d0><span class="terminal__line-number" data-v-99e160d0> 7 | </span>     std::promise&lt;int&gt; promise; </div><div data-v-99e160d0><span class="terminal__line-number" data-v-99e160d0>   | </span><span class="terminal__caret" data-v-99e160d0>    ^</span></div><div data-v-99e160d0><span class="terminal__line-number" data-v-99e160d0> 8 | </span>     auto future = promise.get_future(); </div></div><div class="terminal__hint" data-v-99e160d0><span class="terminal__hint-label" data-v-99e160d0>hint:</span><span data-v-99e160d0> set a value or exception before destroying the promise, or keep the promise alive until fulfillment </span></div></div></div></div></div></div></div></section>`);
    };
  }
};
const _sfc_setup$g = _sfc_main$g.setup;
_sfc_main$g.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/home/HeroSection.vue");
  return _sfc_setup$g ? _sfc_setup$g(props, ctx) : void 0;
};
const HeroSection = /* @__PURE__ */ _export_sfc(_sfc_main$g, [["__scopeId", "data-v-99e160d0"]]);
const whyVix = {
  id: "why-vix",
  title: "Why Vix.cpp?",
  description: "Vix.cpp works with the C++ ecosystem you already use, while giving applications a clearer lifecycle and better visibility when something goes wrong.",
  items: [
    {
      key: "stack",
      number: "01",
      title: "Keep your C++ stack.",
      description: "Use CMake, GCC or Clang, and the C++ libraries your project already depends on. Vix.cpp does not require you to move into a separate ecosystem."
    },
    {
      key: "lifecycle",
      number: "02",
      title: "One application lifecycle.",
      description: "Use the same Vix.cpp workflow as the application moves from development to execution and production."
    },
    {
      key: "diagnostics",
      number: "03",
      title: "See what actually failed.",
      description: "Vix.cpp connects failures from different parts of the application lifecycle to the cause, location, and information you can act on."
    }
  ]
};
const _sfc_main$f = {
  __name: "WhyVixSection",
  __ssrInlineRender: true,
  setup(__props) {
    const reasons = whyVix.items;
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({
        id: unref(whyVix).id,
        class: "why"
      }, _attrs))} data-v-1d8e2d6f><div class="container" data-v-1d8e2d6f><header class="why__header" data-v-1d8e2d6f><h2 class="why__title" data-v-1d8e2d6f>${ssrInterpolate(unref(whyVix).title)}</h2><p class="why__description" data-v-1d8e2d6f>${ssrInterpolate(unref(whyVix).description)}</p></header><div class="why__reasons" data-v-1d8e2d6f><!--[-->`);
      ssrRenderList(unref(reasons), (reason) => {
        _push(`<article class="reason" data-v-1d8e2d6f><span class="reason__number" data-v-1d8e2d6f>${ssrInterpolate(reason.number)}</span><h3 data-v-1d8e2d6f>${ssrInterpolate(reason.title)}</h3>`);
        if (reason.key === "stack") {
          _push(`<div class="reason__diagram stack-diagram" aria-label="CMake, compilers, and your libraries work with Vix.cpp" data-v-1d8e2d6f><span data-v-1d8e2d6f>CMake</span><span data-v-1d8e2d6f>GCC / Clang</span><span data-v-1d8e2d6f>your libraries</span><div class="stack-diagram__links" aria-hidden="true" data-v-1d8e2d6f><i data-v-1d8e2d6f></i><i data-v-1d8e2d6f></i><i data-v-1d8e2d6f></i></div><strong data-v-1d8e2d6f>works with<br data-v-1d8e2d6f>Vix.cpp</strong></div>`);
        } else if (reason.key === "lifecycle") {
          _push(`<div class="reason__diagram lifecycle-diagram" aria-label="Vix.cpp connects build, run, test, deploy, and inspect" data-v-1d8e2d6f><span data-v-1d8e2d6f>build</span><i data-v-1d8e2d6f>→</i><span data-v-1d8e2d6f>run</span><i data-v-1d8e2d6f>→</i><span data-v-1d8e2d6f>test</span><i data-v-1d8e2d6f>→</i><span data-v-1d8e2d6f>deploy</span><i data-v-1d8e2d6f>→</i><span data-v-1d8e2d6f>inspect</span><strong data-v-1d8e2d6f>Vix.cpp</strong></div>`);
        } else {
          _push(`<div class="reason__diagram diagnostic-diagram" aria-label="Vix.cpp connects lifecycle signals to a cause, location, and hint" data-v-1d8e2d6f><div class="diagnostic-diagram__sources" data-v-1d8e2d6f><span data-v-1d8e2d6f>compiler</span><span data-v-1d8e2d6f>runtime</span><span data-v-1d8e2d6f>dependencies</span><span data-v-1d8e2d6f>build</span><span data-v-1d8e2d6f>production</span></div><div class="diagnostic-diagram__vix" data-v-1d8e2d6f>Vix.cpp</div><div class="diagnostic-diagram__outcomes" data-v-1d8e2d6f><span data-v-1d8e2d6f>cause</span><span data-v-1d8e2d6f>location</span><span data-v-1d8e2d6f>hint</span></div></div>`);
        }
        _push(`<p data-v-1d8e2d6f>${ssrInterpolate(reason.description)}</p></article>`);
      });
      _push(`<!--]--></div></div></section>`);
    };
  }
};
const _sfc_setup$f = _sfc_main$f.setup;
_sfc_main$f.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/home/WhyVixSection.vue");
  return _sfc_setup$f ? _sfc_setup$f(props, ctx) : void 0;
};
const WhyVixSection = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["__scopeId", "data-v-1d8e2d6f"]]);
const buildWithVix = {
  id: "build",
  title: "Build it in Vix.cpp",
  description: "Vix.cpp focuses on two areas where it is designed to provide a clear development experience from the first lines of code to a complete project.",
  domains: [
    {
      key: "web-network",
      title: "Web & Networked Applications",
      description: "Build connected applications in C++ with a development workflow that remains clear as the project grows and reaches production.",
      action: {
        label: "Building Applications",
        href: "https://docs.vixcpp.com"
      }
    },
    {
      key: "developer-tools",
      title: "Developer Tools",
      description: "Build tools in C++ without making project setup, dependencies, testing, and distribution the hardest part of the work.",
      action: {
        label: "Building Tools",
        href: "https://docs.vixcpp.com"
      }
    }
  ]
};
const _sfc_main$e = {
  __name: "BuildWithVixSection",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({
        id: unref(buildWithVix).id,
        class: "build"
      }, _attrs))} data-v-edf0deb5><div class="container" data-v-edf0deb5><header class="build__header" data-v-edf0deb5><h2 class="build__title" data-v-edf0deb5>${ssrInterpolate(unref(buildWithVix).title)}</h2><p class="build__description" data-v-edf0deb5>${ssrInterpolate(unref(buildWithVix).description)}</p></header><div class="build__domains" data-v-edf0deb5><!--[-->`);
      ssrRenderList(unref(buildWithVix).domains, (domain) => {
        _push(`<article class="domain" data-v-edf0deb5><div class="domain__visual" data-v-edf0deb5>`);
        if (domain.key === "web-network") {
          _push(`<svg class="domain__svg domain__svg--network" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-v-edf0deb5><path d="M80 26
                   C56 26 38 44 38 66
                   C38 84 49 98 65 103" class="svg-line svg-line--muted" data-v-edf0deb5></path><path d="M95 103
                   C111 98 122 84 122 66
                   C122 44 104 26 80 26" class="svg-line svg-line--muted" data-v-edf0deb5></path><path d="M48 72
                   C37 72 29 64 29 53
                   C29 43 36 35 46 34
                   C50 22 61 15 74 17
                   C83 18 90 23 94 31
                   C98 29 102 28 107 28
                   C120 28 130 39 130 52
                   C130 64 121 72 109 72" class="svg-line" data-v-edf0deb5></path><path d="M55 72V100" class="svg-line" data-v-edf0deb5></path><path d="M80 72V116" class="svg-line" data-v-edf0deb5></path><path d="M105 72V100" class="svg-line" data-v-edf0deb5></path><path d="M55 88H80" class="svg-line svg-line--muted" data-v-edf0deb5></path><path d="M80 88H105" class="svg-line svg-line--muted" data-v-edf0deb5></path><circle cx="55" cy="108" r="8" class="svg-node" data-v-edf0deb5></circle><circle cx="80" cy="124" r="8" class="svg-node svg-node--primary" data-v-edf0deb5></circle><circle cx="105" cy="108" r="8" class="svg-node" data-v-edf0deb5></circle><circle cx="55" cy="88" r="3" class="svg-packet" data-v-edf0deb5></circle><circle cx="80" cy="88" r="3" class="svg-packet" data-v-edf0deb5></circle><circle cx="105" cy="88" r="3" class="svg-packet" data-v-edf0deb5></circle></svg>`);
        } else {
          _push(`<svg class="domain__svg domain__svg--tools" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-v-edf0deb5><rect x="25" y="29" width="110" height="82" rx="9" class="svg-line" data-v-edf0deb5></rect><path d="M25 48H135" class="svg-line svg-line--muted" data-v-edf0deb5></path><circle cx="38" cy="39" r="3" class="svg-dot" data-v-edf0deb5></circle><circle cx="48" cy="39" r="3" class="svg-dot svg-dot--soft" data-v-edf0deb5></circle><circle cx="58" cy="39" r="3" class="svg-dot svg-dot--soft" data-v-edf0deb5></circle><path d="M43 67L53 77L43 87" class="svg-line" data-v-edf0deb5></path><path d="M61 88H86" class="svg-line" data-v-edf0deb5></path><path d="M96 67H117" class="svg-line svg-line--muted" data-v-edf0deb5></path><path d="M96 78H124" class="svg-line svg-line--muted" data-v-edf0deb5></path><path d="M96 89H112" class="svg-line svg-line--muted" data-v-edf0deb5></path><path d="M50 111V125" class="svg-line" data-v-edf0deb5></path><path d="M110 111V125" class="svg-line" data-v-edf0deb5></path><path d="M50 125H110" class="svg-line" data-v-edf0deb5></path><rect x="68" y="117" width="24" height="24" rx="5" class="svg-node-box" data-v-edf0deb5></rect><path d="M76 125H84" class="svg-line" data-v-edf0deb5></path><path d="M80 121V129" class="svg-line" data-v-edf0deb5></path><circle cx="50" cy="125" r="5" class="svg-node" data-v-edf0deb5></circle><circle cx="110" cy="125" r="5" class="svg-node" data-v-edf0deb5></circle></svg>`);
        }
        _push(`</div><div class="domain__content" data-v-edf0deb5><h3 class="domain__title" data-v-edf0deb5>${ssrInterpolate(domain.title)}</h3><p class="domain__description" data-v-edf0deb5>${ssrInterpolate(domain.description)}</p></div><a class="domain__action"${ssrRenderAttr("href", domain.action.href)} target="_blank" rel="noreferrer" data-v-edf0deb5>${ssrInterpolate(domain.action.label)} <span aria-hidden="true" data-v-edf0deb5> → </span></a></article>`);
      });
      _push(`<!--]--></div></div></section>`);
    };
  }
};
const _sfc_setup$e = _sfc_main$e.setup;
_sfc_main$e.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/home/BuildWithVixSection.vue");
  return _sfc_setup$e ? _sfc_setup$e(props, ctx) : void 0;
};
const BuildWithVixSection = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["__scopeId", "data-v-edf0deb5"]]);
const production = {
  id: "production",
  title: "Vix.cpp in production",
  description: "Vix.cpp is built for real C++ applications that move beyond development and need to keep running. Its production experience is shaped by real-world use, continuous validation, and the problems that appear when software is deployed and operated over time."
};
const _sfc_main$d = {
  __name: "ProductionSection",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({
        id: unref(production).id,
        class: "production"
      }, _attrs))} data-v-993ca215><div class="container" data-v-993ca215><div class="production__content" data-v-993ca215><h2 class="production__title" data-v-993ca215>${ssrInterpolate(unref(production).title)}</h2><p class="production__description" data-v-993ca215>${ssrInterpolate(unref(production).description)}</p></div></div></section>`);
    };
  }
};
const _sfc_setup$d = _sfc_main$d.setup;
_sfc_main$d.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/home/ProductionSection.vue");
  return _sfc_setup$d ? _sfc_setup$d(props, ctx) : void 0;
};
const ProductionSection = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["__scopeId", "data-v-993ca215"]]);
const _sfc_main$c = {};
function _sfc_ssrRender$4(_ctx, _push, _parent, _attrs) {
  const _component_RouterLink = resolveComponent("RouterLink");
  _push(`<section${ssrRenderAttrs(mergeProps({ class: "latest" }, _attrs))} data-v-d507dded><div class="latest__inner" data-v-d507dded><div class="latest__heading sd-reveal" data-v-d507dded><span class="latest__label" data-v-d507dded>Latest release</span><h2 data-v-d507dded>Vix.cpp v2.9.0</h2><p class="latest__statement" data-v-d507dded>A release about ownership.</p></div><div class="latest__content sd-reveal" data-v-d507dded><p class="latest__summary" data-v-d507dded> Vix.cpp v2.9.0 clarifies responsibility across the build system, networking, SDK packaging, and mobile platform support. </p><div class="latest__areas" aria-label="Vix.cpp v2.9.0 highlights" data-v-d507dded><div class="latest__area" data-v-d507dded><span data-v-d507dded>Build</span><p data-v-d507dded> Vix focuses on project intent while CMake and Ninja own the concrete compilation graph. </p></div><div class="latest__area" data-v-d507dded><span data-v-d507dded>Requests</span><p data-v-d507dded> The asynchronous HTTP path now remains asynchronous throughout the operation. </p></div><div class="latest__area" data-v-d507dded><span data-v-d507dded>SDKs</span><p data-v-d507dded> SDKs own more of their internal dependencies and expose a cleaner consumer contract. </p></div><div class="latest__area" data-v-d507dded><span data-v-d507dded>Mobile</span><p data-v-d507dded> Android and iOS support works with their native Gradle and Xcode toolchains. </p></div></div><div class="latest__links" data-v-d507dded>`);
  _push(ssrRenderComponent(_component_RouterLink, {
    class: "latest__primary-link",
    to: "/blog/changelog/v2.9.0"
  }, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(` Read the release notes <span aria-hidden="true" data-v-d507dded${_scopeId}>→</span>`);
      } else {
        return [
          createTextVNode(" Read the release notes "),
          createVNode("span", { "aria-hidden": "true" }, "→")
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(ssrRenderComponent(_component_RouterLink, {
    class: "latest__secondary-link",
    to: "/blog"
  }, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(` View all posts `);
      } else {
        return [
          createTextVNode(" View all posts ")
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(`</div></div></div></section>`);
}
const _sfc_setup$c = _sfc_main$c.setup;
_sfc_main$c.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/home/LatestSection.vue");
  return _sfc_setup$c ? _sfc_setup$c(props, ctx) : void 0;
};
const LatestSection = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["ssrRender", _sfc_ssrRender$4], ["__scopeId", "data-v-d507dded"]]);
const community = {
  id: "community",
  title: "Community",
  heading: "Meet the Vix.cpp community.",
  description: "Meet people using and exploring Vix.cpp, ask questions, share what you build, and exchange ideas around C++ development.",
  action: {
    label: "Explore the Community",
    href: "/community"
  }
};
const _sfc_main$b = {};
function _sfc_ssrRender$3(_ctx, _push, _parent, _attrs) {
  _push(`<svg${ssrRenderAttrs(mergeProps({
    class: "community-illustration",
    viewBox: "0 0 520 360",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": "true"
  }, _attrs))} data-v-8dd0c6c4><path d="M260 67V293" class="community-line community-line--ghost" data-v-8dd0c6c4></path><path d="M118 180H402" class="community-line community-line--ghost" data-v-8dd0c6c4></path><path d="M260 180
         C220 180 213 121 175 109" class="community-line" data-v-8dd0c6c4></path><path d="M260 180
         C300 180 307 121 345 109" class="community-line" data-v-8dd0c6c4></path><path d="M260 180
         C215 180 204 236 161 251" class="community-line" data-v-8dd0c6c4></path><path d="M260 180
         C305 180 316 236 359 251" class="community-line" data-v-8dd0c6c4></path><path d="M260 180V82" class="community-line" data-v-8dd0c6c4></path><path d="M260 180V278" class="community-line" data-v-8dd0c6c4></path><circle cx="260" cy="180" r="7" class="community-joint community-joint--main" data-v-8dd0c6c4></circle><circle cx="175" cy="109" r="4" class="community-joint" data-v-8dd0c6c4></circle><circle cx="345" cy="109" r="4" class="community-joint" data-v-8dd0c6c4></circle><circle cx="161" cy="251" r="4" class="community-joint" data-v-8dd0c6c4></circle><circle cx="359" cy="251" r="4" class="community-joint" data-v-8dd0c6c4></circle><rect x="207" y="145" width="106" height="70" rx="8" class="community-core" data-v-8dd0c6c4></rect><path d="M207 166H313" class="community-core-divider" data-v-8dd0c6c4></path><circle cx="220" cy="156" r="3" class="community-window-dot" data-v-8dd0c6c4></circle><circle cx="230" cy="156" r="3" class="community-window-dot community-window-dot--soft" data-v-8dd0c6c4></circle><circle cx="240" cy="156" r="3" class="community-window-dot community-window-dot--soft" data-v-8dd0c6c4></circle><text x="260" y="190" text-anchor="middle" class="community-core-title" data-v-8dd0c6c4> Vix.cpp </text><g class="community-person" data-v-8dd0c6c4><circle cx="154" cy="86" r="13" class="community-head" data-v-8dd0c6c4></circle><path d="M132 120
           C136 103 145 97 154 97
           C163 97 172 103 176 120" class="community-body" data-v-8dd0c6c4></path><rect x="121" y="120" width="67" height="34" rx="5" class="community-terminal" data-v-8dd0c6c4></rect><path d="M133 132L139 138L133 144" class="community-terminal-line" data-v-8dd0c6c4></path><path d="M145 144H164" class="community-terminal-line" data-v-8dd0c6c4></path></g><g class="community-person" data-v-8dd0c6c4><circle cx="366" cy="86" r="13" class="community-head" data-v-8dd0c6c4></circle><path d="M344 120
           C348 103 357 97 366 97
           C375 97 384 103 388 120" class="community-body" data-v-8dd0c6c4></path><rect x="333" y="120" width="67" height="34" rx="5" class="community-terminal" data-v-8dd0c6c4></rect><path d="M345 132L351 138L345 144" class="community-terminal-line" data-v-8dd0c6c4></path><path d="M357 144H376" class="community-terminal-line" data-v-8dd0c6c4></path></g><g class="community-person" data-v-8dd0c6c4><circle cx="141" cy="272" r="13" class="community-head" data-v-8dd0c6c4></circle><path d="M119 306
           C123 289 132 283 141 283
           C150 283 159 289 163 306" class="community-body" data-v-8dd0c6c4></path><path d="M171 280H192" class="community-small-code" data-v-8dd0c6c4></path><path d="M171 290H184" class="community-small-code community-small-code--soft" data-v-8dd0c6c4></path><path d="M171 300H196" class="community-small-code community-small-code--soft" data-v-8dd0c6c4></path></g><g class="community-person" data-v-8dd0c6c4><circle cx="379" cy="272" r="13" class="community-head" data-v-8dd0c6c4></circle><path d="M357 306
           C361 289 370 283 379 283
           C388 283 397 289 401 306" class="community-body" data-v-8dd0c6c4></path><path d="M326 280H347" class="community-small-code" data-v-8dd0c6c4></path><path d="M334 290H347" class="community-small-code community-small-code--soft" data-v-8dd0c6c4></path><path d="M322 300H347" class="community-small-code community-small-code--soft" data-v-8dd0c6c4></path></g><g data-v-8dd0c6c4><circle cx="260" cy="66" r="18" class="community-open-node" data-v-8dd0c6c4></circle><path d="M252 66L257 71L268 60" class="community-check" data-v-8dd0c6c4></path></g><g data-v-8dd0c6c4><circle cx="260" cy="294" r="18" class="community-open-node" data-v-8dd0c6c4></circle><path d="M251 294H269" class="community-terminal-line" data-v-8dd0c6c4></path><path d="M260 285V303" class="community-terminal-line" data-v-8dd0c6c4></path></g></svg>`);
}
const _sfc_setup$b = _sfc_main$b.setup;
_sfc_main$b.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/community/CommunityIllustration.vue");
  return _sfc_setup$b ? _sfc_setup$b(props, ctx) : void 0;
};
const CommunityIllustration = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["ssrRender", _sfc_ssrRender$3], ["__scopeId", "data-v-8dd0c6c4"]]);
const _sfc_main$a = {
  __name: "CommunitySection",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({
        id: unref(community).id,
        class: "community"
      }, _attrs))} data-v-3cbb8eec><div class="container" data-v-3cbb8eec><h2 class="community__title" data-v-3cbb8eec>${ssrInterpolate(unref(community).title)}</h2><div class="community__layout" data-v-3cbb8eec><div class="community__visual" data-v-3cbb8eec>`);
      _push(ssrRenderComponent(CommunityIllustration, null, null, _parent));
      _push(`</div><div class="community__content" data-v-3cbb8eec><h3 data-v-3cbb8eec>${ssrInterpolate(unref(community).heading)}</h3><p data-v-3cbb8eec>${ssrInterpolate(unref(community).description)}</p><a class="community__action"${ssrRenderAttr("href", unref(community).action.href)} data-v-3cbb8eec>${ssrInterpolate(unref(community).action.label)} <span aria-hidden="true" data-v-3cbb8eec>→</span></a></div></div></div></section>`);
    };
  }
};
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/home/CommunitySection.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const CommunitySection = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["__scopeId", "data-v-3cbb8eec"]]);
const softadastra = {
  id: "softadastra",
  name: "Softadastra",
  logo: "/assets/logo/softadastra.svg",
  title: "Vix.cpp is maintained by Softadastra.",
  description: "Softadastra is the organization responsible for the long-term development and stewardship of Vix.cpp. It supports the project's engineering, infrastructure, and direction while Vix.cpp remains open source.",
  action: {
    label: "Learn about Softadastra",
    href: "https://softadastra.com"
  }
};
const _sfc_main$9 = {
  __name: "SoftadastraSection",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({
        id: unref(softadastra).id,
        class: "softadastra"
      }, _attrs))} data-v-f11208df><div class="container" data-v-f11208df><div class="softadastra__content" data-v-f11208df><div class="softadastra__brand" data-v-f11208df><img class="softadastra__logo"${ssrRenderAttr("src", unref(softadastra).logo)}${ssrRenderAttr("alt", `${unref(softadastra).name} logo`)} data-v-f11208df><span data-v-f11208df>${ssrInterpolate(unref(softadastra).name)}</span></div><div class="softadastra__copy" data-v-f11208df><h2 data-v-f11208df>${ssrInterpolate(unref(softadastra).title)}</h2><p data-v-f11208df>${ssrInterpolate(unref(softadastra).description)}</p><a class="softadastra__action"${ssrRenderAttr("href", unref(softadastra).action.href)} target="_blank" rel="noreferrer" data-v-f11208df>${ssrInterpolate(unref(softadastra).action.label)} <span aria-hidden="true" data-v-f11208df>→</span></a></div></div></div></section>`);
    };
  }
};
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/home/SoftadastraSection.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const SoftadastraSection = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["__scopeId", "data-v-f11208df"]]);
const sponsors = {
  id: "sponsors",
  title: "Sponsors",
  heading: "Help build a better C++ development experience.",
  description: "Vix.cpp is open source and developed continuously. If Vix.cpp helps your work, or you want better C++ tooling to exist, sponsorship gives Softadastra more time and resources to improve, test, maintain, and support the project for everyone.",
  action: {
    label: "Sponsor Vix.cpp",
    href: "mailto:softadastra@gmail.com?subject=Vix.cpp%20Sponsorship"
  },
  note: "Individuals and organizations can sponsor Vix.cpp. Sponsors can also be recognized here.",
  foundingSponsor: {
    name: "Softadastra",
    label: "Founding Sponsor",
    logo: "/assets/logo/softadastra.svg",
    href: "https://softadastra.com",
    description: "Founding sponsor and long-term steward of Vix.cpp."
  },
  sponsors: []
};
const _sfc_main$8 = {
  __name: "SponsorsSection",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<section${ssrRenderAttrs(mergeProps({
        id: unref(sponsors).id,
        class: "sponsors"
      }, _attrs))} data-v-574cf23a><div class="container" data-v-574cf23a><header class="sponsors__header" data-v-574cf23a><h2 class="sponsors__title" data-v-574cf23a>${ssrInterpolate(unref(sponsors).title)}</h2><div class="sponsors__intro" data-v-574cf23a><div class="sponsors__copy" data-v-574cf23a><h3 class="sponsors__heading" data-v-574cf23a>${ssrInterpolate(unref(sponsors).heading)}</h3><p class="sponsors__description" data-v-574cf23a>${ssrInterpolate(unref(sponsors).description)}</p></div><div class="sponsors__support" data-v-574cf23a><a class="sponsors__action"${ssrRenderAttr("href", unref(sponsors).action.href)} data-v-574cf23a>${ssrInterpolate(unref(sponsors).action.label)} <span aria-hidden="true" data-v-574cf23a>→</span></a><p class="sponsors__note" data-v-574cf23a>${ssrInterpolate(unref(sponsors).note)}</p></div></div></header><div class="sponsors__group" data-v-574cf23a><div class="sponsors__group-heading" data-v-574cf23a><span data-v-574cf23a>${ssrInterpolate(unref(sponsors).foundingSponsor.label)}</span><div class="sponsors__group-line" data-v-574cf23a></div></div><a class="founding-sponsor"${ssrRenderAttr("href", unref(sponsors).foundingSponsor.href)} target="_blank" rel="noreferrer" data-v-574cf23a><div class="founding-sponsor__brand" data-v-574cf23a><img${ssrRenderAttr("src", unref(sponsors).foundingSponsor.logo)}${ssrRenderAttr("alt", `${unref(sponsors).foundingSponsor.name} logo`)} data-v-574cf23a></div><div class="founding-sponsor__content" data-v-574cf23a><span class="founding-sponsor__label" data-v-574cf23a> Founding Sponsor </span><strong data-v-574cf23a>${ssrInterpolate(unref(sponsors).foundingSponsor.name)}</strong><p data-v-574cf23a>${ssrInterpolate(unref(sponsors).foundingSponsor.description)}</p></div><span class="founding-sponsor__external" aria-hidden="true" data-v-574cf23a> ↗ </span></a></div>`);
      if (unref(sponsors).sponsors.length) {
        _push(`<div class="sponsors__group sponsors__group--regular" data-v-574cf23a><div class="sponsors__group-heading" data-v-574cf23a><span data-v-574cf23a>Sponsors</span><div class="sponsors__group-line" data-v-574cf23a></div></div><div class="sponsors__grid" data-v-574cf23a><!--[-->`);
        ssrRenderList(unref(sponsors).sponsors, (sponsor) => {
          _push(`<a class="sponsor-card"${ssrRenderAttr("href", sponsor.href)} target="_blank" rel="noreferrer" data-v-574cf23a><img${ssrRenderAttr("src", sponsor.logo)}${ssrRenderAttr("alt", `${sponsor.name} logo`)} data-v-574cf23a><span data-v-574cf23a>${ssrInterpolate(sponsor.name)}</span></a>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></section>`);
    };
  }
};
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/home/SponsorsSection.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const SponsorsSection = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["__scopeId", "data-v-574cf23a"]]);
const getStarted = {
  id: "get-started",
  title: "Get started with Vix.cpp",
  description: "Start with a single C++ file or use Vix.cpp with an existing project.",
  primaryAction: {
    label: "Get Started",
    to: "/learn"
  },
  secondaryAction: {
    label: "Documentation",
    href: "https://docs.vixcpp.com"
  }
};
const _sfc_main$7 = {
  __name: "GetStartedSection",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_RouterLink = resolveComponent("RouterLink");
      _push(`<section${ssrRenderAttrs(mergeProps({
        id: unref(getStarted).id,
        class: "get-started"
      }, _attrs))} data-v-7617dbf0><div class="container" data-v-7617dbf0><div class="get-started__content" data-v-7617dbf0><h2 class="get-started__title" data-v-7617dbf0>${ssrInterpolate(unref(getStarted).title)}</h2><p class="get-started__description" data-v-7617dbf0>${ssrInterpolate(unref(getStarted).description)}</p><div class="get-started__actions" data-v-7617dbf0>`);
      _push(ssrRenderComponent(_component_RouterLink, {
        class: "get-started__action get-started__action--primary",
        to: unref(getStarted).primaryAction.to
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${ssrInterpolate(unref(getStarted).primaryAction.label)} <span aria-hidden="true" data-v-7617dbf0${_scopeId}> → </span>`);
          } else {
            return [
              createTextVNode(toDisplayString(unref(getStarted).primaryAction.label) + " ", 1),
              createVNode("span", { "aria-hidden": "true" }, " → ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<a class="get-started__action"${ssrRenderAttr("href", unref(getStarted).secondaryAction.href)} target="_blank" rel="noreferrer" data-v-7617dbf0>${ssrInterpolate(unref(getStarted).secondaryAction.label)} <span aria-hidden="true" data-v-7617dbf0> ↗ </span></a></div></div></div></section>`);
    };
  }
};
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/home/GetStartedSection.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const GetStartedSection = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["__scopeId", "data-v-7617dbf0"]]);
const _sfc_main$6 = {
  __name: "HomePage",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[-->`);
      _push(ssrRenderComponent(HeroSection, null, null, _parent));
      _push(ssrRenderComponent(WhyVixSection, null, null, _parent));
      _push(ssrRenderComponent(BuildWithVixSection, null, null, _parent));
      _push(ssrRenderComponent(ProductionSection, null, null, _parent));
      _push(ssrRenderComponent(LatestSection, null, null, _parent));
      _push(ssrRenderComponent(CommunitySection, null, null, _parent));
      _push(ssrRenderComponent(SoftadastraSection, null, null, _parent));
      _push(ssrRenderComponent(SponsorsSection, null, null, _parent));
      _push(ssrRenderComponent(GetStartedSection, null, null, _parent));
      _push(`<!--]-->`);
    };
  }
};
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/HomePage.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const _sfc_main$5 = {};
function _sfc_ssrRender$2(_ctx, _push, _parent, _attrs) {
  const _component_RouterLink = resolveComponent("RouterLink");
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "community-page" }, _attrs))} data-v-eaff6409><div class="community-container" data-v-eaff6409>`);
  _push(ssrRenderComponent(_component_RouterLink, {
    class: "community-back",
    to: "/"
  }, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(` ← Back to Home `);
      } else {
        return [
          createTextVNode(" ← Back to Home ")
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(`<header class="community-header" data-v-eaff6409><h1 data-v-eaff6409>Community</h1><p data-v-eaff6409> The Vix.cpp community is open. Anyone can create a space where people using or interested in Vix.cpp can meet, exchange ideas, share projects, and help each other. </p><p data-v-eaff6409> This page lists the community spaces currently known around Vix.cpp. New local, language-specific, or online communities can be added as they appear. </p></header><section class="community-section" data-v-eaff6409><h2 data-v-eaff6409>General discussion</h2><div class="community-entry" data-v-eaff6409><h3 data-v-eaff6409>Discord</h3><h4 data-v-eaff6409>Vix.cpp Community</h4><p data-v-eaff6409> Talk about Vix.cpp, ask questions, share projects, exchange ideas, and meet other people interested in C++ development. </p><a href="https://discord.gg/qmGNmWpeJy" target="_blank" rel="noreferrer" data-v-eaff6409> Join the Discord → </a></div></section><section class="community-section" data-v-eaff6409><h2 data-v-eaff6409>Project stewardship</h2><div class="community-entry" data-v-eaff6409><h3 data-v-eaff6409>Softadastra</h3><p data-v-eaff6409> Vix.cpp is maintained by Softadastra, the organization responsible for its long-term development, infrastructure, and project direction. </p><p data-v-eaff6409> For organizational, partnership, or project-related inquiries, contact Softadastra directly. </p><div class="community-links" data-v-eaff6409><a href="mailto:softadastra@gmail.com" data-v-eaff6409> Email → </a></div></div></section><section class="community-section" data-v-eaff6409><h2 data-v-eaff6409>Creator</h2><div class="community-entry" data-v-eaff6409><h3 data-v-eaff6409>Gaspard Kirira</h3><p data-v-eaff6409>Vix.cpp was created by Gaspard Kirira.</p><p data-v-eaff6409> For personal questions, talks, collaboration, or conversations around Vix.cpp and C++ development, you can reach him directly. </p><div class="community-links" data-v-eaff6409><a href="https://github.com/GaspardKirira/" target="_blank" rel="noreferrer" data-v-eaff6409> GitHub → </a><a href="https://wa.me/256790220177" target="_blank" rel="noreferrer" data-v-eaff6409> WhatsApp → </a><a href="mailto:gaspardkirira9@gmail.com" data-v-eaff6409> Email → </a></div></div></section></div></div>`);
}
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/CommunityPage.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const CommunityPage = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["ssrRender", _sfc_ssrRender$2], ["__scopeId", "data-v-eaff6409"]]);
const _sfc_main$4 = {};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs) {
  const _component_RouterLink = resolveComponent("RouterLink");
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "learn-page" }, _attrs))} data-v-c4f1db98><div class="learn-container" data-v-c4f1db98><header class="learn-header" data-v-c4f1db98><h1 data-v-c4f1db98>Learn Vix.cpp</h1><p data-v-c4f1db98> Learn how Vix.cpp fits into a C++ project, then move from a single source file to a complete application workflow. </p></header><section class="learn-section" data-v-c4f1db98><h2 data-v-c4f1db98>Start here</h2><div class="learn-steps" data-v-c4f1db98><article class="learn-step" data-v-c4f1db98><span class="learn-step__number" data-v-c4f1db98> 01 </span><div class="learn-step__content" data-v-c4f1db98><h3 data-v-c4f1db98>Run C++ with Vix.cpp</h3><p data-v-c4f1db98> Start with a single C++ source file and understand the basic Vix.cpp development workflow. </p></div></article><article class="learn-step" data-v-c4f1db98><span class="learn-step__number" data-v-c4f1db98> 02 </span><div class="learn-step__content" data-v-c4f1db98><h3 data-v-c4f1db98>Work with a project</h3><p data-v-c4f1db98> Use Vix.cpp with a C++ project, its build system, dependencies, tests, and existing libraries. </p></div></article><article class="learn-step" data-v-c4f1db98><span class="learn-step__number" data-v-c4f1db98> 03 </span><div class="learn-step__content" data-v-c4f1db98><h3 data-v-c4f1db98>Build real applications</h3><p data-v-c4f1db98> Follow the application workflow from development and execution through testing and production. </p></div></article></div><a class="learn-link" href="https://docs.vixcpp.com" target="_blank" rel="noreferrer" data-v-c4f1db98> Get started <span aria-hidden="true" data-v-c4f1db98>↗</span></a></section><section class="learn-section" data-v-c4f1db98><h2 data-v-c4f1db98>Continue learning</h2><div class="learn-resources" data-v-c4f1db98><article class="learn-resource" data-v-c4f1db98><div data-v-c4f1db98><h3 data-v-c4f1db98>Documentation</h3><p data-v-c4f1db98> Reference for commands, project configuration, libraries, and the capabilities available in Vix.cpp. </p></div><a href="https://docs.vixcpp.com" target="_blank" rel="noreferrer" data-v-c4f1db98> Read the documentation <span aria-hidden="true" data-v-c4f1db98>↗</span></a></article><article class="learn-resource" data-v-c4f1db98><div data-v-c4f1db98><h3 data-v-c4f1db98>Blog</h3><p data-v-c4f1db98> Technical articles, release notes, development updates, and deeper explanations from the Vix.cpp project. </p></div>`);
  _push(ssrRenderComponent(_component_RouterLink, { to: "/blog" }, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(` Read the blog <span aria-hidden="true" data-v-c4f1db98${_scopeId}>→</span>`);
      } else {
        return [
          createTextVNode(" Read the blog "),
          createVNode("span", { "aria-hidden": "true" }, "→")
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(`</article><article class="learn-resource" data-v-c4f1db98><div data-v-c4f1db98><h3 data-v-c4f1db98>Community</h3><p data-v-c4f1db98> Ask questions, share what you build, exchange ideas, and meet other people interested in Vix.cpp. </p></div>`);
  _push(ssrRenderComponent(_component_RouterLink, { to: "/community" }, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(` Join the community <span aria-hidden="true" data-v-c4f1db98${_scopeId}>→</span>`);
      } else {
        return [
          createTextVNode(" Join the community "),
          createVNode("span", { "aria-hidden": "true" }, "→")
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(`</article></div></section></div></div>`);
}
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/LearnPage.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const LearnPage = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["ssrRender", _sfc_ssrRender$1], ["__scopeId", "data-v-c4f1db98"]]);
const description = "News, release notes, technical deep dives, and development updates from Vix.cpp.";
const _sfc_main$3 = {
  __name: "BlogPage",
  __ssrInlineRender: true,
  setup(__props) {
    const featuredPost = blogPosts[0];
    const latestPosts = blogPosts.slice(1);
    useHead({
      title: "Blog | Vix.cpp",
      meta: [
        {
          name: "description",
          content: description
        },
        {
          property: "og:type",
          content: "website"
        },
        {
          property: "og:site_name",
          content: "Vix.cpp"
        },
        {
          property: "og:title",
          content: "Blog | Vix.cpp"
        },
        {
          property: "og:description",
          content: description
        },
        {
          property: "og:url",
          content: "https://vixcpp.com/blog"
        },
        {
          name: "twitter:card",
          content: "summary"
        },
        {
          name: "twitter:title",
          content: "Blog | Vix.cpp"
        },
        {
          name: "twitter:description",
          content: description
        }
      ],
      link: [
        {
          rel: "canonical",
          href: "https://vixcpp.com/blog"
        }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_RouterLink = resolveComponent("RouterLink");
      _push(`<main${ssrRenderAttrs(mergeProps({ class: "blog-page" }, _attrs))} data-v-9b3a19d6><div class="blog-container" data-v-9b3a19d6><header class="blog-header" data-v-9b3a19d6><p class="blog-eyebrow" data-v-9b3a19d6>Vix.cpp</p><h1 data-v-9b3a19d6>Blog</h1><p class="blog-intro" data-v-9b3a19d6> News, technical deep dives, release notes, and development updates from the Vix.cpp project. </p></header>`);
      if (unref(featuredPost)) {
        _push(`<section class="blog-feature" aria-labelledby="featured-post" data-v-9b3a19d6><p class="section-label" data-v-9b3a19d6>Latest release</p><article class="featured-post" data-v-9b3a19d6><div class="featured-post__content" data-v-9b3a19d6><p class="featured-post__meta" data-v-9b3a19d6><span data-v-9b3a19d6>Release notes</span>`);
        if (unref(featuredPost).date) {
          _push(`<time${ssrRenderAttr("datetime", unref(featuredPost).date)} data-v-9b3a19d6>${ssrInterpolate(unref(featuredPost).date)}</time>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</p><h2 id="featured-post" data-v-9b3a19d6>${ssrInterpolate(unref(featuredPost).title)}</h2><p class="featured-post__theme" data-v-9b3a19d6>A release about ownership.</p><p class="featured-post__summary" data-v-9b3a19d6> Vix.cpp v2.9.0 clarifies responsibility across the build system, networking, SDK packaging, and mobile platform support. </p>`);
        _push(ssrRenderComponent(_component_RouterLink, {
          to: `/blog/${unref(featuredPost).path}`,
          class: "featured-post__link"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Read release notes <span aria-hidden="true" data-v-9b3a19d6${_scopeId}>→</span>`);
            } else {
              return [
                createTextVNode(" Read release notes "),
                createVNode("span", { "aria-hidden": "true" }, "→")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></article></section>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<section class="blog-posts" aria-labelledby="latest-posts" data-v-9b3a19d6><div class="blog-posts__header" data-v-9b3a19d6><h2 id="latest-posts" data-v-9b3a19d6>Latest</h2><span class="blog-posts__count" data-v-9b3a19d6>${ssrInterpolate(unref(latestPosts).length)} ${ssrInterpolate(unref(latestPosts).length === 1 ? "post" : "posts")}</span></div>`);
      if (unref(latestPosts).length) {
        _push(`<div class="blog-list" data-v-9b3a19d6><!--[-->`);
        ssrRenderList(unref(latestPosts), (post) => {
          _push(`<article class="blog-entry" data-v-9b3a19d6>`);
          _push(ssrRenderComponent(_component_RouterLink, {
            to: `/blog/${post.path}`,
            class: "blog-entry__link"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="blog-entry__content" data-v-9b3a19d6${_scopeId}><h3 data-v-9b3a19d6${_scopeId}>${ssrInterpolate(post.title)}</h3>`);
                if (post.description) {
                  _push2(`<p data-v-9b3a19d6${_scopeId}>${ssrInterpolate(post.description)}</p>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><div class="blog-entry__meta" data-v-9b3a19d6${_scopeId}>`);
                if (post.date) {
                  _push2(`<time${ssrRenderAttr("datetime", post.date)} data-v-9b3a19d6${_scopeId}>${ssrInterpolate(post.date)}</time>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<span class="blog-entry__arrow" aria-hidden="true" data-v-9b3a19d6${_scopeId}> → </span></div>`);
              } else {
                return [
                  createVNode("div", { class: "blog-entry__content" }, [
                    createVNode("h3", null, toDisplayString(post.title), 1),
                    post.description ? (openBlock(), createBlock("p", { key: 0 }, toDisplayString(post.description), 1)) : createCommentVNode("", true)
                  ]),
                  createVNode("div", { class: "blog-entry__meta" }, [
                    post.date ? (openBlock(), createBlock("time", {
                      key: 0,
                      datetime: post.date
                    }, toDisplayString(post.date), 9, ["datetime"])) : createCommentVNode("", true),
                    createVNode("span", {
                      class: "blog-entry__arrow",
                      "aria-hidden": "true"
                    }, " → ")
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`</article>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<p class="blog-empty" data-v-9b3a19d6>No other posts have been published yet.</p>`);
      }
      _push(`</section></div></main>`);
    };
  }
};
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/BlogPage.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const BlogPage = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-9b3a19d6"]]);
const _sfc_main$2 = {
  __name: "BlogArticleContent",
  __ssrInlineRender: true,
  props: {
    path: {
      type: String,
      required: true
    }
  },
  async setup(__props) {
    let __temp, __restore;
    const props = __props;
    const html = ([__temp, __restore] = withAsyncContext(() => loadBlogPostHtml(props.path)), __temp = await __temp, __restore(), __temp);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "post-content" }, _attrs))}>${unref(html) ?? ""}</div>`);
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/components/blog/BlogArticleContent.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = {
  __name: "BlogPostPage",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const post = computed(() => findBlogPost(route.params.pathMatch));
    const description2 = computed(
      () => post.value?.description || "Vix.cpp engineering blog."
    );
    const canonical = computed(
      () => post.value ? `https://vixcpp.com/blog/${post.value.path}` : "https://vixcpp.com/blog"
    );
    useHead(() => ({
      title: post.value ? `${post.value.title} | Vix.cpp` : "Article not found | Vix.cpp",
      meta: [
        {
          name: "description",
          content: description2.value
        },
        {
          property: "og:type",
          content: post.value ? "article" : "website"
        },
        {
          property: "og:site_name",
          content: "Vix.cpp"
        },
        {
          property: "og:title",
          content: post.value ? `${post.value.title} | Vix.cpp` : "Article not found | Vix.cpp"
        },
        {
          property: "og:description",
          content: description2.value
        },
        {
          property: "og:url",
          content: canonical.value
        },
        {
          name: "twitter:card",
          content: "summary"
        },
        {
          name: "twitter:title",
          content: post.value ? `${post.value.title} | Vix.cpp` : "Article not found | Vix.cpp"
        },
        {
          name: "twitter:description",
          content: description2.value
        }
      ],
      link: [
        {
          rel: "canonical",
          href: canonical.value
        }
      ]
    }));
    return (_ctx, _push, _parent, _attrs) => {
      const _component_RouterLink = resolveComponent("RouterLink");
      if (post.value) {
        _push(`<section${ssrRenderAttrs(mergeProps({ class: "post-page" }, _attrs))} data-v-c060deb6><article data-v-c060deb6>`);
        _push(ssrRenderComponent(_component_RouterLink, {
          class: "post-back",
          to: "/blog"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` ← Blog `);
            } else {
              return [
                createTextVNode(" ← Blog ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<header data-v-c060deb6><h1 data-v-c060deb6>${ssrInterpolate(post.value.title)}</h1>`);
        if (post.value.date || post.value.author) {
          _push(`<p class="post-meta" data-v-c060deb6>`);
          if (post.value.date) {
            _push(`<span data-v-c060deb6>${ssrInterpolate(post.value.date)}</span>`);
          } else {
            _push(`<!---->`);
          }
          if (post.value.date && post.value.author) {
            _push(`<span data-v-c060deb6> · </span>`);
          } else {
            _push(`<!---->`);
          }
          if (post.value.author) {
            _push(`<span data-v-c060deb6>${ssrInterpolate(post.value.author)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</header>`);
        ssrRenderSuspense(_push, {
          fallback: () => {
            _push(`<div class="post-content" data-v-c060deb6></div>`);
          },
          default: () => {
            _push(ssrRenderComponent(_sfc_main$2, {
              key: post.value.path,
              path: post.value.path
            }, null, _parent));
          },
          _: 1
        });
        _push(`</article></section>`);
      } else {
        _push(`<section${ssrRenderAttrs(mergeProps({ class: "post-page post-page--not-found" }, _attrs))} data-v-c060deb6>`);
        _push(ssrRenderComponent(_component_RouterLink, {
          class: "post-back",
          to: "/blog"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` ← Blog `);
            } else {
              return [
                createTextVNode(" ← Blog ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<h1 data-v-c060deb6>Article not found</h1><p data-v-c060deb6>The article you are looking for does not exist.</p></section>`);
      }
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/BlogPostPage.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const BlogPostPage = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-c060deb6"]]);
const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  const _component_RouterLink = resolveComponent("RouterLink");
  _push(`<section${ssrRenderAttrs(mergeProps({ class: "not-found" }, _attrs))} data-v-bbaf89c8><div class="container" data-v-bbaf89c8><span class="not-found__code" data-v-bbaf89c8> 404 </span><h1 data-v-bbaf89c8>Page not found</h1><p data-v-bbaf89c8>The page you are looking for does not exist.</p>`);
  _push(ssrRenderComponent(_component_RouterLink, {
    class: "not-found__link",
    to: "/"
  }, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(` Back to Vix.cpp → `);
      } else {
        return [
          createTextVNode(" Back to Vix.cpp → ")
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(`</div></section>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/pages/NotFoundPage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const NotFoundPage = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender], ["__scopeId", "data-v-bbaf89c8"]]);
const routes = [
  {
    path: "/",
    name: "home",
    component: _sfc_main$6
  },
  {
    path: "/learn",
    name: "learn",
    component: LearnPage
  },
  {
    path: "/community",
    name: "community",
    component: CommunityPage
  },
  {
    path: "/blog",
    name: "blog",
    component: BlogPage
  },
  {
    path: "/blog/:pathMatch(.*)*",
    name: "blog-post",
    component: BlogPostPage
  },
  {
    path: "/docs/:pathMatch(.*)*",
    name: "docs",
    beforeEnter: (to) => {
      const path = to.params.pathMatch;
      const suffix = Array.isArray(path) ? path.join("/") : path || "";
      window.location.href = `https://docs.vixcpp.com/${suffix}`;
      return false;
    }
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundPage
  }
];
const routerOptions = {
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return {
        el: to.hash,
        behavior: "smooth"
      };
    }
    return {
      top: 0
    };
  }
};
const createApp = ViteSSG(
  App,
  { routes, ...routerOptions, base: "/", format: "directory" },
  ({ router }) => {
    router.options.routes.push(...[]);
  }
);
const includedRoutes = () => [
  "/",
  "/learn",
  "/community",
  "/blog",
  "/docs",
  ...blogPosts.map((post) => `/blog/${post.path}`),
  ...docsPages.filter((page) => page.path).map((page) => `/docs/${page.path}`)
];
export {
  createApp,
  includedRoutes
};
