<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AOS from 'aos'

// Map handling
const mapEl = ref<HTMLDivElement | null>(null)
const useIframe = ref(false)
const iframeSrc = 'https://www.google.com/maps?q=18.8013,98.9525&z=15&output=embed'

onMounted(() => {
  // Init AOS animations
  try { AOS.init({ duration: 800, once: true }) } catch {}

  // Try Google Maps JS API if key is provided; otherwise use iframe
  const key = (import.meta.env as any).VITE_GOOGLE_MAPS_API_KEY
  if (!key) {
    useIframe.value = true
    return
  }
  if (!mapEl.value) return

  // Define callback for Maps API
  ;(window as any).initMap = () => {
    const center = { lat: 18.8013, lng: 98.9525 }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google: any = (window as any).google
    const map = new google.maps.Map(mapEl.value as HTMLElement, {
      zoom: 15,
      center,
      styles: [
        { featureType: 'all', elementType: 'geometry.fill', stylers: [{ weight: '2.00' }] },
        { featureType: 'all', elementType: 'geometry.stroke', stylers: [{ color: '#9c9c9c' }] },
        { featureType: 'all', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
      ],
    })
    new google.maps.Marker({ position: center, map, title: 'Chiang Mai University' })
  }

  const script = document.createElement('script')
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=initMap`
  script.async = true
  script.defer = true
  script.onerror = () => { useIframe.value = true }
  document.head.appendChild(script)
})
</script>

<template>
  <section class="min-h-screen bg-zinc-100 flex items-center justify-center" data-aos="fade-up">
  <div class="w-full max-w-full mx-auto px-4 text-center">
  <h1 class="text-center text-2xl md:text-3xl font-bold text-zinc-800">About us</h1>

  <div class="flex justify-center items-center mt-8 w-full">
        <!-- Centered Info + Map card -->
  <div class="bg-white p-5 md:p-7 rounded-lg shadow-sm border border-zinc-200 w-full max-w-7xl mx-auto" data-aos="fade-right">
          <h2 class="text-xl font-semibold text-zinc-800 mb-4 text-center">Our Location</h2>

          <div class="space-y-4 text-zinc-800 flex flex-col items-center text-center">
            <div class="flex items-start gap-3 justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-orange-500">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <div class="text-sm md:text-base text-center">
                <p>Chiang Mai University</p>
                239 Huay Kaew Road, Suthep
                Muang District, Chiang Mai 50200
                Thailand
              </div>
            </div>

            <div class="flex items-center gap-3 justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-orange-500">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <p class="text-sm md:text-base">+66 53 941 000</p>
            </div>

            <div class="flex items-center gap-3 justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-orange-500">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <p class="text-sm md:text-base">CJStreetwear@gmail.com</p>
            </div>
          </div>

          <div class="h-[280px] md:h-[400px] rounded-lg overflow-hidden mt-5 border border-zinc-200" id="map">
            <div v-if="!useIframe" ref="mapEl" class="w-full h-full"></div>
            <iframe v-else :src="iframeSrc" class="w-full h-full" style="border:0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>
