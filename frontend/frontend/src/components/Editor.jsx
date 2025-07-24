import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { autocompletion } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import { githubDark } from "@uiw/codemirror-theme-github";
import { nord } from "@uiw/codemirror-theme-nord";
import { okaidia } from "@uiw/codemirror-theme-okaidia";
import { useState , useEffect } from 'react';
import api from '../api';
import { set } from 'idb-keyval';
import MyLoader from './DocstringLoader';


export const themelist = {
  light: "",         // You can use a light theme here if you want
  steel: nord,
  void: githubDark,
  okaidia: okaidia
};

export default function Editor({ initialCode, onCodeChange, selectedFile, repoName ,customizationOptions}) {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [docstring, setDocstring ] = useState("");
  const [editorView, setEditorView] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleSelection = (view) => {
    const selection = view.state.sliceDoc(
      view.state.selection.main.from,
      view.state.selection.main.to
    );
    if (selection) {
      setSelectedText(selection);
    } else {
    setSelectedText(""); // Clear selectedText when nothing is selected
  }
  };

function insertDocstring(docstring) {
  if (!editorView) return;

  const { from, to } = editorView.state.selection.main;

  const transaction = editorView.state.update({
    changes: {
      from,
      to,
      insert: docstring
    }
  });

  editorView.dispatch(transaction);
}

 const DocApiCall = () => {
    const fetchData = async () => {
      try {
        const response = await api.post('api/code/generate-docstring/', {
          code: selectedText,
          repo_name: repoName,
          file_path: selectedFile,
          customizationOptions: customizationOptions
        });
        if (response.status === 200) {
          const { docstring } = response.data;
          setDocstring(docstring);
          await set(selectedFile, docstring);
          setLoading(false);
        } else {
          console.error("Failed to generate docstring:", response.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (selectedText) {
      fetchData();
    }
  };

  useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowPopup(false);
    }
    if (e.key === 'g' && e.metaKey) {
      e.preventDefault(); // Prevent default browser action
      if (selectedText) {
        
        DocApiCall();
        setShowPopup(true);
        setLoading(true);
        console.log("Generating docstring for:", selectedText);
      }
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);

useEffect(() => {
  window.addEventListener("click", handleCloseMenu);
  return () => window.removeEventListener("click", handleCloseMenu);
}, []);

const handleContextMenu = (e) => {
    e.preventDefault(); // Prevent default browser context menu
    setShowMenu(true);
    setMenuPosition({ x: e.pageX, y: e.pageY });
  };

 const handleCloseMenu = () => {
    setShowMenu(false);
  };
  return (
    <div 
    onContextMenu={handleContextMenu}
    className="relative h-full w-full">
      <CodeMirror
        value={initialCode}
        height="200%"
        theme={githubDark}
        extensions={[
          python(),
          autocompletion(),
          EditorView.theme({
            "&": {
              backgroundColor: "transparent !important",
              color: "#ffffff",
              fontFamily: "'Fira Code', monospace",
              height: "100%",
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
            },
            ".cm-content": {
              caretColor: "#00ffee",
              backgroundColor: "transparent !important"
            },
            ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#00ffee" },
            ".cm-gutters": {
              color: "#4b5563",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "none",
            },
            ".cm-activeLine": {
              backgroundColor: "rgba(255, 255, 255, 0.05)"
            },
          }),
          EditorView.domEventHandlers({
            mouseup: (event, view) => {
              handleSelection(view);
            },
            contextmenu: (event, view) => {
              event.preventDefault(); // Disable default browser right-click

              const selection = view.state.sliceDoc(
                view.state.selection.main.from,
                view.state.selection.main.to
              );
              if (selection) setSelectedText(selection);
          },
          }),
        ]}
        onCreateEditor={(view) => setEditorView(view)}
        onChange={(value) => onCodeChange(value)}
      />
      {showPopup && (
  <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white/5 backdrop-blur-xl z-10 border border-white/20 rounded-lg shadow-lg p-4 w-[30rem] max-w-full">
    <button
      className="absolute top-2 right-3 text-lg text-gray-300 hover:text-red-500"
      onClick={() => setShowPopup(false)}
    >
      &times;
    </button>
    <pre className="text-white font-mono text-sm whitespace-pre-wrap overflow-auto max-h-[300px] scrollbar-hide">
      {loading ? (<MyLoader />) : (
       <code className="language-python">
        {docstring ? docstring : "No docstring generated yet."}
      </code>
    )}

    <div className="mt-4 flex justify-end space-x-2">
      <button className="inline-block text-white px-4 py-2 rounded-full bg-[#0f172a] backdrop-blur-xl hover:bg-green-600" onClick={() => {
    insertDocstring(docstring);
    setShowPopup(false); // Hide popup after insert
  }}>Accept</button>
      <button className="inline-block text-white px-4 py-2 rounded-full bg-[#0f172a] backdrop-blur-xl hover:bg-red-600">Reject</button>
    </div>
    </pre>
  </div>
)}

{showMenu && (
  <ul
    className="fixed z-50 min-w-[14rem] max-w-[18rem] bg-[#0f172a] text-xs text-white border border-[#2c2c32] shadow-xl rounded-md font-mono py-2"
    style={{
      top: menuPosition.y,
      left: menuPosition.x + 8, // slight offset to right of cursor
      listStyle: "none",
      margin: 0,
    }}
  >
    <li className="px-4  text-[11px] text-gray-400 uppercase tracking-wider">Assistant</li>
    <li>
      <button
        className={`flex justify-between items-center w-full text-left px-4 py-1 hover:bg-gray-700  transition-colors transition-duration-50 ${selectedText ? "" : "opacity-50 cursor-not-allowed"}`}
        onClick={() => {
          if (selectedText) {
            DocApiCall();
            setShowPopup(true);
            setLoading(true);
          }
          
        }}
      >
        <span>Generate with Assistant</span>
        <span className="text-gray-400">⌘ G</span>
      </button>
    </li>

    <li className="px-4 pt-3 pb-1 text-[11px] text-gray-400 uppercase tracking-wider">Code actions</li>
    <li>
      <button className="flex justify-between w-full text-left px-4 py-1 hover:bg-gray-700  transition-colors transition-duration-50">
        <span>Go to definition</span>
        <span className="text-gray-400">⌘ F12</span>
      </button>
    </li>
    <li>
      <button className="flex justify-between w-full text-left px-4 py-1 hover:bg-gray-700  transition-colors  transition-duration-50">
        <span>Go to type definition</span>
      </button>
    </li>
    <li>
      <button className="flex justify-between w-full text-left px-4 py-1 hover:bg-gray-700  transition-colors transition-duration-50">
        <span>Show references</span>
        <span className="text-gray-400">⇧ F12</span>
      </button>
    </li>
    <li>
      <button className="flex justify-between w-full text-left px-4 py-1 hover:bg-gray-700  transition-colors transition-duration-50">
        <span>Rename all occurrences</span>
        <span className="text-gray-400">F2</span>
      </button>
    </li>
    <li>
      <button className="flex justify-between w-full text-left px-4 py-1 hover:bg-gray-700  transition-colors transition-duration-50">
        <span>Format document</span>
        <span className="text-gray-400">⌘ S</span>
      </button>
    </li>

    <li className="px-4 pt-3 pb-1 text-[11px] text-gray-400 uppercase tracking-wider">Social</li>
    <li>
      <button className="flex justify-between w-full text-left px-4 py-1 hover:bg-gray-700  transition-colors transition-duration-50">
        <span>Start thread</span>
        <span className="text-gray-400">⌥ /</span>
      </button>
    </li>

    <li className="px-4 pt-3 pb-1 text-[11px] text-gray-400 uppercase tracking-wider">Clipboard</li>
    <li>
      <button
        className="flex justify-between w-full text-left px-4 py-1 hover:bg-gray-700  transition-colors transition-duration-50"
        onClick={() => {
          navigator.clipboard.writeText(selectedText || "");
          setContextMenu({ visible: false, x: 0, y: 0 });
        }}
      >
        <span>Copy</span>
        <span className="text-gray-400">⌘ C</span>
      </button>
    </li>
    <li>
      <button
        className="flex justify-between w-full text-left px-4 py-1 hover:bg-gray-700  transition-colors transition-duration-50"
        onClick={() => {
          navigator.clipboard.readText().then((text) => {
            insertDocstring(text);
          });

        }}
      >
        <span>Paste</span>
        <span className="text-gray-400">⌘ V</span>
      </button>
    </li>
    <li>
      <button
        className="flex justify-between w-full text-left px-4 py-1 text-red-400 hover:bg-gray-700  transition-colors transition-duration-50"
        onClick={() => {
          setShowMenu(false);
          setSelectedText("");
          setDocstring("");

        }}
      >
        <span>Cancel</span>
        <span className="text-gray-400">Esc</span>  
      </button>
    </li>
  </ul>
)}
    </div>
  );
}
