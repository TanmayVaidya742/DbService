import { createSlice } from '@reduxjs/toolkit'

const dbaasSlice = createSlice({
  name: 'dbaasSlice',
  initialState: {
    userData: {},
    unitAndAppDetails:{},
    refreshSidebar: false,
  },
  reducers: {
    setLoginData: (state, action) => {
      state.userData = action.payload
    },

    setUserData: (state, action) => {
      state.userData = action.payload
    },

    setUnitAndAppDetails: (state, action) => {
      state.unitAndAppDetails = action.payload
    },
    setRefreshSidebar: (state, action) => {
      state.refreshSidebar = action.payload
    }
  }
})
export const {
  setLoginData,
  setUserData,
  setUnitAndAppDetails,
  setRefreshSidebar,
  
} = dbaasSlice.actions

export default dbaasSlice
