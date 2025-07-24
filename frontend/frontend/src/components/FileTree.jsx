import { Tree } from "react-arborist";
import { useState } from "react";
import { FaFolder, FaFolderOpen, FaFile ,FaPython ,FaJsSquare, FaDatabase } from "react-icons/fa";
import { IoLogoReact } from "react-icons/io5";
import { LiaHtml5 ,LiaReadme} from "react-icons/lia";
import { BsFiletypeSvg,BsFiletypePng ,BsFiletypeCss,BsFiletypeJson ,BsFiletypeTxt} from "react-icons/bs";
import { BiEqualizer } from "react-icons/bi";
import { SiGitignoredotio } from "react-icons/si";

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

export default function FileTree({ onFileSelect, initialData = initialData }) {
  const [selected, setSelected] = useState(null);
  const onCreate = ({ parentId, index, type }) => {};
  const onRename = ({ id, name }) => {};
  const onMove = ({ dragIds, parentId, index }) => {};
  const onDelete = ({ ids }) => {};

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop();
    switch (ext) {
      case "js":
        return <FaJsSquare className="text-yellow-400" />;
      case "jsx":
        return <IoLogoReact className="text-blue-400" />
      case "html":
        return <LiaHtml5 className="text-orange-400" />
      case "json":
        return <BsFiletypeJson className="text-green-400" />;
      case "md":
        return <LiaReadme />;
      case "py":
        return <FaPython className="text-blue-400" />;
      case "svg":
        return <BsFiletypeSvg className="text-purple-400" />;
      case "png":
        return <BsFiletypePng className="text-green-400" />;
      case "env":
        return <BiEqualizer className="text-red-400" />;
      case "gitignore":
        return <SiGitignoredotio className="text-gray-400" />;
      case "css":
        return <BsFiletypeCss className="text-pink-400" />;
      case "sqlite3":
        return <FaDatabase className="text-yellow-500" />;
      case "txt":
        return <BsFiletypeTxt className="text-gray-400" />;
      default:
        return <FaFile  />;
    }
  };

  return (
    <Tree
      data={initialData}
      openByDefault={false}
      height={1000}
      width={220}
      className="h-full max-h-full w-full text-white text-sm overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
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
              onFileSelect?.(node.id);
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