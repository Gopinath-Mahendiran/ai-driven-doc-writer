import { Tree } from "react-arborist";
import { useState } from "react";
import { FaFolder, FaFolderOpen, FaFile } from "react-icons/fa";
import { IoLogoReact } from "react-icons/io5";
import { LiaHtml5 } from "react-icons/lia";
import { LiaReadme } from "react-icons/lia";



const initialData = [
  {
    id: "1",
    name: "src",
    children: [
      {
        id: "2",
        name: "components",
        children: [
          { id: "3", name: "Navbar.jsx" },
          { id: "4", name: "Editor.jsx" },
        ],
      },
      { id: "5", name: "App.jsx" },
      { id: "6", name: "main.jsx" },
    ],
  },
  {
    id: "7",
    name: "public",
    children: [{ id: "8", name: "index.html" }],
  },
  {
    id: "9",
    name: "README.md",
  },
];

export default function FileTree({ onSelectFile }) {
  const [selected, setSelected] = useState(null);

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop();
    switch (ext) {
      case "js":
      case "jsx":
        return <IoLogoReact className="text-blue-400" />
      case "html":
        return <LiaHtml5 className="text-orange-400" />
      case "json":
        return <FaFile  />;
      case "md":
        return <LiaReadme />;
      default:
        return <FaFile  />;
    }
  };

  return (
    <Tree
      data={initialData}
      openByDefault
      className="text-white text-sm"
    >
      {({ node, style, dragHandle }) => (
        <div
          ref={dragHandle}
          style={style}
          className={`flex items-center gap-2 px-3 py-1 rounded transition-all cursor-pointer
            ${
              node.isSelected || node.id === selected
                ? "bg-gray-700 text-white"
                : "hover:bg-gray-800"
            }`}
          onClick={() => {
            if (node.children) {
              node.toggle();
            } else {
              setSelected(node.id);
              onSelectFile?.(node.data.name);
            }
          }}
        >
          {node.children ? (
            node.isOpen ? (
              <FaFolderOpen  className="text-gray-400" />
            ) : (
              <FaFolder  className="text-gray-400"/>
            )
          ) : (
            getFileIcon(node.data.name)
          )}
          <span className="truncate">{node.data.name}</span>
        </div>
      )}
    </Tree>
  );
}