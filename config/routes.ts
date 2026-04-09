export const routes = {
  home: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  authCallback: "/auth/callback",
  dashboard: "/dashboard",
  createWebsite: "/create",
  profile: "/profile",
  generatedSites: "/generated-sites",
  generatedSite: (id: string) => `/generated-sites/${id}`,
};
