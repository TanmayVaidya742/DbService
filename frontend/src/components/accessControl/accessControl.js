import { SUPER_ADMIN_NAVBAR, USER_NAVBAR } from "../../utils/navbarOptions";

export const navListBasedOnUserType = async (
  loggedInUser,
  dispatch,
  navigate
) => {
//   if (!loggedInUser) {
//     return [];
//   }
//   if (!loggedInUser.userType) {
//     return [];
//   }

  switch (loggedInUser.userType) {
    case "superadmin": {
      return SUPER_ADMIN_NAVBAR;
    }

    default: {
      return USER_NAVBAR;
    }
  }
};
