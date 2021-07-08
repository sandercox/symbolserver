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

        return HttpApi.post("/symbol", formData, { headers: { "Content-Type": "multipart/form-data" }, onUploadProgress });
    }

    async recentFiles(): Promise<Symbol[]> {
        console.log("get on api");
        return await (HttpApi.get<Symbol[]>("/symbols").then((response) => {
            console.log("Get returned!");
            console.log(response);
            return response.data;
        }))

    }
}

export default new SymbolService();