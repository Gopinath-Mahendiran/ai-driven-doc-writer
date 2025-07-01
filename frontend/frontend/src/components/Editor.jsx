import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { githubDark } from "@uiw/codemirror-theme-github";
import { nord } from "@uiw/codemirror-theme-nord";


function Editor({ initialCode, onCodeChange }) {
  const [code, setCode] = useState(initialCode || "");

  const handleCodeChange = (value) => {
    setCode(value);
    onCodeChange(value);
  };

  return (
    <div className="w-full h-full">
      <CodeMirror
        value={code}
        onChange={handleCodeChange}
        extensions={[python(),]}
        theme={nord}
        className="h-full"
      />
    </div>
  );
}

export default Editor;