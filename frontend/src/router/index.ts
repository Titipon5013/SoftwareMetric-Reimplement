import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('../views/CheckoutView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/success',
      name: 'success',
      component: () => import('../views/SuccessView.vue'),
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('../views/CartView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('../views/ProductsView.vue'),
    },
     {
       path: '/favorites',
       name: 'favorites',
       component: () => import('../views/FavoritesView.vue'),
     },
    {
      path: '/products/:id',
      name: 'product-detail',
      component: () => import('../views/ProductDetailView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/SignupView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/admin/AdminLayout.vue'),
      meta: { requiresAdmin: true },
      children: [
        { path: '', name: 'admin-dashboard', component: () => import('../views/admin/AdminDashboard.vue') },
        { path: 'orders', name: 'admin-orders', component: () => import('../views/admin/AdminOrders.vue') },
        { path: 'categories', name: 'admin-categories', component: () => import('../views/admin/AdminCategories.vue') },
        { path: 'shipments', name: 'admin-shipments', component: () => import('../views/admin/AdminShipments.vue') },
        { path: 'products', name: 'admin-products', component: () => import('../views/admin/AdminProducts.vue') },
        { path: 'products/:id', name: 'admin-product-edit', component: () => import('../views/admin/AdminProductEdit.vue') },
        { path: 'inventory', name: 'admin-inventory', component: () => import('../views/admin/AdminInventory.vue') },
        { path: 'customers', name: 'admin-customers', component: () => import('../views/admin/AdminCustomers.vue') },
      ]
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('../views/admin/AdminLogin.vue'),
      meta: { guestOnly: true, adminArea: true },
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta?.requiresAuth && !auth.token) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta?.requiresAdmin) {
    if (!auth.token || auth.role !== 'admin') {
      return { name: 'admin-login', query: { redirect: to.fullPath } }
    }
  }
  if (to.meta?.guestOnly && auth.token) {
    // Admin login is special: allow navigating here to switch from user -> admin
    if (to.meta?.adminArea) {
      if (auth.role === 'admin') return { name: 'admin-dashboard' }
      // allow showing admin login even if user token exists
      return
    }
    return { name: 'home' }
  }
})

export default router
