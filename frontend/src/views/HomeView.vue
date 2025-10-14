<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AOS from 'aos'
import 'aos/dist/aos.css'

// New Released slider images (use dynamic bindings to avoid build-time imports)
const sliderImages = ref<string[]>([
  '/assets/images/new1.jpg',
  '/assets/images/new2.jpg',
  '/assets/images/new3.jpg',
])
const index = ref(0)
const next = computed(() => (index.value + 1) % sliderImages.value.length)

function prevImage() {
  index.value = (index.value - 2 + sliderImages.value.length) % sliderImages.value.length
}
function nextImage() {
  index.value = (index.value + 2) % sliderImages.value.length
}

const router = useRouter()
function goToSearch() {
  router.push('/products#search-bar')
}

onMounted(() => {
  AOS.init({ duration: 800, once: true })
})
</script>

<template>
  <section class="space-y-12">
    <!-- Hero -->
    <div class="relative grid place-items-center overflow-hidden rounded-2xl bg-slate-900 px-6 py-16 text-white sm:px-12">
      <div class="mx-auto max-w-3xl text-center">
        <h1 class="text-3xl font-bold sm:text-4xl">Streetwear for Everyday</h1>
        <p class="mt-3 text-slate-300">Discover the latest drops, timeless basics, and limited collections.</p>
      </div>
      <img src="/favicon.ico" alt="brand" class="pointer-events-none absolute -right-10 -top-10 h-40 w-40 opacity-20" />
    </div>

    <!-- Quick links -->
    <div class="grid justify-items-center text-center gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink to="/products?category=sneakers" class="group rounded-xl border border-slate-200 p-6 hover:shadow-md">
        <div class="mb-3 flex items-center gap-3">
          <div class="rounded bg-emerald-100 p-2 text-emerald-700">👟</div>
          <h3 class="font-semibold">Sneakers</h3>
        </div>
        <p class="text-sm text-slate-600">Classic silhouettes and latest collabs.</p>
      </RouterLink>
      <RouterLink to="/products?category=hoodies" class="group rounded-xl border border-slate-200 p-6 hover:shadow-md">
        <div class="mb-3 flex items-center gap-3">
          <div class="rounded bg-emerald-100 p-2 text-emerald-700">🧥</div>
          <h3 class="font-semibold">Hoodies</h3>
        </div>
        <p class="text-sm text-slate-600">Layers for everyday comfort.</p>
      </RouterLink>
      <RouterLink to="/products?category=accessories" class="group rounded-xl border border-slate-200 p-6 hover:shadow-md">
        <div class="mb-3 flex items-center gap-3">
          <div class="rounded bg-emerald-100 p-2 text-emerald-700">🧢</div>
          <h3 class="font-semibold">Accessories</h3>
        </div>
        <p class="text-sm text-slate-600">Caps, socks, and daily essentials.</p>
      </RouterLink>
    </div>

    <!-- New released section (EJS-like structure) -->
    <section>
      <div class="new-release-container">
        <!-- Left Side: Categories, Search, Title & Button -->
        <div class="left-block" data-aos="fade-right">
          <ul class="category-list">
            <li><RouterLink to="/products?category=Men">MEN</RouterLink></li>
            <li><RouterLink to="/products?category=Women">WOMEN</RouterLink></li>
            <li><RouterLink to="/products?category=Kids">KIDS</RouterLink></li>
          </ul>

          <div class="col-md-8">
            <div class="input-group rounded">
              <input id="search-bar-home" type="text" class="form-control border-0" placeholder="🔍 Search" style="padding: 10px 15px; border-radius: 5px;" @focus="goToSearch" @click="goToSearch" />
            </div>
          </div>

          <h1 class="release-title">NEW <br /> RELEASED</h1>
          <p class="season">Winter 2024</p>

          <RouterLink to="/products" class="btn-shop">
            Go To Shop <span class="arrow">→</span>
          </RouterLink>

          <div class="image-nav">
            <button @click="prevImage" class="nav-btn">◀</button>
            <button @click="nextImage" class="nav-btn">▶</button>
          </div>
        </div>

        <!-- Center: Active Product Image -->
        <div class="center-block" data-aos="zoom-in">
          <RouterLink to="/new">
            <img :src="sliderImages[index]" id="image1" alt="New release" />
          </RouterLink>
        </div>

        <!-- Right Side: Next Product Image -->
        <div class="right-block" data-aos="zoom-in" data-aos-delay="150">
          <RouterLink to="/new">
            <img :src="sliderImages[next]" id="image2" alt="Next release" />
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- All Collection Section -->
    <section class="all-collection" data-aos="fade-up">
      <h1 class="collection-title" data-aos="fade-up">ALL COLLECTION</h1>
      
      <div class="category-tabs" data-aos="fade-up">
        <RouterLink to="/products" class="all-tabs">(ALL)</RouterLink>
        <RouterLink to="/products?category=Men" class="men-tabs">Men</RouterLink>
        <RouterLink to="/products?category=Women" class="women-tabs">Women</RouterLink>
        <RouterLink to="/products?category=Kids" class="kids-tabs">Kids</RouterLink>
      </div>

      <div class="collection-grid">
        <div class="collection-item" data-aos="fade-up" data-aos-delay="100">
          <RouterLink to="/products/6">
            <img src="/assets/images/product1.jpg" alt="Chrome Hearts T-Shirt" />
          </RouterLink>
          <h3>Chrome Hearts Men's Round Neck Cotton Casual</h3>
          <p>$117</p>
        </div>

        <div class="collection-item" data-aos="fade-up" data-aos-delay="200">
          <RouterLink to="/products/7">
            <img src="/assets/images/product2.jpg" alt="Drew House Hoodie" />
          </RouterLink>
          <h3>Jual Drew House Mascot Blue Hoodie</h3>
          <p>$329</p>
        </div>

        <div class="collection-item" data-aos="fade-up" data-aos-delay="300">
          <RouterLink to="/products/8">
            <img src="/assets/images/product3.jpg" alt="Young Thug Hoodie" />
          </RouterLink>
          <h3>Young Thug Sp5der Vintage Pullover Hoodie</h3>
          <p>$220</p>
        </div>
      </div>

      <div class="more-container" data-aos="fade-up" data-aos-delay="400">
        <RouterLink to="/products" class="more-btn">More ▼</RouterLink>
      </div>
    </section>

    <!-- Approach Section / Products Display -->
    <section class="approach-section">
      <h1 class="approach-title" data-aos="fade-up">OUR APPROACH TO SELLING PRODUCTS</h1>
      <p class="approach-description" data-aos="fade-up" data-aos-delay="200">
        Our shop imports clothing from many top fashion brands such as Stussy, Amiri, SP5DER, and more. 
        We sell to those who missed out on the original sales at affordable prices.
      </p>

      <!-- Products Display -->
      <div class="approach-grid">
        <div class="approach-item" data-aos="zoom-in">
          <RouterLink to="/products?q=Vlone#search-bar"><img src="/assets/images/approach1.png" alt="Vlone" /></RouterLink>
        </div>
        <div class="approach-item" data-aos="zoom-in" data-aos-delay="200">
          <RouterLink to="/products?q=Stussy#search-bar"><img src="/assets/images/approach2.jpg" alt="Stussy" /></RouterLink>
        </div>
        <div class="approach-item" data-aos="zoom-in" data-aos-delay="400">
          <RouterLink to="/products?q=Chrome%20Hearts#search-bar"><img src="/assets/images/approach3.jpg" alt="Chrome Hearts" /></RouterLink>
        </div>
        <div class="approach-item" data-aos="zoom-in" data-aos-delay="600">
          <RouterLink to="/products?q=Amiri#search-bar"><img src="/assets/images/approach4.jpg" alt="Amiri" /></RouterLink>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="custom-footer" data-aos="fade-up" data-aos-offset="50">
      <p>© 2025 CJ Streetwear. All rights reserved. <a href="/about">About</a> · <a href="/products">Shop</a> · <a href="/profile">Profile</a></p>
    </footer>
    
  </section>
</template>

<style scoped>
/* New Released Section */
.new-release-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 30px;
  align-items: center;
  max-width: 90%;
  margin: auto;
  padding: 40px 0;
  background: #f8f8f8;
  position: relative;
}

.left-block {
  width: 100%;
  text-align: left;
  padding-right: 20px;
}

.category-list {
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
}
.category-list li { margin-bottom: 8px; font-size: 16px; font-weight: bold; }
.category-list li a { text-decoration: none; color: black; transition: color 0.3s ease; }
.category-list li a:hover { color: #666; }

/* Search bar (Bootstrap-free) */
.input-group { display: flex; align-items: center; background: #e0e0e0; padding: 8px 10px; margin: 15px 0; width: 80%; border-radius: 5px; }
.form-control { border: none; background: none; outline: none; flex-grow: 1; font-size: 14px; }

.release-title { font-size: 40px; font-weight: bold; margin: 20px 0 10px 0; line-height: 1.2; position: relative; z-index: 1; }
.season { font-size: 14px; font-weight: bold; margin-bottom: 20px; }

.btn-shop { display: flex; align-items: center; background: black; color: white; padding: 10px 15px; text-decoration: none; font-size: 16px; font-weight: bold; margin-top: 20px; width: 180px; justify-content: space-between; border-radius: 5px; transition: background-color 0.3s ease; }
.btn-shop:hover { background-color: #333; }
.btn-shop .arrow { font-size: 18px; }

.image-nav { display: flex; margin-top: 20px; gap: 10px; }
.nav-btn { background: none; border: 2px solid black; padding: 8px 12px; cursor: pointer; font-size: 16px; color: black; transition: all 0.3s ease; }
.nav-btn:hover { background: black; color: white; }

.center-block,
.right-block {
  width: 100%;
  position: relative;
  z-index: 0;
  height: 500px;
  overflow: hidden;
}
.center-block img,
.right-block img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 5px;
  transition: transform 0.3s ease;
}
.center-block img:hover,
.right-block img:hover { transform: scale(1.05); transition: 0.5s; }

@media (max-width: 992px) {
  .new-release-container { grid-template-columns: 1fr; }
  .left-block { padding-right: 0; }
  .input-group { width: 100%; }
  .center-block, .right-block { height: 360px; }
}

/* All Collection Section */
.all-collection { text-align: center; margin: 50px 0; }
.collection-title { font-size: 32px; font-weight: bold; margin-bottom: 20px; }
.category-tabs { display: flex; justify-content: center; gap: 20px; font-size: 18px; margin-bottom: 30px; flex-wrap: wrap; }
.category-tabs a { text-decoration: none; color: black; font-weight: bold; padding: 5px 10px; }
.collection-grid { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }
.collection-item { width: 350px; text-align: left; }
.collection-item img { width: 100%; height: auto; border-radius: 8px; }
.collection-item h3 { font-size: 16px; margin: 10px 0 5px; }
.collection-item p { font-size: 14px; }
.more-container { text-align: center; margin-top: 20px; }
.more-btn { font-size: 18px; font-weight: bold; text-decoration: none; color: black; display: inline-block; padding: 10px 15px; }
.more-btn:hover { transform: scale(1.05); }

/* Approach Section */
.approach-section { padding: 40px 0; text-align: center; }
.approach-title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
.approach-description { color: #555; font-size: 16px; max-width: 800px; margin: 0 auto 20px; }
.approach-grid { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }
.approach-item { width: 280px; }
.approach-item img { width: 100%; height: 280px; object-fit: cover; border-radius: 8px; transition: transform 0.5s; }
.approach-item img:hover { transform: scale(1.05); }

@media (max-width: 1024px) { .approach-item { width: 45%; } }
@media (max-width: 640px) { .approach-item { width: 100%; } }

/* Footer */
.custom-footer {
  background: #000; /* solid black */
  color: #fff;
  text-align: center;
  /* full-bleed across viewport to ignore parent paddings */
  width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
  /* inner padding */
  padding: 30px 16px;
  margin-top: 24px;
  /* remove bottom white strip caused by main's py-8 */
  margin-bottom: -2rem;
}
.custom-footer p { color: #ddd; margin: 0; }
.custom-footer a { color: #fff; text-decoration: none; transition: color 0.3s ease; }
.custom-footer a:hover { color: #00ff55; }
</style>
