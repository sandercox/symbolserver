import { CSSProperties, FC, useMemo } from "react";
import { useDropzone } from "react-dropzone";

export interface DropZoneProps {
  accept?: string|string[];
  style?: CSSProperties | undefined;
  activeStyle?: CSSProperties | undefined;
  acceptStyle?: CSSProperties | undefined;
  rejectStyle?: CSSProperties | undefined;

  onDrop?: <T extends File>(acceptedFiles: T[]) => void;
}

export const DropZone: FC<DropZoneProps> = ({accept,style,activeStyle,acceptStyle,rejectStyle,onDrop}) => {
  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
      accept: accept, onDrop: (accepted, rejected, e) => {
          if(onDrop && accepted.length > 0)
            onDrop(accepted);
      }});

  const dropzoneStyle = useMemo(() => ({
        ...style,
        ...(isDragActive ? activeStyle : {}),
        ...(isDragAccept ? acceptStyle : {}),
        ...(isDragReject ? rejectStyle : {})
  }), [isDragActive, isDragReject, isDragAccept, acceptStyle, activeStyle, rejectStyle, style]);

  return (
    <div className="container">
      <div {...getRootProps({style: dropzoneStyle})}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop some files here, or click to select files</p>
      </div>
    </div>
  );
};
