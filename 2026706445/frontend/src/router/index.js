import { createMemoryHistory, createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import ProfileView from "../views/ProfileView.vue";
import PublicProfileView from "../views/PublicProfileView.vue";
import CommunityView from "../views/CommunityView.vue";
import RecommendationsView from "../views/RecommendationsView.vue";
import LoginView from "../views/LoginView.vue";
import AuthCallbackView from "../views/AuthCallbackView.vue";
import ProfileEditView from "../views/ProfileEditView.vue";
import PhysicalCardBuilderView from "../views/PhysicalCardBuilderView.vue";
import PhysicalCardOrderView from "../views/PhysicalCardOrderView.vue";
import PhysicalCardOrdersView from "../views/PhysicalCardOrdersView.vue";
import ContactRequestsView from "../views/ContactRequestsView.vue";
import SentRequestsView from "../views/SentRequestsView.vue";
import ProjectApplicationsManageView from "../views/ProjectApplicationsManageView.vue";
import AdminHomeView from "../views/AdminHomeView.vue";
import AdminMembersView from "../views/AdminMembersView.vue";
import AdminRequestsView from "../views/AdminRequestsView.vue";
import AdminAuditLogsView from "../views/AdminAuditLogsView.vue";
import AdminPhysicalCardOrdersView from "../views/AdminPhysicalCardOrdersView.vue";
import { registerAuthGuard } from "./authGuard.js";

export const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView
  },
  {
    path: "/profile",
    name: "profile",
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  {
    path: "/profiles/:slug",
    name: "public-profile",
    component: PublicProfileView
  },
  {
    path: "/community",
    name: "community",
    component: CommunityView
  },
  {
    path: "/recommendations",
    name: "recommendations",
    component: RecommendationsView
  },
  {
    path: "/contacts",
    name: "contact-requests",
    component: ContactRequestsView,
    meta: { requiresAuth: true }
  },
  {
    path: "/requests/sent",
    name: "sent-requests",
    component: SentRequestsView,
    meta: { requiresAuth: true }
  },
  {
    path: "/projects/manage",
    name: "project-applications-manage",
    component: ProjectApplicationsManageView,
    meta: { requiresAuth: true }
  },
  {
    path: "/admin",
    name: "admin-home",
    component: AdminHomeView,
    meta: { requiresAuth: true }
  },
  {
    path: "/admin/physical-card-orders",
    name: "admin-physical-card-orders",
    component: AdminPhysicalCardOrdersView,
    meta: { requiresAuth: true }
  },
  {
    path: "/admin/members",
    name: "admin-members",
    component: AdminMembersView,
    meta: { requiresAuth: true }
  },
  {
    path: "/admin/requests",
    name: "admin-requests",
    component: AdminRequestsView,
    meta: { requiresAuth: true }
  },
  {
    path: "/admin/audit-logs",
    name: "admin-audit-logs",
    component: AdminAuditLogsView,
    meta: { requiresAuth: true }
  },
  {
    path: "/login",
    name: "login",
    component: LoginView
  },
  {
    path: "/auth/callback",
    name: "auth-callback",
    component: AuthCallbackView
  },
  {
    path: "/profile/edit",
    name: "profile-edit",
    component: ProfileEditView,
    meta: { requiresAuth: true }
  },
  {
    path: "/print-cards/new",
    name: "physical-card-builder",
    component: PhysicalCardBuilderView,
    meta: { requiresAuth: true }
  },
  {
    path: "/print-cards/order",
    name: "physical-card-order",
    component: PhysicalCardOrderView,
    meta: { requiresAuth: true }
  },
  {
    path: "/print-cards/orders",
    name: "physical-card-orders",
    component: PhysicalCardOrdersView,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: typeof window === "undefined" ? createMemoryHistory() : createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

registerAuthGuard(router);

export default router;
