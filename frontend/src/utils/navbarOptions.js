import { Dashboard, Store } from "@mui/icons-material";

export const SUPER_ADMIN_NAVBAR = [
  {
    name: "Dashboard",
    route: "/superadmin-dashboard",
    icon: Dashboard,
    defaultRoute:true,
  },
];

export const USER_NAVBAR = [
  {
    name: "Dashboard",
    route: "/databases",
    icon: Dashboard ,
  },
   {
    name: "Pricing Plans",
    route: "/pricing",
    icon: Store,
  },
];
