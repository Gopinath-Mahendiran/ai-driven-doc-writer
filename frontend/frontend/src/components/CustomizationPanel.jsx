import { useState } from "react";

function CustomizationPanel({ _docStyle, _verbosity, _audience,_tone, _purpose }) {
  const [docStyle, setDocStyle] = useState("PEP257");
  const [verbosity, setVerbosity] = useState("Minimal");
  const [audience, setAudience] = useState("Beginner");
  const [tone, setTone] = useState("Neutral (default)");
  const [purpose, setPurpose] = useState("Beginner");

  const handleDocStyleChange = (e) => {
    const newDocStyle = e.target.value;
    setDocStyle(newDocStyle);
    _docStyle(newDocStyle);
  };

  return (
    <div className="customization-panel p-4 text-white rounded-xl shadow-lg border border-gray-700 z-50 bg-[#1e293b]">
      <div className="option-group">
        <label htmlFor="theme-select" className="block mb-2 text-xs font-medium text-gray-300">Documentation Style</label>
        <select
          id="theme-select"
          value={docStyle}
          onChange={handleDocStyleChange}
          className="w-[180px] p-1 rounded-md bg-gray-700 text-white border border-gray-600 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value='PEP257' title='Standard Python docstring style (PEP 257)' style={{ fontSize: '5rem' }}>PEP257 (default)</option>
          <option value='Google Style' title='Google-style docstrings with Args and Returns' style={{ fontSize: '2rem' }}>Google Style</option>
          <option value='NumPy Style' title='NumPy-style with Parameters and Returns sections' style={{ fontSize: '2rem' }}>NumPy Style</option>
          <option value='reStructuredText' title='Sphinx-style reStructuredText with param and</div> return tags' style={{ fontSize: '2rem' }}>reStructuredText (Sphinx)</option>
        </select>
        <p className="mt-1 text-xs text-gray-400">
          {{
            'PEP257': "Standard Python docstring style (PEP 257)",
            "Google Style": "Google-style docstrings with Args and Returns",
            "NumPy Style": "NumPy-style with Parameters and Returns sections",
            "reStructuredText": "Sphinx-style reStructuredText with param and return tags",
          }[docStyle]}
        </p>
      </div>
      <div className="option-group mt-3">
        <label htmlFor="font-size-select" className="block mb-2 text-xs font-medium text-gray-300">Verbosity Level</label>
        <select
          id="font-size-select"
          value={verbosity}
          onChange={(e) => {
            setVerbosity(e.target.value)
            _verbosity(e.target.value)
          }}
          className="w-[110px] p-1 rounded-md bg-gray-700 text-white border border-gray-600 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="Minimal" title="One-liner summary" style={{ fontSize: '1rem' }}>Minimal</option>
          <option value="Standard" title="Summary + params/returns" style={{ fontSize: '1rem' }}>Standard</option>
          <option value="Detailed" title="Includes edge cases, raises, example usage" style={{ fontSize: '1rem' }}>Detailed</option>
        </select>
        <p className="mt-1 text-xs text-gray-400">
          {{
            Minimal: "One-liner summary",
            Standard: "Summary + params/returns",
            Detailed: "Includes edge cases, raises, example usage",
          }[verbosity]}
        </p>
      </div>
      <div className="option-group mt-3">
        <label htmlFor="font-size-select" className="block mb-2 text-xs font-medium text-gray-300">Audience Targeting</label>
        <select
          id="font-size-select"
          value={audience}
          onChange={(e) => {
            setAudience(e.target.value)
            _audience(e.target.value)
          }}
          className="w-[110px] p-1 rounded-md bg-gray-700 text-white border border-gray-600 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="Beginner" title="Simple language, avoids jargon" style={{ fontSize: '1rem' }}>Beginner</option>
          <option value="Intermediate" title="Some technical context" style={{ fontSize: '1rem' }}>Intermediate</option>
          <option value="Expert" title="Assumes prior knowledge, includes internals" style={{ fontSize: '1rem' }}>Expert</option>
        </select>
        <p className="mt-1 text-xs text-gray-400">
          {{
            Beginner: "Simple language, avoids jargon",
            Intermediate: "Some technical context",
            Expert: "Assumes prior knowledge, includes internals",
          }[audience]}
        </p>
      </div>
      <div className="option-group mt-3">
        <label htmlFor="font-size-select" className="block mb-2 text-xs font-medium text-gray-300">Tone and Language Style</label>
        <select
          id="font-size-select"
          value={tone}
          onChange={(e) => {
            setTone(e.target.value)
            _tone(e.target.value)
          }}
          className="w-[110px] p-1 rounded-md bg-gray-700 text-white border border-gray-600 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="Neutral (default)">Neutral</option>
          <option value="Conversational">Conversational</option>
          <option value="Formal">Formal</option>
        </select>
        <p className="mt-1 text-xs text-gray-400">
          {{
            "Neutral (default)": "Clear and professional tone",
            Conversational: "Casual, human-like explanation",
            Formal: "Strict technical and professional language",
          }[tone]}
        </p>
      </div>
      <div className="option-group mt-3">
        <label htmlFor="font-size-select" className="block mb-2 text-xs font-medium text-gray-300">Doc Purpose or Context</label>
        <select
          id="font-size-select"
          value={purpose}
          onChange={(e) => {
            setPurpose(e.target.value)
            _purpose(e.target.value)
          }}
          className="w-[110px] p-1 rounded-md bg-gray-700 text-white border border-gray-600 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="Beginner" title="Simple language, avoids jargon" style={{ fontSize: '1rem' }}>Beginner</option>
          <option value="Intermediate" title="Some technical context" style={{ fontSize: '1rem' }}>Intermediate</option>
          <option value="Expert" title="Assumes prior knowledge, includes internals" style={{ fontSize: '1rem' }}>Expert</option>
        </select>
        <p className="mt-1 text-xs text-gray-400">
          {{
            Beginner: "For teaching or onboarding use cases",
            Intermediate: "For in-house development reference",
            Expert: "For expert-facing system/internal documentation",
          }[purpose]}
        </p>
      </div>

    </div>
  );
} 
export default CustomizationPanel;