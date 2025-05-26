import axios from "axios";


        const token = localStorage.getItem('token');

export let domain = window.location.hostname;
// const appURL = `${import.meta.env.HTTP_PROTOCOL}://api.${domain}:5000`
const appURL = `http://api.${domain}:5001`


const axiosInstance = axios.create({
    baseURL: appURL,
    withCredentials: true,
});

axiosInstance.interceptors.response.use(
    response => response,
    error => Promise.reject(error || "Something went wrong"),
);

// axiosInstance.defaults.withCredentials = true;
if(token){
    axiosInstance.defaults.headers.Authorization= `${token}`;
}

export default axiosInstance;