import { useState, FC } from "react";
import { DropZone } from "./DropZone";
import SymbolService from "./SymbolApi";
import { ProgressBar } from "react-bootstrap";

export interface ProgressInfo {
  progress: number;
  filename: string;
}

export const UploadSymbols: FC = () => {
  const [files, setFiles] = useState<ProgressInfo[]>([]);

  return (
    <>
      <DropZone
        style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px",
          borderWidth: "5",
          borderRadius: "2",
          borderColor: "#eeeeee",
          borderStyle: "dashed",
          backgroundColor: "#fafafa",
          height: "200px",
          paddingTop: "80px",
          color: "#bdbdbd",
          outline: "none",
          transition: "border .24s ease-in-out"
        }}
        activeStyle={{ borderColor: "#2196f3" }}
        acceptStyle={{ borderColor: "#00e676" }}
        rejectStyle={{ borderColor: "#ff1744" }}
        onDrop={(uploadFiles) => {
          let _myfiles: ProgressInfo[] = [...files];
          uploadFiles.forEach((file) => {
            _myfiles.push({ filename: file.name, progress: 0 });
            const index = _myfiles.length - 1;
            SymbolService.upload(file, (progress) => {
              let _newFiles = [..._myfiles];
              _newFiles[index].progress = Math.round((progress.loaded / progress.total) * 100);
              setFiles(_newFiles);
            });
          });
          setFiles(_myfiles);
        }}
      />

      <div>
        {files
          .slice(-5)
          .reverse()
          .map((file, idx) => {
            return (
              <div style={{ paddingTop: "4px", paddingBottom: "2px" }}>
                <ProgressBar
                  key={idx}
                  now={file.progress}
                  label={`${file.filename} - ${file.progress}%`}
                />
              </div>
            );
          })}
      </div>
    </>
  );
};
