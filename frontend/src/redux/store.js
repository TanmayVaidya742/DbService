

import { configureStore } from "@reduxjs/toolkit";
import dbaasSlice from "./ssoSlice";


export const store = configureStore({
    reducer: {
        dbaasStore: dbaasSlice.reducer,
        
    },
});
