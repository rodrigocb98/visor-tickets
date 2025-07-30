import React from "react";

const FileUploader = ({ onUpload }) => (
  <input type="file" accept=".csv" onChange={onUpload} className="file-input" />
);

export default FileUploader;
