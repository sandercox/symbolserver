import axios from "axios";

const baseURL: string = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === "development") ? "http://localhost:4000" : "";

export default axios.create({ baseURL: baseURL, headers: { "Content-type": "application/json" } });
