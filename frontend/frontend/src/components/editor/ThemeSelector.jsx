import { useEffect, useState } from "react";
import { themelist } from "../Editor";

export default function ThemeSelector() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    // Remove all custom theme classes first
    document.documentElement.classList.remove("dark", "theme-steel", "theme-void");
    // Add current theme class if needed
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "steel") {
      document.documentElement.classList.add("theme-steel");
    } else if (theme === "void") {
      document.documentElement.classList.add("theme-void");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="flex gap-4 items-center text-sm text-gray-800 dark:text-gray-100">
      <label>Select Theme:</label>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="p-1 bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded"
      >
        {Object.entries(themelist).map(([key]) => (
          <option key={key} value={key}>
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}