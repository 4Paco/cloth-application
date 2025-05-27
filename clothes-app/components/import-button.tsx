import React from "react";

type ImportButtonProps = {
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    label?: string;
};

const ImportButton: React.FC<ImportButtonProps> = ({ onImport, label = "Import Pattern" }) => (
    <label
        style={{
            display: "inline-block",
            padding: "8px 16px",
            background: "#1976d2",
            color: "#fff",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: 500,
        }}
    >
        {label}
        <input
            type="file"
            accept=".json,.svg,.png,.jpg"
            style={{ display: "none" }}
            onChange={onImport}
        />
    </label>
);

export default ImportButton;