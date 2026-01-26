<template>
  <div class="wrap">
    <!-- Post not found -->
    <div v-if="!post" class="notfound">
      <h1 class="h1">Post not found</h1>
      <p class="p">
        The requested article does not exist or has been removed.
      </p>

      <div class="row">
        <router-link class="btn" to="/">Home</router-link>
        <router-link class="btn" to="/blog">Blog</router-link>
      </div>
    </div>

    <!-- Post -->
    <article v-else class="post">
      <header class="header">
        <h1 class="h1">{{ post.title }}</h1>
        <p class="meta">
          <span>{{ post.date }}</span>
          <span v-if="post.tag">· {{ post.tag }}</span>
        </p>
        <p class="excerpt" v-if="post.excerpt">
          {{ post.excerpt }}
        </p>
      </header>

      <section class="content">
        <!-- simple markdown-like rendering -->
        <p
          v-for="(block, i) in post.content"
          :key="i"
          class="paragraph"
        >
          {{ block }}
        </p>
      </section>

      <footer class="footer">
        <router-link class="btn" to="/blog">← Back to blog</router-link>
      </footer>
    </article>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const slug = route.params.slug;

const post = ref(null);

onMounted(async () => {
  try {
    const res = await fetch("/posts.json");
    if (!res.ok) {
      post.value = null;
      return;
    }

    const posts = await res.json();
    post.value = posts.find((p) => p.slug === slug) || null;
  } catch (err) {
    post.value = null;
  }
});
</script>


<style scoped>
.wrap {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 18px 70px;
}

.notfound {
  text-align: center;
  padding-top: 40px;
}

.post {}

.header {
  margin-bottom: 28px;
}

.h1 {
  margin: 0;
  font-size: 34px;
  letter-spacing: -0.02em;
}

.meta {
  margin-top: 6px;
  opacity: 0.65;
  font-size: 13px;
}

.excerpt {
  margin-top: 12px;
  font-size: 16px;
  opacity: 0.85;
}

.content {
  margin-top: 28px;
}

.paragraph {
  margin: 0 0 16px;
  line-height: 1.7;
  font-size: 15px;
  opacity: 0.9;
}

.footer {
  margin-top: 40px;
}

.row {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
}

.btn {
  text-decoration: none;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.16);
}
</style>
