import HttpApi from "./HttpApi";

export interface Symbol {
    id: string;
    filename: string;
    path: string;
    serveCount: number;
}

class SymbolService {
    upload(file: File, onUploadProgress: (progress:any)=>void) {
        let formData = new FormData();
        formData.append("filename", file);

        return HttpApi.post("/api/symbol", formData, { headers: { "Content-Type": "multipart/form-data" }, onUploadProgress });
    }

    remove(id: string) {
        return HttpApi.delete(`/api/symbol/${id}`);
    }

    async recentFiles(): Promise<Symbol[]> {
        return await (HttpApi.get<Symbol[]>("/api/symbols").then((response) => {
            return response.data;
        }))

    }
}
const symbolService = new SymbolService();
export default symbolService;